import { existsSync, promises as fsp } from "node:fs"
import { dirname, resolve as pathResolve } from "node:path"
import { addImports, addPlugin, addTemplate, addTypeTemplate, createResolver, defineNuxtModule, updateTemplates, useLogger, useNitro } from "@nuxt/kit"
import { generateCode, loadFile } from "magicast"
import { pascalCase } from "scule"
import type { NitroEventHandler } from "nitropack"
import { transform } from "esbuild"
import { GENERATED_TEXT, NITRO_LOADER_PREFIX, addLoaderPrefix, getActionRoute, getLoaderRoute, loaderTypesAfter, loaderTypesBefore } from "./runtime/utils"

export async function* walkFiles(dir: string): AsyncGenerator<string> {
  const entries = await fsp.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const res = pathResolve(dir, entry.name)
    if (entry.isDirectory()) yield * walkFiles(res)
    else yield res
  }
}

export async function writeLoader(file: Awaited<ReturnType<typeof loadFile<any>>>, loaderDirectoryPath = "", routeName = "") {
  file.exports.default = file.exports.loader
  delete file.exports.loader
  // If we have relative imports, we add one level of nesting because we move
  // from /actions to .generated/.loader
  for (const [key, imp] of Object.entries(file.imports))
    if (imp.from.startsWith("../")) file.imports[key].from = `../${imp.from}`

  const { code } = generateCode(file) // We extract it with magicast...
  const shaked = await transform(code, { treeShaking: true, loader: "ts" }) // ...we clean it with esbuild ...
  const handler = `${loaderDirectoryPath}/${routeName}.get.ts`
  if (!existsSync(dirname(handler))) await fsp.mkdir(dirname(handler), { recursive: true })
  await fsp.writeFile(handler, GENERATED_TEXT)
  await fsp.appendFile(handler, shaked.code) // ...and we write it to the loader directory.
  return handler
}

