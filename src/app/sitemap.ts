import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/loterias"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/loterias/lotofacil"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/loterias/lotofacil/boloes"), lastModified: now, changeFrequency: "hourly", priority: 0.95 },
    { url: absoluteUrl("/resultados"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/como-funciona"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/login"), lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: absoluteUrl("/cadastro"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  try {
    const [lotteries, pools] = await Promise.all([
      prisma.lottery.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.pool.findMany({
        select: { code: true, updatedAt: true, status: true },
        orderBy: { updatedAt: "desc" },
        take: 200,
      }),
    ]);

    const lotteryRoutes: MetadataRoute.Sitemap = lotteries.map((lottery) => ({
      url: absoluteUrl(`/loterias/${lottery.slug}`),
      lastModified: lottery.updatedAt,
      changeFrequency: "daily",
      priority: lottery.slug === "lotofacil" ? 0.9 : 0.7,
    }));

    const poolRoutes: MetadataRoute.Sitemap = pools.map((pool) => ({
      url: absoluteUrl(`/boloes/${pool.code}`),
      lastModified: pool.updatedAt,
      changeFrequency: pool.status === "OPEN" ? "hourly" : "daily",
      priority: pool.status === "OPEN" ? 0.8 : 0.5,
    }));

    return [...staticRoutes, ...lotteryRoutes, ...poolRoutes];
  } catch {
    return staticRoutes;
  }
}
