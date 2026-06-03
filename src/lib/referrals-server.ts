import { cookies } from "next/headers";
import { normalizeInviteCode, REFERRAL_COOKIE_NAME } from "@/lib/referrals";

export async function getReferralCodeFromCookies() {
  const cookieStore = await cookies();
  return normalizeInviteCode(cookieStore.get(REFERRAL_COOKIE_NAME)?.value);
}

export async function clearReferralCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(REFERRAL_COOKIE_NAME);
}
