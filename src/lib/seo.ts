import type { Metadata } from "next";

export function getSiteUrl() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_PUBLIC_URL ??
    "https://www.lucky-boloes.com";

  return siteUrl.replace(/\/+$/, "");
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
