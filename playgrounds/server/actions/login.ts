import { actionResponse, defineFormActions, getFormData } from "#form-actions"

const createSession = async (_: any) => "session"
const getUser = (email: string, ..._: any) => ({ email, username: "" })

export default defineFormActions({
  signIn: async (event) => {
    const formData = await getFormData(event)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    if (!email) return actionResponse(event, { email, missing: true }, { error: { message: "Missing email" } })
    const user = getUser(email, password) // Load the user somehow
    if (!user) {
      return actionResponse(event, { email, incorrect: true }, { error: { message: "No user found" } })
    }
    setCookie(event, "session", await createSession(user)) // Attach a session
    return actionResponse(event, { user }, { redirect: "/todos" })
  },
  register: (event) => {
    return actionResponse(event, { register: true })
  }
})
