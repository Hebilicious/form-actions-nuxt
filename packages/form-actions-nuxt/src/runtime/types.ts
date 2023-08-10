import { type Ref } from "vue"
import type { LoaderName, LoaderOptions, Loaders } from "#build/types/loader-types.d.ts"

export interface UseFormAction<N extends LoaderName> { run?: ActionFunction<N>; loader?: N; loaderOptions?: LoaderOptions }

export type ActionFunction<N extends LoaderName> = (args: ActionFunctionArgs<N>) => void

export type UpdateFunction<N extends LoaderName> = (args: UpdateArguments<N>) => void

export interface UpdateArguments<N extends LoaderName> { result: Ref<Loaders[N]> }
export interface ActionFunctionArgs<N extends LoaderName> {
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
  formData: Record<string, unknown>
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

export type ActionResponsePayload = Response & { _data: { data?: Record<string, any>; action?: Record<string, any> } }

export interface ErrorRef {
  statusCode: number
  statusMessage: string
  data: unknown
}
