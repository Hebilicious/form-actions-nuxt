import { type H3Event, getMethod, getRequestHeaders, getRequestURL, readRawBody, sendRedirect } from "h3"

// H3
export async function respondWithResponse(event: H3Event, response: Response) {
  for (const [key, value] of response.headers) event.node.res.setHeader(key, value)
  if (response.body) {
    for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) event.node.res.write(chunk)
  }
  return event.node.res.end()
}

// H3
export async function respondWithRedirect(event: H3Event, url: string, status = 302) {
  await sendRedirect(event, url, status)
  return event.node.res.end()
}

// H3
export async function getRequestFromEvent(event: H3Event) {
  const url = new URL(getRequestURL(event))
  const method = getMethod(event)
  const body = method === "POST" ? await readRawBody(event) : undefined
  return new Request(url, { headers: getRequestHeaders(event) as any, method, body })
}

// H3
export async function getFormData(event: H3Event) {
  return (await getRequestFromEvent(event)).formData()
}
