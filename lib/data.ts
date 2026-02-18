/**
 * data.ts — Live Kerala Mandi Price Fetcher (TypeScript)
 * ======================================================
 * Port of AiPriceEngine/data_manager.py → LivePriceInformer
 *
 * Fetches commodity prices from the Data.gov.in Agmarknet API
 * filtered by state = Kerala, then aggregates modal / min / max
 * prices across all returned market records.
 */

const MANDI_RESOURCE =
  "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

/* ─── Types ─── */

export interface MandiRecord {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  arrival_date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
}

export interface MarketPriceResult {
  avg_modal: number;
  min_price: number;
  max_price: number;
  record_count: number;
  markets: string[];
  districts: string[];
  records: MandiRecord[];
}

/* ─── Helpers ─── */

/** Title-case a string to match Agmarknet conventions (e.g. "rubber" → "Rubber"). */
function titleCase(str: string): string {
  return str
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Return a zero-value empty result. */
function emptyResult(): MarketPriceResult {
  return {
    avg_modal: 0,
    min_price: 0,
    max_price: 0,
    record_count: 0,
    markets: [],
    districts: [],
    records: [],
  };
}

/* ─── Main Fetcher ─── */

/**
 * Fetch live Kerala mandi prices for a given crop from Data.gov.in.
 *
 * @param cropId  - Crop identifier, e.g. "rubber", "coconut".
 * @param limit   - Maximum number of API records to request (default 100).
 * @returns Aggregated price data across all Kerala market records.
 *
 * @example
 * ```ts
 * const result = await fetchMarketPrice("rubber");
 * console.log(result.avg_modal);   // 17200.00
 * console.log(result.markets);     // ["Kottayam", "Kozhikode", ...]
 * ```
 */
export async function fetchMarketPrice(
  cropId: string,
  limit: number = 100,
): Promise<MarketPriceResult> {
  const apiKey = process.env.DATA_GOV_API_KEY ?? "";

  if (!apiKey) {
    console.warn("[data] DATA_GOV_API_KEY not set — skipping live fetch.");
    return emptyResult();
  }

  const commodity = titleCase(cropId);

  const params = new URLSearchParams({
    "api-key": apiKey,
    format: "json",
    "filters[state.keyword]": "Kerala",
    "filters[commodity]": commodity,
    limit: String(limit),
  });

  const url = `${MANDI_RESOURCE}?${params.toString()}`;

  let data: Record<string, unknown>;

  try {
    const resp = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(30_000), // 30 s timeout
    });

    if (!resp.ok) {
      console.error(`[data] Mandi API error: ${resp.status} ${resp.statusText}`);
      return emptyResult();
    }

    data = (await resp.json()) as Record<string, unknown>;
  } catch (err) {
    console.error("[data] Mandi API request failed:", err);
    return emptyResult();
  }

  // ---------------------------------------------------------------------------
  // Parse & clean records (mirrors Python data_manager.py L335-L380)
  // ---------------------------------------------------------------------------
  const rawRecords = (data.records ?? []) as Record<string, unknown>[];

  if (rawRecords.length === 0) {
    console.info(`[data] No Kerala records for '${commodity}'.`);
    return emptyResult();
  }

  const records: MandiRecord[] = [];

  for (const rec of rawRecords) {
    try {
      records.push({
        state: String(rec.state ?? ""),
        district: String(rec.district ?? ""),
        market: String(rec.market ?? ""),
        commodity: String(rec.commodity ?? ""),
        variety: String(rec.variety ?? ""),
        arrival_date: String(rec.arrival_date ?? ""),
        // API returns ₹/quintal → convert to ₹/kg (1 quintal = 100 kg)
        min_price: Number(rec.min_price ?? 0) / 100,
        max_price: Number(rec.max_price ?? 0) / 100,
        modal_price: Number(rec.modal_price ?? 0) / 100,
      });
    } catch {
      // Skip records with unparseable numeric fields
      continue;
    }
  }

  if (records.length === 0) {
    return emptyResult();
  }

  // ---------------------------------------------------------------------------
  // Aggregate
  // ---------------------------------------------------------------------------
  const modalPrices = records.map((r) => r.modal_price);
  const minPrices = records.map((r) => r.min_price);
  const maxPrices = records.map((r) => r.max_price);

  const avg = modalPrices.reduce((a, b) => a + b, 0) / modalPrices.length;

  const markets = [
    ...new Set(records.map((r) => r.market).filter(Boolean)),
  ].sort();

  const districts = [
    ...new Set(records.map((r) => r.district).filter(Boolean)),
  ].sort();

  console.info(
    `[data] Fetched ${records.length} Kerala records for '${commodity}' (avg ₹${avg.toFixed(2)}).`,
  );

  return {
    avg_modal: Math.round(avg * 100) / 100,
    min_price: Math.round(Math.min(...minPrices) * 100) / 100,
    max_price: Math.round(Math.max(...maxPrices) * 100) / 100,
    record_count: records.length,
    markets,
    districts,
    records,
  };
}
