import { NextRequest, NextResponse } from "next/server";
import { trpc } from "@/trpc/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }
  if (!state) {
    return NextResponse.json({ error: "Missing state" }, { status: 400 });
  }
  try {
    await trpc.facebook.facebookCallback({ code, state });
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    return NextResponse.json({ error: "Token exchange failed" }, { status: 500 });
  }
}
