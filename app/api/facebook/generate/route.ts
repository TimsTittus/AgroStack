import { NextResponse } from "next/server";
import { facebook_generateAuthUrl } from "@/platform/facebook/core";

export async function GET() {
  const url = await facebook_generateAuthUrl();
  return NextResponse.json({ url });
}