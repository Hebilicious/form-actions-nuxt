const createSession = async (_: any) => "session"
const getUser = (email: string, ..._: any) => ({ email, username: "" })

const validValue = (v: unknown): v is string => typeof v === "string" && v.length > 0
export default defineFormActions({
  signIn: async (event) => {
    const formData = await readFormData(event)
    const email = formData.get("email")
    const password = formData.get("password")
    if (!validValue(email)) return actionResponse(event, { email, missing: true }, { error: { message: "Missing email" } })
    const user = getUser(email, password) // Load the user somehow
    if (!validValue(user)) return actionResponse(event, { email, incorrect: true }, { error: { message: "No user found" } })
    setCookie(event, "session", await createSession(user)) // Attach a session
    return actionResponse(event, { user }, { redirect: "/todos" })
  },
  register: (event) => {
    return actionResponse(event, { register: true })
  }
})
