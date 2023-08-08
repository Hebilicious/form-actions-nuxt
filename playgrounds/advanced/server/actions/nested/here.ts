export default defineFormActions({
  default: (event) => {
    return actionResponse(event, { test: "test" })
  }
})

export const loader = defineServerLoader(async () => {
  return { stuff: [1, 2, 3] }
})
