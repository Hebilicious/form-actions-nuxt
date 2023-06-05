// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    "../packages/my-module/src/module"
    // "@example/my-module"
  ],
  devtools: {
    enabled: true
  },
  experimental: {
    renderJsonPayloads: true
  }
})
