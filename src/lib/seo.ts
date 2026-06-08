import type { Metadata } from "next";

function normalizeLegacySiteDomain(siteUrl: string) {
  try {
    const url = new URL(siteUrl);

    if (url.hostname === "lucky-boloes.online") {
      url.hostname = "lucky-boloes.com";
    }

    if (url.hostname === "www.lucky-boloes.online") {
      url.hostname = "www.lucky-boloes.com";
    }

    return url.toString().replace(/\/+$/, "");
  } catch {
    return siteUrl.replace(/lucky-boloes\.online/gi, "lucky-boloes.com").replace(/\/+$/, "");
  }
}

export function getSiteUrl() {
  const rawSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_PUBLIC_URL ??
    "https://www.lucky-boloes.com";

  const normalizedSiteUrl = rawSiteUrl.match(/^https?:\/\//i) ? rawSiteUrl : `https://${rawSiteUrl}`;

  return normalizeLegacySiteDomain(normalizedSiteUrl);
}

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}

type BuildMetadataInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  imagePath?: string;
};

export function buildMetadata({
  title,
  description,
  path = "/",
  keywords = [],
  imagePath = "/promo-indique-ganhe.png",
}: BuildMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(imagePath);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Lucky Bolões",
      locale: "pt_BR",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1790,
          height: 888,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}
