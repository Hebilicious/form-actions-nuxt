export default defineNuxtConfig({
  // modules: ["@hebilicious/server-block-nuxt", "@hebilicious/form-actions-nuxt"],
  modules: ["@hebilicious/server-block-nuxt", "../../packages/form-actions-nuxt/src/module.ts"],
  devtools: {
    enabled: true,
    timeline: {
      enabled: true
    }
  }
})
