import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { REFERRAL_COOKIE_NAME, normalizeInviteCode } from "@/lib/referrals";

type Params = Promise<{ code: string }>;

export async function GET(request: Request, context: { params: Params }) {
  const { code } = await context.params;
  const inviteCode = normalizeInviteCode(code);

  if (!inviteCode) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const inviter = await prisma.user.findUnique({
    where: { inviteCode },
    select: { id: true },
  });

  const destination = new URL(`/cadastro${inviter ? `?ref=${encodeURIComponent(inviteCode)}` : ""}`, request.url);
  const response = NextResponse.redirect(destination);

  if (inviter) {
    response.cookies.set(REFERRAL_COOKIE_NAME, inviteCode, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  } else {
    response.cookies.delete(REFERRAL_COOKIE_NAME);
  }

  return response;
}
