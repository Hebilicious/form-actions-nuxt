export default defineFormActions({
  default: async (event) => {
    const formData = await readFormData(event)
    const data = Object.fromEntries(formData.entries())
    return actionResponse(event, { ...data })
  }
})

export const loader = defineServerLoader(async () => {
  return { books: ["one-piece", "naruto"] }
})
