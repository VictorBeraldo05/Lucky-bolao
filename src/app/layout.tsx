import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import "./globals.css";
import { CartOverlay } from "@/components/cart/cart-overlay";
import { SiteHeader } from "@/components/site-header";
import { getHeaderUser } from "@/lib/auth";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";

const headingFont = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Lucky Bolões | Bolão Lotofácil Online",
    template: "%s | Lucky Bolões",
  },
  description: "Bolão Lotofácil online com compra de cotas, resultados, carteira, comprovantes e acompanhamento dos seus jogos.",
  applicationName: "Lucky Bolões",
  keywords: [
    "bolão lotofácil",
    "bolao lotofacil",
    "lotofácil online",
    "cotas lotofácil",
    "bolão online",
    "loterias caixa",
  ],
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: "Lucky Bolões | Bolão Lotofácil Online",
    description: "Compre cotas de bolão Lotofácil online, acompanhe resultados e gerencie seus jogos em um só lugar.",
    url: absoluteUrl("/"),
    siteName: "Lucky Bolões",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: absoluteUrl("/promo-indique-ganhe.png"),
        width: 1790,
        height: 888,
        alt: "Lucky Bolões",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lucky Bolões | Bolão Lotofácil Online",
    description: "Compre cotas de bolão Lotofácil online e acompanhe seus resultados.",
    images: [absoluteUrl("/promo-indique-ganhe.png")],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getHeaderUser();

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Lucky Bolões",
    url: getSiteUrl(),
    inLanguage: "pt-BR",
    potentialAction: {
      "@type": "SearchAction",
      target: `${getSiteUrl()}/loterias/lotofacil/boloes`,
      "query-input": "required name=search_term_string",
    },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Lucky Bolões",
    url: getSiteUrl(),
    logo: absoluteUrl("/lucky-clover.svg"),
  };

  return (
    <html lang="pt-BR" className={`${headingFont.variable} ${bodyFont.variable} h-full antialiased`}>
      <body className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(222,192,255,0.42),_transparent_30%),linear-gradient(180deg,#fcf7ff_0%,#f7f8ff_55%,#fefefe_100%)] text-slate-900">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <div className="flex min-h-screen flex-col">
          <SiteHeader user={user} />
          <main className="flex-1">{children}</main>
          <CartOverlay isAuthenticated={Boolean(user)} userCpf={user?.cpf ?? null} />
        </div>
      </body>
    </html>
  );
}
