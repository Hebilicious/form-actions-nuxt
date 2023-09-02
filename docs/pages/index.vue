<script setup>
definePageMeta({
  colorMode: "dark"
})
const title = "Nuxt Form Action"
const description = "A Nuxt module that enables Form actions and Server loaders paradigms for Nuxt."
useSeoMeta({
  titleTemplate: "",
  title,
  ogTitle: title,
  description,
  ogDescription: description
})
defineOgImage({
  component: "Docs",
  title,
  description
})
const source = ref("npm i @hebilicious/form-action-nuxt")
const { copy, copied } = useClipboard({ source })
</script>

<template>
  <span class="gradient" />
  <ULandingHero direction="horizontal" :ui="{ container: 'flex lg:gap-12' }">
    <Illustration class="hidden lg:block h-64" />
    <template #title>
      Form Actions and Server Loaders for your <span class="text-primary-400">Nuxt Apps</span>
    </template>
    <template #description>
      A Nuxt module that enables Form actions and Server loaders paradigms for Nuxt.
    </template>
    <template #links>
      <UButton to="/get-started/introduction" icon="i-ph-rocket-launch-duotone" size="xl">
        Get started
      </UButton>
      <UInput class="Install" aria-label="Copy code to get started" :model-value="source" name="get-started" disabled autocomplete="off" size="xl" :ui="{ base: 'disabled:cursor-default', icon: { trailing: { pointer: '' } } }">
        <template #leading>
          <UIcon name="i-ph-terminal" />
        </template>
        <template #trailing>
          <UButton aria-label="Copy Code" :color="copied ? 'green' : 'gray'" variant="ghost" :padded="false" :icon="copied ? 'i-ph-check-square-duotone' : 'i-ph-copy-duotone'" @click="copy(source)" />
        </template>
      </UInput>
    </template>
  </ULandingHero>
  <ULandingSection>
    <template #title>
      Handle form submissions with <br><span class="text-primary-400">simplicity.</span>
    </template>
    <UPageGrid>
      <UPageCard to="/usage/form-actions" title="Form Actions" icon="i-ph-codesandbox-logo">
        Learn how to handle form submissions with Form Actions.
      </UPageCard>
      <UPageCard to="/usage/server-loaders" title="Server Loaders" icon="i-ph-download">
        Learn how to use Server Loaders to simplify your data fetching.
      </UPageCard>
      <UPageCard to="/usage/advanced" title="Advanced" icon="i-ph-magic-wand-duotone">
        Multiple forms ? Optimistic updates ? We got you covered.
      </UPageCard>
      <UPageCard to="/integrations/validation-libraries" title="3rd party Integrations" icon="i-ph-plug-duotone">
        Integrate with Zod, Valibot, Vorms and all your favourite libraries.
      </UPageCard>
      <UPageCard to="/integrations/server-block" title="Server Block" icon="i-ph-frame-corners">
        Want to combine Form Actions and Loaders with the Server Block module ? You can.
      </UPageCard>
      <UPageCard to="/get-started/installation" title="Powerful Paradigms" icon="i-ph-rocket-launch-duotone">
        Form Actions are powerful and pleasant to work with.
      </UPageCard>
    </UPageGrid>
  </ULandingSection>
</template>

<style lang="postcss" scoped>
.gradient {
  position: fixed;
  top: 10rem;
  width: 100%;
  height: 30vh;
  background: radial-gradient(50% 50% at 50% 50%, #00DC82 0%, rgba(0, 220, 130, 0) 100%);
  filter: blur(180px);
  opacity: 0.5;
  z-index: -1;
  animation: colorChange 5s infinite alternate;
}

.Install {
    min-width: 35ch;
}
</style>
