# Nuxt Form Actions

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![CI](https://github.com/Hebilicious/form-actions-nuxt/actions/workflows/ci.yaml/badge.svg)](https://github.com/Hebilicious/form-actions-nuxt/actions/workflows/ci.yaml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[npm-version-src]: https://img.shields.io/npm/v/@hebilicious/form-actions-nuxt
[npm-version-href]: https://npmjs.com/package/@hebilicious/form-actions-nuxt
[npm-downloads-src]: https://img.shields.io/npm/dm/@hebilicious/form-actions-nuxt
[npm-downloads-href]: https://npmjs.com/package/@hebilicious/form-actions-nuxt

__🚀 Welcome to Nuxt Form Actions !__

[![Nuxt banner](./.github/assets/banner.svg)]

Form Actions and Server Loaders paradigms for Nuxt.

- Form Actions are a convenient way to send data to your server using native HTML forms that can be progressively enhanced.
- Server Loaders are a convenient way to load type-safe data from your server into your pages and components, without manually fetching from an API route.
  
## 📦 Usage

You can use this package in any Nuxt project.
Create a new project from scratch with the official Nuxt CLI

```bash
npx nuxi init
```

### Install

Install the form-actions module from NPM.

```bash
# With NPM
npm i @hebilicious/form-actions-nuxt
# With PNPM
pnpm i @hebilicious/form-actions-nuxt
# With Yarn
yarn add @hebilicious/form-actions-nuxt
```

### Nuxt configuration

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@hebilicious/form-actions-nuxt"]
})
```

### Use a recent version of Nuxt

This module requires Nuxt 3.7.0. If you must use an older Nuxt version, this module should work as long as you have Nitro > 2.6.0 and h3 > 1.8.0.

### Why is this module not included in Nuxt by default ?

The Nuxt team is considering adding this feature at the framework level. If you want to show support, you can :

- use this package and star this repository
- upvote / add relevant comment on the related [issue](https://github.com/nuxt/nuxt/issues/20649) and [PR](https://github.com/nuxt/nuxt/pull/20852).
- start [discussions](https://github.com/nuxt/nuxt/discussions), spread the word on [discord](https://discord.com/invite/nuxt) or on Twitter about this module and this paradigm
- provide [feedback](https://github.com/Hebilicious/form-actions-nuxt/discussions)

## Docs

### Form actions

Define a form action. They __must__ be in the `/server/actions` directory.

Note: Server composables `defineFormActions`, `actionResponse` and `defineServerLoader` are auto-imported, but you can explicitly them from `#form-actions`.

`/server/actions/login.ts`

```ts
export default defineFormActions({
  default: () => {
    console.log("Login called !")
  }
})
```

Add logic for logging-in and registering users.

```ts
import { createSession, getUser } from "../db"

const validValue = (v: unknown): v is string => typeof v === "string" && v.length > 0
export default defineFormActions({
  signIn: async (event) => {
    // use readFormData to obtain a FormData object
    const formData = await readFormData(event)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // Handle your errors
    if (!validValue(email)) return actionResponse(event, { email, missing: true }, { error: { message: "Missing email" } })
    const user = getUser(email, password) // Load the user somehow
    if (!validValue(user)) return actionResponse(event, { email, incorrect: true }, { error: { message: "No user found" } })

    // Attach a session cookie to the response
    setCookie(event, "session", await createSession(user))

    // Respond with a redirect.
    return actionResponse(event, { user }, { redirect: "/todos" })
  },
  // Register another action
  register: (event) => {
    // ...
    return actionResponse(event, { register: true })
  }
})
```

Create a login page. The name _must_ be the same as your action.

`pages/login.vue`

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
    <button formaction="login?register">
      Register
    </button>
  </form>
</template>
```

Use progressive enhancement to add client side rendering to the form.

`pages/login.vue`

```html
<script setup lang="ts">
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
    
    <button formaction="login?register">
      Register
    </button>

  </form>
</template>

