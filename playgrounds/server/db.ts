import crypto from "node:crypto"

if (!globalThis.crypto) {
  // @ts-expect-error crypto
  globalThis.crypto = crypto
}

const randomID = crypto.randomUUID() as string
const db = new Map([[randomID, { id: randomID, description: "my-todo" }]])

export async function createTodo(description: string) {
  if (!description) throw new Error("Description is required")
  const todo = { id: crypto.randomUUID(), description }
  db.set(todo.id, todo)
  return todo
}
export async function deleteTodo(id: string) {
  if (!id) throw new Error("Id is required")
  if (!db.has(id)) throw new Error(`ID: '${id}' doesn't exist.`)
  db.delete(id)
  return { id }
}
export const getTodos = async () => [...db.values()]
