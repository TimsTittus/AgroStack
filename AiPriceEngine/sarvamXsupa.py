"""
sarvamXsupa.py -- MCP-compatible JSON-RPC 2.0 Server for AgroStack Inventory
=============================================================================
Exposes exactly two tools via a POST /mcp endpoint:

  1) push_to_inventory  -- Insert a new inventory record
  2) pull_from_inventory -- Fetch inventory records (latest first)

Security:
  - Hardcoded table name (no dynamic SQL)
  - Parameterised queries only
  - No raw SQL exposure

Protocol:
  - JSON-RPC 2.0 over HTTP
  - Supports: initialize, tools/list, tools/call

Run standalone:
  uvicorn AiPriceEngine.sarvamXsupa:app --host 0.0.0.0 --port 9090
"""

from __future__ import annotations

import json
import logging
import os
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from psycopg2 import pool as pg_pool
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

logger = logging.getLogger("agrostack.mcp")

# ---------------------------------------------------------------------------
# Database Connection Pool
# ---------------------------------------------------------------------------

DATABASE_URL: str = os.getenv("DATABASE_URL", "").strip('"')

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set in environment / .env")

_connection_pool: Optional[pg_pool.SimpleConnectionPool] = None


def _get_pool() -> pg_pool.SimpleConnectionPool:
    """Lazily initialise and return the psycopg2 connection pool."""
    global _connection_pool
    if _connection_pool is None or _connection_pool.closed:
        _connection_pool = pg_pool.SimpleConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=DATABASE_URL,
        )
        logger.info("Database connection pool created.")
    return _connection_pool


def _shutdown_pool() -> None:
    """Close all connections in the pool."""
    global _connection_pool
    if _connection_pool is not None and not _connection_pool.closed:
        _connection_pool.closeall()
        _connection_pool = None
        logger.info("Database connection pool closed.")


# ---------------------------------------------------------------------------
# Tool Definitions (MCP metadata)
# ---------------------------------------------------------------------------

TOOL_PUSH = {
    "name": "push_to_inventory",
    "description": "Insert a new inventory item",
    "inputSchema": {
        "type": "object",
        "properties": {
            "id": {"type": "string"},
            "cropName": {"type": "string"},
            "quantity": {"type": "number"},
            "unit": {"type": "string"},
            "marketPrice": {"type": "number"},
            "isProfitable": {"type": "boolean"},
            "addedAt": {"type": "string"},
        },
        "required": [
            "id",
            "cropName",
            "quantity",
            "unit",
            "marketPrice",
            "isProfitable",
            "addedAt",
        ],
    },
}

TOOL_PULL = {
    "name": "pull_from_inventory",
    "description": "Fetch inventory records",
    "inputSchema": {
        "type": "object",
        "properties": {
            "limit": {"type": "integer"},
        },
    },
}

TOOLS: List[dict] = [TOOL_PUSH, TOOL_PULL]

# ---------------------------------------------------------------------------
# Tool Implementations
# ---------------------------------------------------------------------------

_PUSH_REQUIRED_FIELDS = [
    "id", "cropName", "quantity", "unit",
    "marketPrice", "isProfitable", "addedAt",
]


