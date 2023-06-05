import { useState } from "#imports"

export function useSomething() {
  const something = useState("something", () => "something")
  return { something }
}
