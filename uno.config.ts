// unocss.config.ts
import { defineConfig } from "unocss";
import { presetMini } from "unocss";
import { presetTypography } from "unocss";
import { presetAttributify } from "unocss";
import { presetIcons } from "unocss";
import { presetWebFonts } from "unocss";
import { presetUno } from "unocss";

export default defineConfig({
  presets: [
    presetAttributify({}),
    presetTypography({}),
    presetUno({}),
    presetMini({}),
    presetWebFonts({
      provider: "google",
      fonts: {
        sans: [
          {
            name: "Source Sans Pro",
            weights: [
              "100",
              "200",
              "300",
              "400",
              "500",
              "600",
              "700",
              "800",
              "900",
            ],
            italic: true,
          },
        ],
      },
    }),

    presetIcons({
      scale: 1.2,
      warn: true,
      collections: {
        // https://icon-sets.iconify.design/mdi/
        mdi: () =>
          import("@iconify-json/mdi/icons.json").then((i) => i.default),
      },
      extraProperties: {
        "font-size": "1.2em",
        display: "inline-block",
        "vertical-align": "middle",
      },
    }),
  ],
  safelist: [],
});
