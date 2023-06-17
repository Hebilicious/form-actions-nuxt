import { actionResponse, defineFormActions, getFormData } from "#form-actions"

export default defineFormActions({
  default: async (event) => {
    const formData = await getFormData(event)
    // eslint-disable-next-line no-console
    console.log("Login Received ...", formData.entries())
    return actionResponse(event, { formData })
  }
})
