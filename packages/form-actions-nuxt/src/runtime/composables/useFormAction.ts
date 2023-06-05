import { useThrottleFn } from "@vueuse/core"
import { type Ref, computed, reactive, ref } from "vue"
import { NITRO_LOADER_PREFIX, NUXT_PE_HEADER } from "../utils"
import { createError, navigateTo, useFetch, useRoute, useRuntimeConfig } from "#imports"
import type { FetchNuxtLoaderFunction, LoaderName } from "#build/types/form-action-loaders.d.ts"

/**
 * The result ref can be manipulated directly.
 */
interface UpdateArguments { result: Ref }
type UpdateFunction = (args: UpdateArguments) => void
interface ActionFunctionArgs {
  /**
   * Cancel the default submission.
   */
  cancel: () => void
  /**
   * Handle optimistic updates
   *
   * @param update Update callback to update the result.
   */
  optimistic: (update: UpdateFunction) => void
  /**
   * An object version of the `FormData` from this form
   */
  formData: Record<string, any>
  /**
   * The original submit event.
   */
  event: SubmitEvent
  /**
   * The name of the action.
   */
  action: string
  /**
   * The form element.
   */
  form: HTMLFormElement
  /**
   * The Element that submitted.
   */
  submitter: HTMLElement
  /**
   * The loader URL.
   */
  loader: string
}

type ActionFunction = (args: ActionFunctionArgs) => void
type ActionResponsePayload = Response & { _data: { data: Record<string, any>; action: Record<string, any> } }
type Loader = | string | undefined | false

interface ErrorRef {
  statusCode: number
  statusMessage: string
  data: any

}
const getActionName = (loader?: Loader) => typeof loader === "string" ? loader : useRoute().path.substring(1)

const getLoaderUrl = (loader?: Loader) => loader === false ? "" : `/${NITRO_LOADER_PREFIX}/${getActionName(loader)}`
/**
 * Use form action does the following :
 * - Get the data from the loader
 * - Listen to the form submission
 * - Handle custom logic and optimistic updates
 * - Submit the form data to the server
 * - Refresh the loader
 * - Handle CSR navigation / error
 */
export async function useFormAction<T extends LoaderName>({ run, loader }: {
  run?: ActionFunction
  loader?: T
} = {}) {
  const form = ref<HTMLFormElement>()
  const formResponse = ref<Record<string, any>>({})
  const actionResponse = ref<Record<string, any>>({})
  const cancelDefaultSubmit = ref(false)
  const error = ref<ErrorRef>()

  const fetchNuxtLoader: FetchNuxtLoaderFunction<T> = async (url: T, watch?: any[]) => {
    const { data: result, refresh, pending } = await useFetch(url, { watch, immediate: true })
    return { result, refresh, pending }
  }
  /**
   * We can avoid un-necessary fetch by throttling the loader
   */
  const useLoader = useThrottleFn(async (loader?: Loader, watch?: any[]) => {
    const hasLoader = useRuntimeConfig().public.__serverLoaders__.find((l: string) => l === getActionName(loader)) as boolean
    if (hasLoader) {
      const url = getLoaderUrl(loader) as T // Technically we're passing the name, not the URL
      return fetchNuxtLoader(url, watch)
    }
    return { result: ref(null), refresh: () => {}, pending: ref(false) }
  }, 75)

  const { result, refresh, pending } = await useLoader(loader, [form])
  const loading = computed(() => pending.value)

  const handleResponse = (response: ActionResponsePayload) => {
    // console.log('Handling response ...')
    if (!response.headers.has(NUXT_PE_HEADER)) return
    const { data, action } = response?._data
    // console.log('Handling response ...', action, data)
    actionResponse.value = action
    formResponse.value = data
    // CSR redirect
    if (action && action.redirect) {
      navigateTo(action.redirect)
    }
    // Handle errors
    if (action && action.error) {
      const newError = {
        statusCode: action.error.code ?? 400,
        statusMessage: action.error.message ?? "Result Error",
        data
      }
      error.value = newError
      throw createError(newError)
    }
  }

  const submitForm = async (event: SubmitEvent) => {
    const formToSubmit = event.target as HTMLFormElement
    const submitter = event.submitter as HTMLElement
    const formData = Object.fromEntries(new FormData(formToSubmit))
    // console.log('Trying to submit this form ...', formToSubmit, formData)
    // console.log('has form action ?', event.submitter?.hasAttribute('formaction'), event.submitter?.getAttribute('formaction'))
    const getActionRoute = () => {
      return event.submitter?.getAttribute("formaction") ?? formToSubmit?.action ?? useRoute().path
    }
    const defaultSubmit = async () => {
      const response = await $fetch.raw(getActionRoute(), {
        method: "POST",
        headers: new Headers([[NUXT_PE_HEADER, "1"]]),
        body: new FormData(formToSubmit)
      })
      // console.log('Refreshing data from form ...', formToSubmit?.action, form.value)
      refresh()
      handleResponse(response as ActionResponsePayload)
    }

    if (run) {
      const cancel = () => {
        // console.log('Cancelling default submit ...')
        cancelDefaultSubmit.value = true
      }
      const optimistic = (update: UpdateFunction) => {
        update({ result })
      }
      run({
        cancel,
        optimistic,
        formData,
        event,
        action: getActionName(loader),
        form: formToSubmit,
        submitter,
        loader: getLoaderUrl(loader)
      })
    }
    if (!cancelDefaultSubmit.value) {
      // console.log('Submitting default form ...')
      await defaultSubmit()
      cancelDefaultSubmit.value = false
    }
  }

  let eventListener: (this: HTMLFormElement, ev: SubmitEvent) => any
  const enhance = {
    setElement(el: HTMLFormElement) {
      if (form.value !== el) {
        // console.log('Setting element ...', el)
        form.value = el
        if (eventListener) form.value?.removeEventListener("submit", eventListener)
        eventListener = (event) => {
          event.preventDefault()
          submitForm(event)
        }
        // console.log('Adding event listener ...', form.value)
        form.value?.addEventListener("submit", eventListener)
      }
    },
    cleanup() {
      // console.log('Cleaning up ...')
      form.value?.removeEventListener("submit", eventListener)
    }
  }

  const data = computed(() => reactive({ loader: result, formResponse, actionResponse }))
  return { data, actionResponse, loading, error, enhance }
}
