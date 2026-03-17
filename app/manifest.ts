import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CBDemo – Passbolt Docker",
    short_name: "CBDemo",
    description:
      "Full-featured password manager for teams. Secure, open source, and self-hostable.",
    start_url: "/pricing",
    display: "standalone",
    background_color: "#171717",
    theme_color: "#4b92d9",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
