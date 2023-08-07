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

This is a standalone Nuxt Module that implements <https://github.com/nuxt/nuxt/pull/20852>
You will need to patch Nitropack to use it.

_🧪🧪🧪 This module API might change ! You MUST use a patched version of Nitro that support form actions, see below for instructions.🧪🧪🧪_

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

### Nitro Modifications

Nitro is the server engine that power Nuxt. As this module is really new, the necessary changes to use it are not yet merged in Nitro.
You must use [this Nitro fork](https://www.npmjs.com/package/@hebilicious/nitro) in the meantime [(linked PR)](https://github.com/unjs/nitro/pull/1286).
The easiest way to use this forked version in a project is to leverage your package manager features.
Add the following to your `package.json` :

For NPM :

```json
{
  "dependencies": {
    "nuxt": "latest",
    "@hebilicious/form-actions-nuxt": "latest"
  },
  "overrides": {
    "nitropack": "npm:@hebilicious/nitro@latest"
  }
}
```

For PNPM :

```json
{
  "dependencies": {
    "nuxt": "latest",
    "@hebilicious/form-actions-nuxt": "latest"
  },
  "pnpm": {
    "overrides": {
      "nitropack": "npm:@hebilicious/nitro@latest"
    }
  }
}
```

And for Yarn :

```json
{
  "dependencies": {
    "nuxt": "latest",
    "@hebilicious/form-actions-nuxt": "latest"
  },
  "resolutions": {
    "nitropack": "npm:@hebilicious/nitro@latest"
  }
}
```

_Note that for monorepos this must be done at the root of your repository._

### Form Actions should be integrated in Nuxt !

The Nuxt team is considering adding this feature at the framework level. If you'd like to show support, you can :

- use this package and star this repository
- upvote / add relevant comment on the related issues https://github.com/nuxt/nuxt/issues/20649
- start discussions in the Nuxt discussions/discord or on Twitter about this feature to make it more popular

## Docs

### Form actions

Define a form action. They __must__ be in the `/server/actions` directory.

`/server/actions/login.ts`

```ts
import { defineFormActions } from "#form-actions"

export default defineFormActions({
  default: () => {
    console.log("Login called !")
  }
})
```

Add logic for logging-in and registering users.

```ts
import { createSession, getUser } from "../db"
import { actionResponse, defineFormActions, getFormData } from "#form-actions"

export default defineFormActions({
  signIn: async (event) => {
    // use getFormData to obtain a FormData object
    const formData = await getFormData(event)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // Handle your errors
    if (!email) return actionResponse(event, { missing: true }, { error: { message: "Missing email" } })
    const user = getUser(email, password) // Load the user somehow
    if (!user)
      return actionResponse(event, { email, incorrect: true }, { error: { message: "No user found" } })

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

Create a login page. The name must be the same as your action.

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
    
    <button formaction="login?register">
      Register
    </button>

  </form>
</template>

```

### Server Loaders

Server loaders allows you easily load data from the server in your components.
Your file _must_ export an event handler named `loader`.
Use the `defineServerLoader` helper for your convenience.
They _must_ also be in the `/server/actions` directory.

`/server/actions/books.ts`

```ts
import { defineServerLoader } from "#form-actions"

export const loader = defineServerLoader(async () => {
  // This is an h3 event handler, you can use any logic that you
  // want here, including database calls, etc.
  return { books: ["title"], manybooks: [] }
})
```

Use them with type-safety everywhere.

`components/Books.ts`

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

### Form Actions alongside Server Loaders

Define form actions and server loaders in the same file.

`actions/todos.ts`

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
      if (e instanceof Error) return actionResponse(event, { todoId }, { error: { code: 422, message: e?.message } })
      throw e
    }
  },
  delete: async (event) => {
    const todoId = (await getFormData(event)).get("id") as string
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
  loader: string
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

With https://github.com/Hebilicious/server-block-nuxt ...

```html
<server lang="ts">
import { defineServerLoader } from "#form-actions"
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

## TODO

- Docs
- Tests

## Maybe do

- Virtual file Loaders, moving loaders in .nuxt ?
- Vue macro to automatically bind v-enhance to single forms
- useFormActions to accept multiple syntax to shorten the api


## 📦 Contributing

Contributions, issues and feature requests are welcome!

1. Fork this repo

2. Install `node` and `pnpm` _Use `corepack enable && corepack prepare pnpm@latest --activate` to install pnpm easily_

3. Use `pnpm i` at the mono-repo root.

4. Make modifications and follow conventional commits.

5. Open a PR 🚀🚀🚀
