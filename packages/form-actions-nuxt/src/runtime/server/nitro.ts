import { type EventHandler, type H3Event, createError, defineEventHandler, getQuery, getRequestHeader } from "h3"
import { NUXT_PE_HEADER } from "../utils"

interface Actions {
  [key: string]: EventHandler
}
type ResponseAction = { error: { message?: string; code?: number } } | { redirect: string }

interface Loader<T> {
  (event: H3Event): Promise<T>
}

async function respondWithRedirect(event: H3Event, url: string, status = 302) {
  await sendRedirect(event, url, status)
  return event.node.res.end()
}

// Nitro : This register a special internal namespaced route for the loader
export function defineServerLoader<T>(loader: Loader<T>) {
  return defineEventHandler(event => loader(event))
}

// Nitro : This register Post only routes for the form actions
export function defineFormActions(actions: Actions) {
  return (event: H3Event) => {
    const action = Object.keys(getQuery(event))[0]
    const handler = action ? actions[action] : Object.values(actions)[0]
    return handler(event)
  }
}

// Nitro : This is a helper to handle the response of the form actions
export function actionResponse(event: H3Event, data: Record<string, unknown>, action?: ResponseAction) {
  const isEnhanced = getRequestHeader(event, NUXT_PE_HEADER)
  // If we progressively enhanced, we response JSON and handle everything on the client
  if (isEnhanced) {
    return new Response(JSON.stringify({ data, action }), {
      status: action && "error" in action ? action.error.code ?? 400 : 200,
      headers: { [NUXT_PE_HEADER]: "1", "Content-Type": "application/json" }
    })
  }

  // Throw a server error
  if (action && "error" in action) {
    throw createError({
      statusCode: action.error.code ?? 400,
      statusMessage: action.error.message ?? "Result Error",
      data
    })
  }
  // Server redirect
  if (action && "redirect" in action) return respondWithRedirect(event, action.redirect, 302)

  // Fallback case
  return { data, action }
}
