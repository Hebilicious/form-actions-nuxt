import { defineServerLoader } from "#form-actions"

export const loader = defineServerLoader(async () => {
  return { books: ["title"], manybooks: [] }
})