```

### Server Loaders

Server loaders are a convenient way to load data from the server in your components.

- Your file _must_ export an event handler named `loader`.
- Server loaders _must_ be in the `/server/actions` directory.
- The loader name will be the name of the file path (relative to `/server/actions`).

Use the `defineServerLoader` helper for your convenience.

`/server/actions/books.ts`

```ts
export const loader = defineServerLoader(async () => {
  // This is an h3 event handler, you can use any logic that you
  // want here, including database calls, etc.
  return { books: ["title"], manybooks: [] }
})
```

Use them with type-safety everywhere.

`components/Books.vue`

```html
<script setup lang="ts">
const { result } = await useLoader("books")
</script>

<template>
  <div>
    <h1>Books</h1>
    {{ result }} <!-- result will be typed like this : { books: string[]; manybooks: never[];} | null -->
  </div>
</template>
```

#### Using query parameters

You can use route parameters in your server loaders.

`/server/actions/books.ts`

```ts
export const loader = defineServerLoader(async (event) => {
  // Use H3 helpers to grab the requests params
  const params = getQuery(event)
  return { books: ["title"], manybooks: [], params }
})
```

`pages/books/[id].vue`

```html
<script setup lang="ts">
const { result } = await useLoader("books")
</script>

<template>
  <div>
    <h1>Params</h1>
    {{ result.params }} <!-- params will be typed like this : { id: string } -->
  </div>
</template>
```

Under the hood, server loaders will create regular Nitro server handlers, so they will _always_ run on the server.
The returned data will be serialized and sent to the client, which means that while hydrating, they will run once.
`useLoader` and `useFormAction` use `useFetch` under the hood, which will handle caching.
`useLoader` 2nd argument and `useFormAction({ loaderOptions })` can be used to pass a subset of the supported `useFetch`
options to the underlying `useFetch` call.

### Form Actions alongside Server Loaders

You can define form actions and server loaders in the same file.

`actions/todos.ts`

```ts
import { createTodo, deleteTodo, getTodos } from "../db"

export default defineFormActions({
  add: async (event) => {
    const description = (await readFormData(event)).get("description") as string
    try {
      const todo = await createTodo(description)
      return actionResponse(event, { todo })
    }
    catch (e) {
      if (e instanceof Error) return actionResponse(event, { todoId }, { error: { code: 422, message: e?.message } })
      throw e
    }
  },
  delete: async (event) => {
    const todoId = (await readFormData(event)).get("id") as string
    try {
      const todo = await deleteTodo(todoId)
      return actionResponse(event, { todo })
    }
    catch (e) {
      if (e instanceof Error) return actionResponse(event, { todoId }, { error: { code: 422, message: e?.message } })
      throw e
    }
  }
})

