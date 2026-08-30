// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { unified } from "@astrojs/markdown-remark";
import rehypeSlug from "rehype-slug";
import { siteConfig } from "./src/config/site.ts";
import { codeThemes, codeDefaultColor } from "./src/config/code.ts";
import { adminApiPlugin, adminDevOnlyIntegration } from "./scripts/admin-api.plugin.mjs";

import mdx from "@astrojs/mdx";

const shikiConfig = /** @type {const} */ ({
  themes: codeThemes,
  defaultColor: codeDefaultColor,
});

export default defineConfig({
  site: siteConfig.siteUrl,
  integrations: [
    sitemap({
      filter: (page) =>
        page !== new URL("/search/", siteConfig.siteUrl).toString() &&
        page !== new URL("/admin/", siteConfig.siteUrl).toString(),
    }),
    mdx(),
    adminDevOnlyIntegration(),
  ],
  markdown: {
    processor: unified({
      rehypePlugins: [rehypeSlug],
    }),
    shikiConfig,
  },
  vite: {
    /* adminApiPlugin only hooks Vite's dev-server middleware (configureServer),
       which never runs during `astro build` — it powers the local-only editor
       at /admin and ships nothing to the production build. */
    plugins: [tailwindcss(), adminApiPlugin()],
  },
});
