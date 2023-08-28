export default defineFormActions({
  default: (event) => {
    return actionResponse(event, { test: "here" })
  }
})

export const loader = defineServerLoader(async () => {
  return { stuff: [1, 2, 3] }
})
