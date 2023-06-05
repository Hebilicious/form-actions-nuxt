import { addImports, addPlugin, addTemplate, createResolver, defineNuxtModule, useLogger } from "@nuxt/kit"
import { defu } from "defu"

const NAME = "my-module"

export default defineNuxtModule({
  meta: {
    name: NAME,
    configKey: NAME
  },
  setup(userOptions, nuxt) {
    const logger = useLogger(NAME)
    const { resolve } = createResolver(import.meta.url)

    logger.info(`Adding ${NAME} module...`, userOptions)

    // 1. Set up runtime configuration
    const options = defu(nuxt.options.runtimeConfig.public[NAME], userOptions, {})
    nuxt.options.runtimeConfig.public[NAME] = options

    // 3. Add composables
    addImports([{ name: "useSomething", from: resolve("./runtime/composables/useSomething") }])

    // 4. Create virtual imports for server-side
    // @todo Contribute an helper to nuxt/kit to handle this scenario like this
    // addLibrary({name: "#auth", entry: "./runtime/lib", clientEntry: "./runtime/lib/client", serverEntry: "./runtime/lib/server"})

    // These will be available only in the /server directory
    nuxt.hook("nitro:config", (nitroConfig) => {
      nitroConfig.alias = nitroConfig.alias || {}
      nitroConfig.alias[`#${NAME}`] = resolve("./runtime/server")
    })

    // These will be available outside of the /server directory
    nuxt.options.alias[`#${NAME}`] = resolve("./runtime/client")

    // 4. Add types
    const filename = `types/${NAME}.d.ts`
    addTemplate({
      filename,
      getContents: () => [
        `declare module '#${NAME}' {`,
        `  const hello: typeof import('${resolve("./runtime/server")}').hello`,
        "}"
      ].join("\n")
    })

    nuxt.hook("prepare:types", (options) => {
      options.references.push({ path: resolve(nuxt.options.buildDir, filename) })
    })

    // 5. Add plugin & middleware
    addPlugin(resolve("./runtime/plugin"))

    logger.success(`Added ${NAME} module successfully.`)
  }
})
