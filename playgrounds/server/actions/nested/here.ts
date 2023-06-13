import { actionResponse, defineFormActions } from "#form-actions"

export default defineFormActions({
  default: (event) => {
    return actionResponse(event, { test: "test" })
  }
})
