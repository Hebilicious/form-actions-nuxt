export const loader = defineServerLoader(async (event) => {
  const params = getQuery(event)
  return { books: ["title"], manybooks: [1, 2, 3, 4, 5], params }
})
