export const loader = defineServerLoader(async () => {
  return { books: ["title"], manybooks: [1, 2, 3, 4, 5] }
})
