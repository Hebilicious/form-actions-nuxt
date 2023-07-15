import { existsSync, promises as fsp } from "node:fs"
import { dirname, resolve as pathResolve } from "node:path"
import { addImports, addPlugin, addServerHandler, addTemplate, createResolver, defineNuxtModule, updateTemplates, useLogger, useNitro } from "@nuxt/kit"
import { generateCode, loadFile } from "magicast"
import { pascalCase } from "scule"
import type { NitroEventHandler } from "nitropack"
import { transform } from "esbuild"
import { GENERATED_TEXT, NITRO_LOADER_PREFIX, addLoaderPrefix, getActionRoute, getLoaderRoute, loaderTypesAfter, loaderTypesBefore } from "./runtime/utils"

export async function* walkFiles(dir: string): AsyncGenerator<string> {
  const entries = await fsp.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const res = pathResolve(dir, entry.name)
    if (entry.isDirectory()) {
      yield * walkFiles(res)
    }
    else {
      yield res
    }
  }
}

export async function writeLoader(file: Awaited<ReturnType<typeof loadFile<any>>>, loaderDirectoryPath = "", actionRoute = "") {
  file.exports.default = file.exports.loader
  delete file.exports.loader
  // If we have relative imports, we add one level of nesting because we move
  // from /actions to .generated/.loader
  for (const [key, imp] of Object.entries(file.imports)) {
    if (imp.from.startsWith("../")) {
      file.imports[key].from = `../${imp.from}`
    }
  }
  const { code } = generateCode(file) // We extract it with magicast...
  const shaked = await transform(code, { treeShaking: true, loader: "ts" }) // ...we clean it with esbuild ...
  const handler = `${loaderDirectoryPath}/${actionRoute}.get.ts`
  if (!existsSync(dirname(handler))) await fsp.mkdir(dirname(handler), { recursive: true })
  await fsp.writeFile(handler, GENERATED_TEXT)
  await fsp.appendFile(handler, shaked.code) // ...and we write it to the loader directory.
  return handler
}