def _push_to_inventory(params: Dict[str, Any]) -> Dict[str, Any]:
    """Insert a single row into the *inventory* table.

    Uses a parameterised INSERT -- no dynamic SQL, no table-name input.
    """
    missing = [f for f in _PUSH_REQUIRED_FIELDS if f not in params]
    if missing:
        raise ValueError(f"Missing required fields: {missing}")

    pool = _get_pool()
    conn = pool.getconn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO inventory
                    (id, "cropName", quantity, unit, "marketPrice", "isProfitable", "addedAt")
                VALUES
                    (%(id)s, %(cropName)s, %(quantity)s, %(unit)s,
                     %(marketPrice)s, %(isProfitable)s, %(addedAt)s)
                """,
                {
                    "id": params["id"],
                    "cropName": params["cropName"],
                    "quantity": params["quantity"],
                    "unit": params["unit"],
                    "marketPrice": params["marketPrice"],
                    "isProfitable": params["isProfitable"],
                    "addedAt": params["addedAt"],
                },
            )
        conn.commit()
        logger.info("Inserted inventory row id=%s", params["id"])
        return {"status": "success", "inserted_id": params["id"]}
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)


def _pull_from_inventory(params: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Fetch recent rows from the *inventory* table.

    ORDER BY "addedAt" DESC, LIMIT capped at 100 (default 10).
    """
    raw_limit = params.get("limit", 10)
    limit = max(1, min(int(raw_limit), 100))

    pool = _get_pool()
    conn = pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, "cropName", quantity, unit,
                       "marketPrice", "isProfitable", "addedAt"
                FROM inventory
                ORDER BY "addedAt" DESC
                LIMIT %s
                """,
                (limit,),
            )
            rows = cur.fetchall()
        # RealDictRow -> plain dict for JSON serialisation
        return [dict(r) for r in rows]
    finally:
        pool.putconn(conn)


# Dispatch map -- only these two tool names are valid.
_TOOL_DISPATCH: Dict[str, Any] = {
    "push_to_inventory": _push_to_inventory,
    "pull_from_inventory": _pull_from_inventory,
}

# ---------------------------------------------------------------------------
# JSON-RPC 2.0 Helpers
# ---------------------------------------------------------------------------


def _jsonrpc_ok(request_id: Any, result: Any) -> Dict[str, Any]:
    """Build a successful JSON-RPC 2.0 response."""
    return {"jsonrpc": "2.0", "id": request_id, "result": result}


def _jsonrpc_error(request_id: Any, code: int, message: str) -> Dict[str, Any]:
    """Build a JSON-RPC 2.0 error response."""
    return {
        "jsonrpc": "2.0",
        "id": request_id,
        "error": {"code": code, "message": message},
    }


# ---------------------------------------------------------------------------
# Request Schema
# ---------------------------------------------------------------------------

class JsonRpcRequest(BaseModel):
    """Minimal JSON-RPC 2.0 request envelope."""
    jsonrpc: str = "2.0"
    id: Any = None
    method: str
    params: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# FastAPI Application (standalone)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def _lifespan(application: FastAPI):
    """Manage DB pool lifecycle on startup / shutdown."""
    _get_pool()
    yield
    _shutdown_pool()


app = FastAPI(
    title="AgroStack MCP Server",
    version="0.1.0",
    lifespan=_lifespan,
)


@app.post("/mcp", response_class=JSONResponse)
async def mcp_endpoint(req: JsonRpcRequest) -> Dict[str, Any]:
    """Single MCP endpoint handling all JSON-RPC 2.0 methods.

    Supported methods
    -----------------
    * ``initialize``  -- return server capabilities
    * ``tools/list``  -- return tool metadata
    * ``tools/call``  -- execute a tool by name
    """
    rid = req.id
    method = req.method
    params = req.params or {}

    # ── initialize ───────────────────────────────────────────────
    if method == "initialize":
        return _jsonrpc_ok(rid, {"capabilities": {"tools": {}}})

    # ── tools/list ───────────────────────────────────────────────
    if method == "tools/list":
        return _jsonrpc_ok(rid, {"tools": TOOLS})

    # ── tools/call ───────────────────────────────────────────────
    if method == "tools/call":
        tool_name = params.get("name")
        tool_args = params.get("arguments", {})

        handler = _TOOL_DISPATCH.get(tool_name)  # type: ignore[arg-type]
        if handler is None:
            return _jsonrpc_error(rid, -32601, f"Unknown tool: {tool_name}")

        try:
            result = handler(tool_args)
            return _jsonrpc_ok(rid, result)
        except Exception as exc:
            logger.exception("tools/call %s failed", tool_name)
            return _jsonrpc_error(rid, -32000, str(exc))

    # ── unknown method ───────────────────────────────────────────
    return _jsonrpc_error(rid, -32601, f"Method not found: {method}")


# ---------------------------------------------------------------------------
# Sarvam AI Agent — POST /agent
# ---------------------------------------------------------------------------

SARVAM_API_KEY: str = os.getenv("SARVAM_API_KEY", "")
SARVAM_BASE_URL: str = os.getenv(
    "SARVAM_BASE_URL", "https://api.sarvam.ai"
).rstrip("/")

_AGENT_SYSTEM_PROMPT = (
    "You are an AgroStack AI assistant.\n"
    "If the user wants to insert inventory data, call push_to_inventory.\n"
    "If the user wants to fetch inventory data, call pull_from_inventory.\n"
    "Otherwise respond normally in English."
)

# Tool definitions formatted for Sarvam function-calling API
_SARVAM_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "push_to_inventory",
            "description": "Insert a new inventory item",
            "parameters": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "cropName": {"type": "string"},
                    "quantity": {"type": "number"},
                    "unit": {"type": "string"},
                    "marketPrice": {"type": "number"},
                    "isProfitable": {"type": "boolean"},
                    "addedAt": {"type": "string"},
                },
                "required": [
                    "id", "cropName", "quantity", "unit",
                    "marketPrice", "isProfitable", "addedAt",
                ],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "pull_from_inventory",
            "description": "Fetch inventory records",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {"type": "integer"},
                },
            },
        },
    },
]


class AgentRequest(BaseModel):
    """Incoming request body for the /agent endpoint."""
    message: str


def _extract_tool_call(response_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Extract a tool call from Sarvam's response, if present.

    Supports two common response shapes:
      1) Top-level ``tool_call`` key
      2) OpenAI-style ``choices[0].message.tool_calls[0]``
    Returns ``{"name": ..., "arguments": ...}`` or None.
    """
    # Shape 1: top-level tool_call
    tc = response_data.get("tool_call")
    if tc and isinstance(tc, dict) and "name" in tc:
        args = tc.get("arguments", {})
        if isinstance(args, str):
            args = json.loads(args)
        return {"name": tc["name"], "arguments": args}

    # Shape 2: choices → message → tool_calls
    choices = response_data.get("choices", [])
    if choices:
        msg = choices[0].get("message", {})
        tool_calls = msg.get("tool_calls", [])
        if tool_calls:
            fn = tool_calls[0].get("function", {})
            name = fn.get("name")
            args = fn.get("arguments", {})
            if isinstance(args, str):
                args = json.loads(args)
            if name:
                return {"name": name, "arguments": args}

    return None