const name = "form-actions"
export default defineNuxtModule({
  meta: {
    name,
    compatibility: { nuxt: ">=3" }
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

    const serverUtilities = ["defineServerLoader", "defineFormActions", "actionResponse"]
    addTypeTemplate({
      filename: `types/${name}.d.ts`,
      write: true,
      getContents: () => `
      declare module '#${name}' {
      ${serverUtilities.map(name => `const ${name}: typeof import('${resolve("./runtime/server")}')['${name}']`).join("\n")}
      }`
    })

    // Add nitro auto-imports
    addImports(serverUtilities.map(name => ({ name, from: resolve("./runtime/server/nitro") })))

    // 4. Local variables and setup
    const loaderTypesFilename = "types/loader-types.d.ts" as const
    const actionDirectoryPath = resolve(nuxt.options.srcDir, "server/actions")
    if (!existsSync(actionDirectoryPath)) await fsp.mkdir(actionDirectoryPath)

    // Loaders setup
    const loaderDirectoryPath = resolve(nuxt.options.srcDir, "server/.generated/.loader")
    if (existsSync(loaderDirectoryPath)) await fsp.rm(loaderDirectoryPath, { recursive: true })
    await fsp.mkdir(loaderDirectoryPath, { recursive: true })
    await fsp.writeFile(`${loaderDirectoryPath}/.gitignore`, "*")

    const loaderCache = new Map<string, [NitroEventHandler, { name: string; filePath: string; url: string }] >()
    const actionCache = new Map<string, [NitroEventHandler]>()

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

    nuxt.hook("nitro:config", async () => {
      // 5. Form Actions
      for await (const actionPath of walkFiles(actionDirectoryPath)) {
        const routeName = getActionRoute(actionPath)
        const file = await loadFile(actionPath)
        if (file.exports.default) {
          const route = `/${routeName}`
          actionCache.set(routeName, [{ route, method: "post", handler: actionPath }])
        }

        // 6. defineServerLoader
        // Find loaders with magicast and add a  GET handler for each one of them.
        if (file.exports.loader) {
          const handler = await writeLoader(file, loaderDirectoryPath, routeName)
          const route = addLoaderPrefix(routeName)
          const loader = { method: "get", route, lazy: true, handler }
          loaderCache.set(routeName, [loader, { name: routeName, filePath: handler, url: route }]) // Add loader to the types array
        }
      }
      addLoaderTypes() // Add generated loader types.
      logger.success(`[form-actions] {action} added to the config : ${[...actionCache.keys()].join(", ")}`)
      logger.success(`[form-actions] {loader} added to the config : ${[...loaderCache.keys()].join(", ")}`)
    })

    // We add all the handlers at once.
    nuxt.hook("ready", async () => {
      for (const [loader] of loaderCache.values()) useNitro().options.handlers.push(loader)
      for (const [action] of actionCache.values()) useNitro().options.handlers.push(action)
      logger.success(`[form-actions] {handlers} added to Nitro : ${[...actionCache.keys(), ...loaderCache.keys()].join(", ")}`)
    })

    /**
     * Add a loader to the handlers and regenerate its types.
     */
    async function addLoader(handler: string, routeName: string, route: string) {
      if (!loaderCache.has(routeName)) {
        logger.info(`[form-actions] {loader} : '${handler}' ...`)
        const loader = { method: "get", route, lazy: true, handler }
        loaderCache.set(routeName, [loader, { name: routeName, filePath: handler, url: route }])
      }
      for (const [path, [handler]] of loaderCache.entries()) {
        if (useNitro().options.handlers.some(h => h.route === addLoaderPrefix(path))) continue // Skip if already added.
        useNitro().options.handlers.push(handler)
        logger.info(`[form-actions] {loader} added to Nitro : '${path}'`)
      }
      updateTemplates({ filter: t => t.filename === loaderTypesFilename })
      // @todo find a way to refresh the nuxt data: useNuxt().callHook.callHook("app:data:refresh")
      logger.success(`[form-actions] {loader} added new : '${routeName}' [${[...loaderCache.keys()].join(", ")}]`)
    }

    /**
     * Add an action to the handlers.
     */
    async function addAction(handler: string, routeName: string, route: string) {
      if (!actionCache.has(routeName)) {
        logger.info(`[form-actions] {action} '${handler}' ...`)
        actionCache.set(routeName, [{ route, method: "post", handler, lazy: true }])
      }
      for (const [path, [handler]] of actionCache.entries()) {
        if (useNitro().options.handlers.some(h => h.handler === path)) continue // Skip if already added.
        useNitro().options.handlers.push(handler)
        logger.info(`[form-actions] {action} added to Nitro : '${path}'`)
      }
    }

    /**
     * Load and add handlers for a filepath.
     */
    async function addHandlers(path: string, event?: string) {
      if (!existsSync(path)) return // Return early if the path doesn't exist.
      if (!path.endsWith(".ts")) return // skip non-ts files
      if (path.includes("server/.generated/.loader") && path.endsWith(".get.ts")) { // Match generated loaders
        const route = getLoaderRoute(path)
        const routeName = route.replace(`/${NITRO_LOADER_PREFIX}/`, "")
        logger.info(`[form-actions] {loader}<@${event}> (generated) '${routeName}'=>'${route}'`)
        await addLoader(path, routeName, route)
      }
      if (path.includes("server/actions")) { // Match actions
        const routeName = getActionRoute(path)
        logger.info(`[form-actions] {action}<@${event}> '${routeName}'`)
        const file = await loadFile(path)
        if (file) {
          await addAction(path, routeName, `/${routeName}`)
          // If we have a loader, we extract it.
          if (file.exports.loader) {
            // @todo caching to not extract if the loader doesn't change
            const handler = await writeLoader(file, loaderDirectoryPath, routeName)
            await addLoader(handler, routeName, addLoaderPrefix(routeName))
          }
          logger.success(`[form-actions] nitro handlers : [${useNitro().options.handlers.map(h => h.route).join(", ")}]`)
        }
      }
    }

    // Add external loaders without relying on build:watch
    nuxt.hook("nitro:build:before", async () => {
      for await (const loaderPath of walkFiles(loaderDirectoryPath))
        await addHandlers(loaderPath, "nitro:build:before")
    })

    // On watch, add new actions, extract loaders and add loaders.
    nuxt.hook("builder:watch", async (event, path) => {
      try {
        await addHandlers(path, event)
      }
      catch (error) {
        logger.error(`[form-actions] error while handling '${event}'`, error)
      }
    })

    logger.success(`Added ${name} module successfully.`)
  }
})
