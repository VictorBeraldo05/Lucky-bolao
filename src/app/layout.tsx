import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { getHeaderUser } from "@/lib/auth";

const headingFont = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lucky Bolões",
  description: "Plataforma de bolões online para loterias da Caixa com foco inicial em Lotofácil.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getHeaderUser();

  return (
    <html
      lang="pt-BR"
      className={`${headingFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(222,192,255,0.42),_transparent_30%),linear-gradient(180deg,#fcf7ff_0%,#f7f8ff_55%,#fefefe_100%)] text-slate-900">
        <div className="flex min-h-screen flex-col">
          <SiteHeader user={user} />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
