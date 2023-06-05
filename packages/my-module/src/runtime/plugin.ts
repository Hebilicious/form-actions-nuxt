import { useSomething } from "./composables/useSomething"
import { defineNuxtPlugin, useRuntimeConfig } from "#imports"

export default defineNuxtPlugin(async () => {
  const { something } = useSomething()

  const config = useRuntimeConfig()

  // eslint-disable-next-line no-console
  if (config) console.log(something)
})