export const loader = defineServerLoader(async () => {
  const todos = await getTodos()
  return { todos, manytodos: [] }
})
```

Use them together in your pages :

`pages/todos.vue`

```html
<script setup lang="ts">
// Rename the enhance props to handle multiple forms on the same page.
const { data, enhance: createTodo } = await useFormAction({ loader: "todos" })
const { enhance: deleteTodo } = await useFormAction({
  loader: "todos", // This is needed for Typescript to infer the loader return type.
  run: ({ optimistic, formData }) => {
    // You can call cancel() here if you want to manually submit the form.
    optimistic(({ result }) => {
      // This will update the UI before any data-fetching.
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
        <input name="description" autocomplete="off">
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

Here's the full Typescript interface for the `run` function :

```ts
interface ActionFunctionArgs<R extends LoaderName> {
  /**
   * Cancel the default submission.
   */
  cancel: () => void
  /**
   * Handle optimistic updates
   *
   * @param update Update callback to update the result.
   */
  optimistic: (update: UpdateFunction<R>) => void
  /**
   * An object version of the `FormData` from this form
   */
  formData: Record<string, any>
  /**
   * The original submit event.
   */
  event: SubmitEvent
  /**
   * The name of the action.
   */
  action: string
  /**
   * The form element.
   */
  form: HTMLFormElement
  /**
   * The Element that submitted.
   */
  submitter: HTMLElement
  /**
   * The loader URL.
   */
  loader: string | undefined
  /**
   * The default submit function.
   */
  submitForm: () => Promise<void>
}
```

### Integrate with 3rd party libraries

You can integrate with 3rd party libraries.
Here's an example that use [vorms](https://github.com/Mini-ghost/vorms) and [zod](https://github.com/colinhacks/zod).

```html
<script setup lang="ts">
import { useForm } from "@vorms/core"
import { zodResolver } from "@vorms/resolvers/zod"
import z from "zod"

const { register, errors, validateForm } = useForm({
  initialValues: {
    account: "",
    password: "",
    remember: false
  },
  validate: zodResolver(
    z.object({
      account: z.string().min(1, "Account is required!"),
      password: z.string().min(1, "Password is required!")
    })
  ),
  onSubmit() { 
    // Since we handle the form submission with the run function, this
    // isn't needed. However you can use it and submit the form manually
    // by calling vorms handleSubmit(event) within the run function.
  } 
})

const { enhance } = await useFormAction({
  run: async ({ cancel, submitForm }) => {
    cancel() // Cancel the default form submission
    const result = await validateForm() // Validate with the library
    if (Object.keys(result).length === 0) { // Vorms returns an empty object if the form is valid.
      await submitForm() // Submit the form if valid ...
    }
  }
})

const { value: account, attrs: accountAttrs } = register("account", {
  validate(value) {
    if (!value) return "Account is required!"
  }
})
const { value: password, attrs: passwordAttrs } = register("password")
const { value: remember, attrs: rememberAttrs } = register("remember")
</script>

<template>
  <form v-enhance="enhance">
    <div class="field">
      <input
        v-model="account"
        class="field__input"
        type="text"
        placeholder="Account"
        v-bind="accountAttrs"
      >
      <div v-show="'account' in errors" class="field__error">
        {{ errors.account }}
      </div>
    </div>
    <div class="field">
      <input
        v-model="password"
        class="field__input"
        type="password"
        placeholder="Password"
        v-bind="passwordAttrs"
      >
      <div v-show="'password' in errors" class="field__error">
        {{ errors.password }}
      </div>
    </div>

    <div class="field checkbox">
      <input
        id="remember"
        v-model="remember"
        class="field__checkbox"
        type="checkbox"
        v-bind="rememberAttrs"
      >
      <label for="remember">remember</label>
    </div>

    <div class="field">
      <input type="submit">
    </div>
  </form>
</template>
```

### Server blocks

Install the server block [module](https://github.com/Hebilicious/server-block-nuxt) :
You can combine form actions and loaders with it.

```ts
export default defineNuxtConfig({
  modules: ["@hebilicious/server-block-nuxt", "@hebilicious/form-actions-nuxt"] // the order is important
})
```

```html
<server lang="ts">
export const loader = defineServerLoader(async () => {
  return { cool: "stuff", supercool: "more-stuffsss" }
})
</server>

<script setup lang="ts">
const { result } = await useLoader("cool")
</script>

<template>
  <div>
    <h1>Stuff</h1>
    {{ result }}
  </div>
</template>
```

## Future Plans

- Vue query integration
- Vue macro to automatically bind v-enhance to single forms
- overload useFormActions to accept multiple syntaxes and shorten the api

## Prior Art

- [Svelte Form actions](https://kit.svelte.dev/docs/form-actions), [Discussion for semantic form actions](https://github.com/sveltejs/kit/discussions/5875)
- [Solid Start actions](https://start.solidjs.com/core-concepts/actions)
- [Remix Actions](https://remix.run/docs/en/main/route/action)
- [Kent PESPA article](https://www.epicweb.dev/the-webs-next-transition)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)

## 📦 Contributing

Contributions, issues and feature requests are welcome!

1. Fork this repo

2. Install `node` and `pnpm` _Use `corepack enable && corepack prepare pnpm@latest --activate` to install pnpm easily_

3. Use `pnpm i` at the mono-repo root.

4. Make modifications and follow conventional commits.

5. Open a PR 🚀🚀🚀
