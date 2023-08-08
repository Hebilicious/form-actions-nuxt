import { createTodo, deleteTodo, getTodos } from "../db"

export default defineFormActions({
  add: async (event) => {
    const description = (await readFormData(event)).get("description") as string
    try {
      const todo = await createTodo(description)
      return actionResponse(event, { todo })
    }
    catch (e) {
      if (e instanceof Error) return actionResponse(event, { description }, { error: { code: 422, message: e?.message } })
      throw e
    }
  },
  delete: async (event) => {
    const todoId = (await readFormData(event)).get("id") as string
    try {
      const todo = await deleteTodo(todoId)
      return actionResponse(event, { todo })
    }
    catch (e) {
      if (e instanceof Error) return actionResponse(event, { todoId }, { error: { code: 422, message: e?.message } })
      throw e
    }
  }
})

export const loader = defineServerLoader(async () => {
  const todos = await getTodos()
  return { todos, manytodos: [] }
})
