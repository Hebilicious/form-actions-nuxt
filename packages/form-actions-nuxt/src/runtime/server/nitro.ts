import type { EventHandler, EventHandlerObject, EventHandlerRequest, H3Event } from "h3"
import { createError, eventHandler, getQuery, getRequestHeader, sendRedirect } from "h3"
import { NUXT_PE_HEADER } from "./utils"

interface Actions {
  [key: string]: EventHandler | EventHandlerObject | undefined
}
type ResponseAction = { error: { message?: string; code?: number } } | { redirect: string }

type Handler<T> = EventHandler<EventHandlerRequest, T> | EventHandlerObject<EventHandlerRequest, T>

const callHandler = <T>(h: Handler<T>, event: H3Event): T =>
  "handler" in h ? h.handler(event) : h(event)

async function respondWithRedirect(event: H3Event, url: string, status = 302) {
  await sendRedirect(event, url, status)
  return event.node.res.end()
}

// Nitro : This register a special internal namespaced route for the loader
export function defineServerLoader<T>(loader: Handler<T>) {
  return eventHandler(event => callHandler(loader, event))
}

const actionNotFound = ({ actions, action }: { actions: Actions; action: string }) =>
  createError({
    statusCode: 500,
    statusMessage: process.dev
      ? `The action \`${action}\` wasn't found in the actions. The following actions are available on this path: ${Object.keys(actions).join(", ")}`
      : "Internal Server Error."
  })

// Nitro : This register Post only routes for the form actions
export function defineFormActions(actions: Actions) {
  return (event: H3Event) => {
    const action = Object.keys(getQuery(event))[0]
    const handler = action
      ? actions[action]
      : "default" in actions
        ? actions.default
        : Object.values(actions)[0]
    if (!handler) throw actionNotFound({ actions, action })
    return callHandler(handler, event)
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
