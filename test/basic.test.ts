import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { $fetch, setup } from "@nuxt/test-utils"

describe("basic test", async () => {
  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/basic", import.meta.url))
  })

  it("displays data", async () => {
    // Get response to a server-rendered page with `$fetch`.
    const html = await $fetch("/")
    expect(html).toContain("Hello")
    expect(html).toContain("World")
  })
})
