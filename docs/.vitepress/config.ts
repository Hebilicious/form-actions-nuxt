import { defineConfig } from "vitepress"

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Nuxt Form Actions Docs",
  description: "Form Actions and Server Loaders paradigms for Nuxt.",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" }
    ],

    sidebar: [
      {
        text: "Getting Started",
        items: [
          { text: "Installation", link: "/get-started/installation" },
          { text: "Introduction", link: "/get-started/introduction" }
        ]
      },
      {
        text: "Usage",
        items: [
          { text: "Form Actions", link: "/usage/form-actions" },
          { text: "Server Loaders", link: "/usage/server-loaders" },
          { text: "Advanced Usage", link: "/usage/advanced" }
        ]
      },
      {
        text: "Integrations",
        items: [
          { text: "Server Block", link: "/integrations/server-block" },
          { text: "Validation Libraries", link: "/integrations/validation-libraries" }
        ]
      }
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" }
    ]
  }
})
