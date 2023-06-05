export default defineAppConfig({
  docus: {
    title: "",
    description: "",
    image: "https://repository-images.githubusercontent.com/420050565/6459bd6d-fd45-4bce-918a-9c5fa62a0576",
    socials: {
      twitter: "hebilicious",
      github: "hebilicious"
    },
    github: {
      owner: "hebilicious",
      repo: "",
      branch: "main",
      dir: "docs/content",
      edit: true
    },
    aside: {
      level: 0,
      exclude: []
    },
    header: {
      logo: true,
      showLinkIcon: true,
      exclude: []
    },
    footer: {
      iconLinks: [
        {
          href: "https://nuxt.com",
          icon: "IconNuxtLabs"
        }
      ]
    }
  }
})
