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

## Docs 

Define a simple form action in /server/actions/login.ts

```ts
import { actionResponse, defineFormActions, getFormData } from "#form-actions"

const createSession = async (_: any) => "session"
const getUser = (email: string, ..._: any) => ({ email, username: "" })

export default defineFormActions({
  signIn: async (event) => {
    const formData = await getFormData(event)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    if (!email) return actionResponse(event, { email, missing: true }, { error: { message: "Missing email" } })
    const user = getUser(email, password) // Load the user somehow
    if (!user) {
      return actionResponse(event, { email, incorrect: true }, { error: { message: "No user found" } })
    }
    setCookie(event, "session", await createSession(user)) // Attach a session
    return actionResponse(event, { user }, { redirect: "/todos" })
  },
  register: (event) => {
    return actionResponse(event, { register: true })
  }
})
```

Create a login page in pages/login.vue

```html
<template>
  <form method="POST">
    <label>
      Email
      <input name="email" type="email" autocomplete="username">
    </label>
    <label>
      Password
      <input name="password" type="password" autocomplete="current-password">
    </label>
    <button>Log in</button>
  </form>
</template>
```

Use progressive enhancement to add CSR to the form.

```html
<script setup>
const { enhance, data } = await useFormAction()
</script>

<template>
  <form v-enhance="enhance" method="POST" action="login">
    <p v-if="data.formResponse?.missing" class="error">
      The email field is required
    </p>
    <p v-if="data.formResponse?.incorrect" class="error">
      Invalid credentials!
    </p>
    <p v-if="data.formResponse?.register" class="success">
      Succesfully Registered !
    </p>
    <label>
      Email
      <input name="email" type="email" :value="data.formResponse?.email ?? ''">
    </label>
    <label>
      Password
      <input name="password" type="password">
    </label>
    <button>Log in</button>
    <button formaction="advanced-login?register">
      Register
    </button>
  </form>
</template>

```

Create server loaders :

```ts
import { defineServerLoader } from "#form-actions"

export const loader = defineServerLoader(async () => {
  return { books: ["title"], manybooks: [] }
})
```

Use them with type-safety everywhere.

```html
<script setup lang="ts">
const { result } = await useLoader("books")
</script>

<template>
  <div>
    <h1>Books</h1>
    {{ result }}
  </div>
</template>
```

Define them alongside form actions :

```ts
import { createTodo, deleteTodo, getTodos } from "../db"
import { actionResponse, defineFormActions, defineServerLoader, getFormData } from "#form-actions"

export default defineFormActions({
  add: async (event) => {
    const description = (await getFormData(event)).get("description") as string
    try {
      const todo = await createTodo(description)
      return actionResponse(event, { todo })
    }
    catch (e) {
      const error = e as Error
      return actionResponse(event, { description }, { error: { code: 422, message: error?.message } })
    }
  },
  delete: async (event) => {
    const todoId = (await getFormData(event)).get("id") as string
    try {
      const todo = await deleteTodo(todoId)
      return actionResponse(event, { todo })
    }
    catch (e) {
      const error = e as Error
      return actionResponse(event, { todoId }, { error: { code: 422, message: error?.message } })
    }
  }
})

export const loader = defineServerLoader(async () => {
  const todos = await getTodos()
  return { todos, manytodos: [] }
})
```

Use everything together

```html
<script setup lang="ts">
const { data, enhance: createTodo } = await useFormAction({ loader: "todos" })
const { enhance: deleteTodo } = await useFormAction({
  loader: "todos", // This is needed for typesafety
  run: ({ optimistic, formData }) => {
    // You can call cancel() here if you want to manually submit the form.
    optimistic(({ result }) => {
      result.value.todos = result.value.todos.filter(todo => todo.id !== formData.id)
    })
  }
})
</script>

<template>
  <div>
    <h1>Todos</h1>

    <form v-enhance="createTodo" method="POST" action="todos">
      <label>
        add a todo:
        <input
          name="description"
          autocomplete="off"
        >
      </label>
    </form>

    <ul v-if="data.loader?.todos" class="todos">
      <li v-for="todo in data.loader.todos" :key="todo.id">
        <form v-enhance="deleteTodo" method="POST" action="todos?delete">
          <input type="hidden" name="id" :value="todo.id">
          <span>{{ todo.description }} - {{ todo.id }}</span>
          <button aria-label="Mark as complete" />
        </form>
      </li>
    </ul>
  </div>
</template>
```

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
