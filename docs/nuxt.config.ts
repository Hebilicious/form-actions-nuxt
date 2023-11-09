// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true, timeline: true },
  extends: "@nuxt/ui-pro",
  modules: [
    "@nuxt/content",
    "@nuxt/image",
    "@nuxt/ui",
    "@vueuse/nuxt",
    "@nuxtjs/fontaine",
    "@nuxtjs/google-fonts",
    "nuxt-og-image"
  ],
  colorMode: {
    preference: "dark"
  },
  ui: {
    icons: ["heroicons", "simple-icons", "ph"]
  },
  fontMetrics: {
    fonts: ["DM Sans"]
  },
  googleFonts: {
    display: "swap",
    download: true,
    families: {
      "DM+Sans": [400, 500, 600, 700]
    }
  },
  nitro: {
    preset: "cloudflare-pages",
    routeRules: {
      "/": { prerender: true }
    },
    prerender: {
      crawlLinks: true
    }
  },
  experimental: {
    payloadExtraction: true,
    typedPages: true,
    componentIslands: true
  },
  hooks: {
    // Related to https://github.com/nuxt/nuxt/pull/22558
    // Adding all global components to the main entry
    // To avoid lagging during page navigation on client-side
    // Downside: bigger JS bundle
    // With sync: 465KB, gzip: 204KB
    // Without: 418KB, gzip: 184KB
    "components:extend": function (components) {
      for (const comp of components) {
        if (comp.global)
          comp.global = "sync"
      }
    }
  }
})
