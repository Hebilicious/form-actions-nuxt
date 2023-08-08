import { type Ref, computed, reactive, ref } from "vue"
import { NUXT_PE_HEADER } from "../utils"
import { getActionName, getLoaderUrl, useLoader } from "./useLoader"
import { createError, navigateTo, useRoute } from "#imports"
import type { LoaderName, Loaders, MultiWatchSources } from "#build/types/loader-types.d.ts"

interface UseFormAction<N extends LoaderName> { run?: ActionFunction<N>; loader?: N; watch?: MultiWatchSources }

type ActionFunction<N extends LoaderName> = (args: ActionFunctionArgs<N>) => void

type UpdateFunction<N extends LoaderName> = (args: UpdateArguments<N>) => void

interface UpdateArguments<N extends LoaderName> { result: Ref<Loaders[N]> }
interface ActionFunctionArgs<N extends LoaderName> {
  /**
   * Cancel the default submission.
   */
  cancel: () => void
  /**
   * Handle optimistic updates
   *
   * @param update Update callback to update the result.
   */
  optimistic: (update: UpdateFunction<N>) => void
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
  loader: string | undefined
  /**
   * The default submit function.
   */
  submitForm: () => Promise<void>
}

type ActionResponsePayload = Response & { _data: { data: Record<string, any>; action: Record<string, any> } }

interface ErrorRef {
  statusCode: number
  statusMessage: string
  data: any
}

/**
 * Use form action does the following :
 * - Get the data from the loader
 * - Listen to the form submission
 * - Handle custom logic and optimistic updates
 * - Submit the form data to the server
 * - Refresh the loader
 * - Handle CSR navigation / error
 */
export async function useFormAction<Name extends LoaderName>({ run, loader, watch }: UseFormAction<Name> = {}) {
  const form = ref<HTMLFormElement>()
  const formResponse = ref<Record<string, any>>({})
  const actionResponse = ref<Record<string, any>>({})
  const cancelDefaultSubmit = ref(false)
  const error = ref<ErrorRef>()

  const { result, refresh, pending, error: loaderError } = await useLoader(loader, watch)

  const handleResponse = (response: ActionResponsePayload) => {
    // console.log('Handling response ...')
    if (!response.headers.has(NUXT_PE_HEADER)) return
    const { data, action } = response?._data
    // console.log('Handling response ...', action, data)
    actionResponse.value = action
    formResponse.value = data
    // CSR redirect
    if (action && action.redirect) navigateTo(action.redirect)

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

  const handleFormSubmit = async (event: SubmitEvent) => {
    const formToSubmit = event.target as HTMLFormElement
    const submitter = event.submitter as HTMLElement
    const formData = Object.fromEntries(new FormData(formToSubmit))
    // console.log('Trying to submit this form ...', formToSubmit, formData)
    // console.log('has form action ?', event.submitter?.hasAttribute('formaction'), event.submitter?.getAttribute('formaction'))
    const getActionRoute = () => {
      return event.submitter?.getAttribute("formaction") ?? formToSubmit?.action ?? useRoute().path
    }
    const submitForm = async () => {
      const response = await $fetch.raw(getActionRoute(), {
        method: "POST",
        headers: new Headers([[NUXT_PE_HEADER, "1"]]),
        body: new FormData(formToSubmit),
        ignoreResponseError: true
      })
      refresh({ dedupe: true })
      handleResponse(response as ActionResponsePayload)
    }

    if (run) {
      const cancel = () => {
        // console.log('Cancelling default submit ...')
        cancelDefaultSubmit.value = true
      }
      const optimistic = (update: UpdateFunction<Name>) => {
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
        loader: getLoaderUrl(loader),
        submitForm
      })
    }
    if (!cancelDefaultSubmit.value) {
      // console.log('Submitting default form ...')
      await submitForm()
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
          handleFormSubmit(event)
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
  const combinedErrors = computed(() => loaderError.value ?? error.value)
  const loading = computed(() => pending.value)

  return { data, loading, error: combinedErrors, enhance }
}
