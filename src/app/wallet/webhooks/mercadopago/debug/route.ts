import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Webhook debug endpoint is active. Send a POST request to inspect payload.",
  });
}

export async function POST(request: Request) {
  const bodyText = await request.text();
  let body: unknown;

  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    body = bodyText;
  }

  const headers: Record<string, string | null> = {};
  for (const [key, value] of request.headers.entries()) {
    headers[key] = value;
  }

  console.log("[MercadoPago debug webhook] headers:", headers);
  console.log("[MercadoPago debug webhook] body:", body);

  return NextResponse.json({
    status: "received",
    headers,
    body,
  });
}