const name = "form-actions"
export default defineNuxtModule({
  meta: {
    name
  },
  async setup(userOptions, nuxt) {
    const logger = useLogger(name)
    const { resolve } = createResolver(import.meta.url)

    logger.info(`Adding ${name} module...`)

    // 1. Add useFormAction composables
    addImports(["useFormAction", "useLoader"].map(name => ({ name, from: resolve(`./runtime/composables/${name}`) })))

    // 2. Add v-enhance directive
    addPlugin(resolve("./runtime/plugin"))

    // 3. Add Module runtime
    nuxt.hook("nitro:config", (nitroConfig) => {
      nitroConfig.alias = nitroConfig.alias || {}
      nitroConfig.alias[`#${name}`] = resolve("./runtime/server")
    })

    const filename = `types/${name}.d.ts`
    addTemplate({
      filename,
      getContents: () => `
      declare module '#${name}' {
      ${["getRequestFromEvent", "respondWithResponse", "respondWithRedirect", "getFormData", "defineServerLoader", "defineFormActions", "actionResponse"]
        .map(name => `const ${name}: typeof import('${resolve("./runtime/server")}')['${name}']`).join("\n")}
      }`
    })

    nuxt.hook("prepare:types", (options) => {
      options.references.push({ path: resolve(nuxt.options.buildDir, filename) })
    })

    // Add nitro auto-imports
    addImports(["defineServerLoader", "defineFormActions", "actionResponse"].map(name => ({ name, from: resolve("./runtime/server/nitro") })))
    // Add h3 auto-imports
    addImports(["getFormData"].map(name => ({ name, from: resolve("./runtime/server/h3") })))

    // 4. Local variables and setup
    const loaderTypesFilename = "types/loader-types.d.ts" as const
    const actionDirectoryPath = resolve(nuxt.options.srcDir, "server/actions")
    if (!existsSync(actionDirectoryPath)) await fsp.mkdir(actionDirectoryPath)

    // Loaders setup
    const loaderDirectoryPath = resolve(nuxt.options.srcDir, "server/.generated/.loader")
    if (!existsSync(loaderDirectoryPath)) {
      await fsp.mkdir(loaderDirectoryPath, { recursive: true })
      await fsp.writeFile(`${loaderDirectoryPath}/.gitignore`, "*")
    }

    function getLoaderCache() {
      type CacheValue = [NitroEventHandler, { name: string; filePath: string; url: string }]
      const loaderCache = new Map <string, CacheValue >()
      return {
        set: (actionRoute: string, value: CacheValue) => {
          loaderCache.set(actionRoute, value)
        },
        has: (url: string) => loaderCache.has(url),
        keys: () => loaderCache.keys(),
        values: () => loaderCache.values(),
        entries: () => loaderCache.entries()
      }
    }
    const loaderCache = getLoaderCache()

    const addLoaderTypes = () => {
      const loaders = () => Array.from(loaderCache.values())
      return addTemplate({
        filename: loaderTypesFilename,
        write: true,
        getContents: () => {
          const l = loaders()
          return `
          ${loaderTypesBefore}

          type LoaderUrl = ${l.map(l => `"${l[1].url}"`).join(" | ")}

          type LoaderName = ${l.map(l => `"${l[1].name}"`).join(" | ")}
          
          ${l.map(l => `type Loader${pascalCase(l[1].name)} = typeof import("${l[1].filePath}").default`).join("\n")}

          export interface Loaders {
            ${l.map(l => `"${l[1].name}": ExtractLoader<Loader${pascalCase(l[1].name)}>`).join("\n")}
          }

          ${loaderTypesAfter}
          `
        }
      })
    }

    nuxt.hook("nitro:config", async (nitro) => {
      // 5. Form Actions
      nitro.handlers = nitro.handlers || []

      for await (const actionPath of walkFiles(actionDirectoryPath)) {
        const actionRoute = getActionRoute(actionPath)
        const route = `/${actionRoute}`
        const file = await loadFile(actionPath)
        if (file.exports.default) {
          const formAction = { route, handler: actionPath, formAction: true }
          addServerHandler(formAction)
          logger.success(`[form-actions] {form action} added : '${route}'`)
        }

        // 6. defineServerLoader
        // Find loaders with magicast and add a  GET handler for each one of them.
        if (file.exports.loader) {
          const handler = await writeLoader(file, loaderDirectoryPath, actionRoute)
          const route = addLoaderPrefix(actionRoute)
          const loader = { method: "get", route, lazy: true, handler }
          addServerHandler(loader)
          logger.success(`[form-actions] {loader} added '${actionRoute}' at '${route}'`)
          loaderCache.set(actionRoute, [loader, { name: actionRoute, filePath: handler, url: route }]) // Add loader to the types array
        }
      }
      addLoaderTypes() // Add generated loader types.
      logger.success(`[form-actions] {loader} added to the config : ${[...loaderCache.keys()].join(", ")}`)
    })

    /**
     * Add a loader to the handlers and regenerate its types.
     */
    async function addLoader(handler: string, actionRoute: string, route: string) {
      if (!loaderCache.has(actionRoute)) {
        logger.info(`[form-actions] {loader} updated : '${handler}'`)
        const loader = { method: "get", route, lazy: true, handler }
        addServerHandler(loader)
        loaderCache.set(actionRoute, [loader, { name: actionRoute, filePath: handler, url: route }])
      }
      for (const [path, [handler]] of loaderCache.entries()) {
        if (useNitro().scannedHandlers.find(h => h.route === addLoaderPrefix(path))) continue // Skip if already added.
        logger.info(`[form-actions] {loader} added to Nitro : '${path}'`)
        useNitro().scannedHandlers.push({ ...handler, lazy: true })
      }
      updateTemplates({ filter: t => t.filename === loaderTypesFilename })
      // @todo find a way to refresh the nuxt data await nuxt.callHook("app:data:refresh")
      logger.success(`[form-actions] {loader} added new : '${actionRoute}' [${[...loaderCache.keys()].join(", ")}]`)
      logger.success(`[form-actions] scannedHandlers : [${useNitro().scannedHandlers.map(h => h.route).join(", ")}]`)
    }

    // On watch, add new actions, extract loaders and add loaders.
    nuxt.hook("builder:watch", async (event, path) => {
      try {
        if (!existsSync(path)) return // Return early if the path doesn't exist.
        if (!path.endsWith(".ts")) return // skip non-ts files
        if (path.includes("server/.generated/.loader") && path.endsWith(".get.ts")) { // Match generated loaders
          const route = getLoaderRoute(path)
          const actionRoute = route.replace(`/${NITRO_LOADER_PREFIX}/`, "")
          logger.info(`[form-actions] {loader} (generated) ${actionRoute}:${route}`)
          await addLoader(path, actionRoute, route)
        }
        if (path.includes("server/actions")) { // Match actions
          const actionRoute = getActionRoute(path)
          logger.info(`[form-actions] {action} '@${actionRoute}'`)
          const file = await loadFile(path)
          if (file) {
            // @todo figure out the difference between serverHandlers and scannedHandlers
            const hasNuxtHandler = nuxt.options.serverHandlers.some(h => h.handler === path)
            const hasNitroHandler = useNitro().scannedHandlers.find(h => h.handler === path)
            const action = { route: `/${actionRoute}`, handler: path, formAction: true }
            if (!hasNuxtHandler) {
              logger.info(`[form-actions] {action} nuxt added new : '${actionRoute}'`)
              addServerHandler(action)
            }
            if (!hasNitroHandler) {
              logger.info(`[form-actions] {action} nitro added new : '${actionRoute}'`)
              useNitro().scannedHandlers.push(action)
            }
            // If we have a loader, we extract it.
            if (file.exports.loader) {
              // @todo caching to not extract if the loader doesn't change
              const handler = await writeLoader(file, loaderDirectoryPath, actionRoute)
              const route = addLoaderPrefix(actionRoute)
              await addLoader(handler, actionRoute, route)
            }
          }
        }
      }
      catch (error) {
        logger.error(`[form-actions] error while handling '${event}'`, error)
      }
    })

    logger.success(`Added ${name} module successfully.`)
  }
})
