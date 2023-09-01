/* eslint-disable no-console */
export default defineFormActions({
  default: {
    onRequest: [(event) => {
      console.log("onRequest", event)
    }],
    onBeforeResponse: [(event) => {
      console.log("onBeforeResponse", event)
    }],
    handler: (event) => {
      return actionResponse(event, { test: "here" })
    }
  }
})

export const loader = defineServerLoader(async () => {
  return { stuff: [1, 2, 3] }
})
