import { redirect } from "next/navigation";
import { clearSessionCookie } from "@/lib/auth";

export default async function LogoutPage() {
  await clearSessionCookie();
  redirect("/login");
}
