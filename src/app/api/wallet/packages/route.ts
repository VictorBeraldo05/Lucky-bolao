import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const packages = await prisma.walletPackage.findMany({ orderBy: { price: "asc" } });
  return NextResponse.json({ packages });
}
