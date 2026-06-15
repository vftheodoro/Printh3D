import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Printh3D",
    short_name: "Printh3D",
    description:
      "Impressão 3D personalizada, peças funcionais e projetos sob medida.",
    start_url: "/",
    display: "standalone",
    background_color: "#030712",
    theme_color: "#07101d",
    lang: "pt-BR",
    icons: [
      {
        src: "/assets/logos/logo_printh_padrão.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
