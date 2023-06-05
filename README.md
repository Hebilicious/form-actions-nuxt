# Nuxt Form Actions

[![CI](https://github.com/Hebilicious/form-actions-nuxt/actions/workflows/ci.yaml/badge.svg)](https://github.com/Hebilicious/form-actions-nuxt/actions/workflows/ci.yaml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🚀 Welcome to __Nuxt Form Actions__!  

This is a standalone Nuxt Module that implements https://github.com/nuxt/nuxt/pull/20852
You will need to patch Nitropack to use it.


## ⚠️ Disclaimer

_🧪 This module is really unstable and is not recommended for production use. The API might change_

# TODO

- Docs
- Tests

## Nice to Have

- Virtual file Loaders, moving loaders in .nuxt ?
- Vue macro to automatically bind v-enhance to single forms
- useFormActions to accept multiple syntax to shorten the api

## Nitro Modifications

Add the possibility to register fallback handlers. This is useful to register a post handler alongside the nuxt renderer.

`nitro.config.routesWithFallback = [{route: "/hello-world", fallbackTo: "/**", method: "get"}]`

When hitting /hello-world with a post request, the registered handler will be used.
But when hitting /hello-world with a get request, the handler for /** will be used, which is the Nitro nuxt renderer.


Here's a the modified Nitro app.mjs that you need until the official version is ready.
You can use a pnpm patch to apply it : `pnpm patch nitropack`, then paste this in nitropack/dist/runtime/app.mjs
and apply the patch.

```ts
import {
  createApp,
  createRouter,
  eventHandler,
  fetchWithEvent,
  lazyEventHandler,
  toNodeListener
} from "h3"
import { Headers, createFetch } from "ofetch"
import destr from "destr"
import {
  createCall,
  createFetch as createLocalFetch
} from "unenv/runtime/fetch/index"
import { createHooks } from "hookable"
import { useRuntimeConfig } from "./config.mjs"
import { cachedEventHandler } from "./cache.mjs"
import { createRouteRulesHandler, getRouteRulesForPath } from "./route-rules.mjs"
import { plugins } from "#internal/nitro/virtual/plugins"
import errorHandler from "#internal/nitro/virtual/error-handler"
import { handlers } from "#internal/nitro/virtual/server-handlers"

function createNitroApp() {
  const config = useRuntimeConfig()
  const hooks = createHooks()
  const h3App = createApp({
    debug: destr(process.env.DEBUG),
    onError: errorHandler
  })
  const router = createRouter()
  h3App.use(createRouteRulesHandler())
  const localCall = createCall(toNodeListener(h3App))
  const localFetch = createLocalFetch(localCall, globalThis.fetch)
  const $fetch = createFetch({
    fetch: localFetch,
    Headers,
    defaults: { baseURL: config.app.baseURL }
  })
  globalThis.$fetch = $fetch
  h3App.use(
    eventHandler((event) => {
      event.context.nitro = event.context.nitro || {}
      const envContext = event.node.req.__unenv__
      if (envContext) {
        Object.assign(event.context, envContext)
      }
      event.fetch = (req, init) => fetchWithEvent(event, req, init, { fetch: localFetch })
      event.$fetch = (req, init) => fetchWithEvent(event, req, init, { fetch: $fetch })
    })
  )
  const getHandlersWithFallbacks = (handlers, config) => {
    if (!config.routesWithFallback || config.routesWithFallback.length === 0) return handlers
    const routes = config.routesWithFallback.map(({ route }) => route)
    const routesWithFallbacks = handlers
      .filter(h => routes.includes(h.route))
      .map((h) => {
        const { fallbackTo, method = "get" } = config.routesWithFallback.find(({ route }) => route === h.route)
        return { ...h, fallback: true, fallbackTo, fallbackMethod: method }
      })
    return handlers.concat(routesWithFallbacks)
  }

  for (const h of getHandlersWithFallbacks(handlers, config)) {
    let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler
    if (h.middleware || !h.route) {
      const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(
        /\/+/g,
        "/"
      )
      h3App.use(middlewareBase, handler)
    }
    else {
      const routeRules = getRouteRulesForPath(
        h.route.replace(/:\w+|\*\*/g, "_")
      )
      if (routeRules.cache) {
        handler = cachedEventHandler(handler, {
          group: "nitro/routes",
          ...routeRules.cache
        })
      }
      if (h.fallback === true) {
        const fallback = handlers.find(({ route }) => route === h.fallbackTo)
        const fallbackHandler = h.lazy ? lazyEventHandler(fallback.handler) : fallback.handler
        router.use(h.route, fallbackHandler, h.fallbackMethod)
      }
      else {
        router.use(h.route, handler, h.method)
      }
    }
  }
  h3App.use(config.app.baseURL, router)
  const app = {
    hooks,
    h3App,
    router,
    localCall,
    localFetch
  }
  for (const plugin of plugins) {
    plugin(app)
  }
  return app
}
export const nitroApp = createNitroApp()
export const useNitroApp = () => nitroApp
  ```


## 📦 Installation

Use pnpm for development of your module :

```bash
pnpm i 
```


## 📦 Contributing

Contributions, issues and feature requests are welcome!

1. Fork this repo

2. Install `node` and `pnpm` _Use `corepack enable && corepack prepare pnpm@latest --activate` to install pnpm easily_

3. Use `pnpm i` at the mono-repo root.

4. Make modifications and follow conventional commits.

5. Open a PR 🚀🚀🚀