def _extract_text(response_data: Dict[str, Any]) -> str:
    """Extract plain-text content from Sarvam's response."""
    # Top-level response key
    if "response" in response_data and isinstance(response_data["response"], str):
        return response_data["response"]

    # OpenAI-style choices
    choices = response_data.get("choices", [])
    if choices:
        msg = choices[0].get("message", {})
        content = msg.get("content")
        if content:
            return content

    # Fallback
    return response_data.get("text", str(response_data))


async def _sarvam_chat(
    client: httpx.AsyncClient,
    messages: List[Dict[str, Any]],
    include_tools: bool = True,
) -> Dict[str, Any]:
    """Send a chat-completion request to the Sarvam AI API.

    Raises httpx.HTTPStatusError on non-2xx responses.
    """
    payload: Dict[str, Any] = {
        "model": "sarvam-m",
        "messages": messages,
    }
    if include_tools:
        payload["tools"] = _SARVAM_TOOLS

    headers = {
        "Authorization": f"Bearer {SARVAM_API_KEY}",
        "Content-Type": "application/json",
    }

    resp = await client.post(
        f"{SARVAM_BASE_URL}/v1/chat/completions",
        json=payload,
        headers=headers,
        timeout=30.0,
    )
    resp.raise_for_status()
    return resp.json()


@app.post("/agent")
async def agent_endpoint(req: AgentRequest) -> Dict[str, Any]:
    """Sarvam AI agent with single-step MCP tool execution.

    Flow
    ----
    1. Send user message + tool definitions to Sarvam.
    2. If Sarvam returns a tool call → execute via internal dispatch.
    3. Send tool result back to Sarvam for a final English summary.
    4. Return the final response to the frontend.
    """
    if not SARVAM_API_KEY:
        return {"response": "SARVAM_API_KEY is not configured.", "tool_used": None}

    user_message = req.message.strip()
    if not user_message:
        return {"response": "Please provide a message.", "tool_used": None}

    messages = [
        {"role": "system", "content": _AGENT_SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]

    try:
        async with httpx.AsyncClient() as client:
            # ── Step 1: First Sarvam call (with tools) ───────────
            sarvam_resp = await _sarvam_chat(client, messages, include_tools=True)
            tool_call = _extract_tool_call(sarvam_resp)

            # ── No tool call → return plain text ─────────────────
            if tool_call is None:
                return {
                    "response": _extract_text(sarvam_resp),
                    "tool_used": None,
                }

            tool_name: str = tool_call["name"]
            tool_args: Dict[str, Any] = tool_call["arguments"]

            # ── Step 2: Execute tool via internal dispatch ───────
            handler = _TOOL_DISPATCH.get(tool_name)
            if handler is None:
                return {
                    "response": f"Unknown tool requested: {tool_name}",
                    "tool_used": None,
                }

            try:
                tool_result = handler(tool_args)
            except Exception as exc:
                logger.exception("Agent tool execution failed: %s", tool_name)
                return {
                    "response": f"Tool execution failed: {exc}",
                    "tool_used": tool_name,
                    "tool_result": None,
                }

            # ── Step 3: Second Sarvam call with tool result ──────
            followup_messages = [
                {"role": "system", "content": _AGENT_SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
                {
                    "role": "assistant",
                    "content": None,
                    "tool_calls": [
                        {
                            "id": "call_1",
                            "type": "function",
                            "function": {
                                "name": tool_name,
                                "arguments": json.dumps(tool_args, default=str),
                            },
                        }
                    ],
                },
                {
                    "role": "tool",
                    "tool_call_id": "call_1",
                    "content": json.dumps(tool_result, default=str),
                },
            ]

            final_resp = await _sarvam_chat(
                client, followup_messages, include_tools=False
            )
            final_text = _extract_text(final_resp)

            return {
                "response": final_text,
                "tool_used": tool_name,
                "tool_result": tool_result,
            }

    except httpx.HTTPStatusError as exc:
        logger.exception("Sarvam API error")
        return {
            "response": f"Sarvam API error: {exc.response.status_code}",
            "tool_used": None,
        }
    except Exception as exc:
        logger.exception("Agent endpoint error")
        return {
            "response": f"Internal error: {exc}",
            "tool_used": None,
        }
