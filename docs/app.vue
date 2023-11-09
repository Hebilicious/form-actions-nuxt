<script lang="ts" setup>
import type { ParsedContent } from "@nuxt/content/dist/runtime/types"

useServerSeoMeta({
  titleTemplate: "%s - Nuxt Image",
  ogUrl: "https://image.nuxt.com",
  ogSiteName: "Nuxt Image",
  twitterCard: "summary_large_image"
})
useHead({
  htmlAttrs: {
    lang: "en"
  }
})

const links = [{
  label: "Documentation",
  icon: "i-heroicons-book-open-solid",
  to: "/get-started/introduction"
}, {
  label: "Releases",
  icon: "i-heroicons-rocket-launch-solid",
  to: "https://github.com/Hebilicious/form-actions-nuxt/releases",
  target: "_blank"
}]

const socialLinks = [{
  label: "Nuxt Website",
  icon: "i-simple-icons-nuxtdotjs",
  to: "https://nuxt.com"
}, {
  label: "Hebilicious on X",
  icon: "i-simple-icons-x",
  to: "https://x.com/its_hebilicious"
}, {
  label: "Form Actions Nuxt on GitHub",
  icon: "i-simple-icons-github",
  to: "https://github.com/Hebilicious/form-actions-nuxt"
}]

const { data: files } = useLazyFetch<ParsedContent[]>("/api/search.json", {
  default: () => [],
  server: false
})
const navigation = await useNavigation()
</script>

<template>
  <UHeader :links="links">
    <template #logo>
      <Logo class="w-8 h-8" /> Nuxt <span class="text-primary-400">FormAction</span>
    </template>
    <template #right>
      <UColorModeButton v-if="!$colorMode.forced" />
      <UButton v-for="link in socialLinks" :key="link.label" :aria-label="link.label" :icon="link.icon" :to="link.to" color="gray" variant="ghost" />
    </template>
    <!-- Mobile panel -->
    <template v-if="$route.path !== '/'" #panel>
      <LazyUDocsSearchButton size="md" class="w-full mb-4" />
      <LazyUNavigationTree :links="mapContentNavigation(navigation)" default-open :multiple="false" />
    </template>
  </UHeader>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <UFooter :links="links">
    <template #left>
      <span class="text-sm">
        Published under <NuxtLink to="https://github.com/Hebilicious/form-actions-nuxt" target="_blank" class="underline">
          MIT License
        </NuxtLink>
      </span>
    </template>
    <template #right>
      <UColorModeButton v-if="!$colorMode.forced" />
      <UButton v-for="link in socialLinks" :key="link.label" :aria-label="link.label" :icon="link.icon" :to="link.to" color="gray" variant="ghost" />
    </template>
  </UFooter>
  <ClientOnly>
    <LazyUDocsSearch :files="files" :navigation="navigation" :links="links" />
  </ClientOnly>
</template>

<style>
html.dark {
  color-scheme: dark;
}

.shiki {
  padding: 0.6rem;
  border-radius: 0.2rem;
  border: 1px solid #8882;
}

html.dark .shiki,
html.dark .shiki span {
  color: var(--s-dark) !important;
  background-color: var(--s-dark-bg) !important;
}
</style>
