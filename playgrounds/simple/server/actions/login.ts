const validValue = (v: unknown): v is string => typeof v === "string" && v.length > 0
export default defineFormActions({
  default: async (event) => {
    const formData = await readFormData(event)
    const email = formData.get("email")
    const password = formData.get("password")
    // eslint-disable-next-line no-console
    console.log({ email, password })
    if (!validValue(email)) return actionResponse(event, { email, missing: true }, { error: { message: "Missing email" } })
    const user = { email } // Load the user somehow
    return actionResponse(event, { user }, { redirect: "/profile" })
  }
})
