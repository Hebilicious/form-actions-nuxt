# Nuxt Form Actions

[![CI](https://github.com/Hebilicious/authjs-nuxt/actions/workflows/ci.yaml/badge.svg)](https://github.com/Hebilicious/authjs-nuxt/actions/workflows/ci.yaml)
[![npm version](https://badge.fury.io/js/@hebilicious%2Fauthjs-nuxt.svg)](https://badge.fury.io/js/@hebilicious%2Fauthjs-nuxt)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🚀 Welcome to __Nuxt Form Actions__!  

This is a Nuxt Module Repo Template Starter.
It comes with a base module that you can use to start your own module.

# TODO

- Docs
- Tests
- useLoader Type extraction
- Typesafty
## Nice to Have

- Virtual file Loaders
- Vue macro to automatically bind v-enhance to single forms

## Nitro Modifications

Add the possibility to register fallback handlers. This is useful to register a post handler alongside the nuxt renderer.

`nitro.config.routesWithFallback = [{route: "/hello-world", fallbackTo: "/**", method: "get"}]`

When hitting /hello-world with a post request, the registered handler will be used.
But when hitting /hello-world with a get request, the handler for /** will be used, which is the Nitro nuxt renderer.


Here's a PNPM patch for Nitro that you need until the official version is ready:

```

diff --git a/dist/runtime/app.mjs b/dist/runtime/app.mjs
index 2a858b1b851cb61a658122f60d79c9ca0483921d..b135a9ba6bbffc72499157418477eff6ffc06185 100644
--- a/dist/runtime/app.mjs
+++ b/dist/runtime/app.mjs
@@ -47,7 +47,20 @@ function createNitroApp() {
       event.$fetch = (req, init) => fetchWithEvent(event, req, init, { fetch: $fetch });
     })
   );
-  for (const h of handlers) {
+
+  const getHandlersWithFallbacks = (handlers, config) => {
+    if (!config.routesWithFallback || config.routesWithFallback.length === 0) return handlers;
+    const routes = config.routesWithFallback.map(({ route }) => route)
+    const routesWithFallbacks = handlers
+      .filter((h) => routes.includes(h.route))
+      .map((h) => {
+        const { fallbackTo, method = "get" } = config.routesWithFallback.find(({ route }) => route === h.route);
+        return { ...h, fallback: true, fallbackTo, fallbackMethod: method }
+      });
+    return handlers.concat(routesWithFallbacks)
+  }
+
+  for (const h of getHandlersWithFallbacks(handlers, config)) {
     let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler;
     if (h.middleware || !h.route) {
       const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(
@@ -65,7 +78,13 @@ function createNitroApp() {
           ...routeRules.cache
         });
       }
-      router.use(h.route, handler, h.method);
+      if (h.fallback === true) {
+        const fallback = handlers.find(({ route }) => route === h.fallbackTo);
+        const fallbackHandler = h.lazy ? lazyEventHandler(fallback.handler) : fallback.handler;
+        router.use(h.route, fallbackHandler, h.fallbackMethod);
+      } else {
+        router.use(h.route, handler, h.method);
+      }
     }
   }
   h3App.use(config.app.baseURL, router);
  ```


## ⚠️ Disclaimer

_🧪 This module is really unstable and is not recommended for production use. It is intended for those who want to experiment with the edge._


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
