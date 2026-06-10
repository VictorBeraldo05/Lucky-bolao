import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lucky Bolões",
    short_name: "Lucky",
    description: "Bolões online com compra de cotas, carteira, comprovantes e acompanhamento dos seus jogos.",
    start_url: "/",
    display: "standalone",
    background_color: "#fcf7ff",
    theme_color: "#c026d3",
    icons: [
      {
        src: "/lucky-clover.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
