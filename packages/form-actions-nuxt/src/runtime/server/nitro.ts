import { type EventHandler, type H3Event, createError, defineEventHandler, getQuery, getRequestHeader } from "h3"
import { NUXT_PE_HEADER } from "../utils"
import { respondWithRedirect, respondWithResponse } from "./h3"

interface Actions {
  [key: string]: EventHandler
}
interface ResponseAction { error?: { message?: string; code?: number }; redirect?: string }

interface Loader<T> {
  (event: H3Event): Promise<T>
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
    return defineEventHandler(handler(event))
  }
}

// Nitro : This is a helper to handle the response of the form actions
export function actionResponse(event: H3Event, data: Record<string, unknown>, action: ResponseAction = {}) {
  const isEnhanced = getRequestHeader(event, NUXT_PE_HEADER)
  // If we progressively enhanced, we response JSON and handle everything on the client
  if (isEnhanced) {
    return respondWithResponse(event, new Response(JSON.stringify({ data, action }, null, 2), {
      status: action.error ? action.error.code ?? 400 : 200,
      headers: {
        "content-type": "application/json",
        [NUXT_PE_HEADER]: "1"
      }
    }))
  }
  if (action.error) {
    throw createError({
      statusCode: action.error.code ?? 400,
      statusMessage: action.error.message ?? "Result Error",
      data
    })
  }
  if (action.redirect) {
    return respondWithRedirect(event, action.redirect, 302)
  }
  // Fallback case
  return { data, action }
}
