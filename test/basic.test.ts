import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { $fetch, setup } from "@nuxt/test-utils"

describe("basic test", async () => {
  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/basic", import.meta.url))
  })

  it("displays data", async () => {
    const html = await $fetch("/")
    expect(html).toContain("Hello World !")
  })

  it("can use a loder", async () => {
    const html = await $fetch("/")
    expect(html).toContain("naruto")
    expect(html).toContain("one-piece")
  })

  it("can use an action", async () => {
    const body = new FormData()
    body.append("book", "dragonball-z")
    const html = await $fetch("/books", { method: "POST", body })
    expect(html).toMatchObject({ data: { book: "dragonball-z" } })
  })
})
