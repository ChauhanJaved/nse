import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NSE Financial Analytics",
    short_name: "NSE Analytics",
    description: "Real-time Indian Stock Market Indexes, 52-Week High/Low Drawdown Gauges & 5-Year YoY Analytics",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#090D16",
    theme_color: "#090D16",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  };
}
