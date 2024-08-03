// astro.config.ts
import { defineConfig } from 'astro/config';
import UnoCSS from 'unocss/astro';
import mdx from "@astrojs/mdx";
import remarkToc from 'remark-toc';
import path from 'path';
// import rehypeMinifyHtml from 'rehype-minify-html';
import node from "@astrojs/node";
import vue from "@astrojs/vue";

// https://astro.build/config
export default defineConfig({
  output: 'hybrid',
	// site: 'https://d8np9d3gafjj2.cloudfront.net',
  adapter: node({  // Add this block
    mode: 'standalone'
  }),
  integrations: [
    UnoCSS(),
    mdx({
      optimize: true,
      syntaxHighlight: 'shiki',
      shikiConfig: {
        theme: 'dracula'
      },
      remarkPlugins: [remarkToc],
      remarkRehype: {
        footnoteLabel: 'Footnotes'
      },
      gfm: false
    }),
    vue(),
  ],
  vite: {
    resolve: {
      alias: {
        '@': path.resolve('./src'),
      }
    },
  },
  experimental: {
    serverIslands: true,
  },
});
