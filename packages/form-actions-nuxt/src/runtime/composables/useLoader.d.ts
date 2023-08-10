import type { Ref } from "vue"
import type { FetchResult, Loaders, LoaderName, LoaderOptions } from "#build/types/loader-types.d.ts"
/**
 * Return data from a loader with type-safety.
 * @param loader Loader
 * @returns
 */
export declare function useLoader<Name extends LoaderName>(loader?: Name | undefined | false, loaderOptions?: LoaderOptions):
  Promise<FetchResult<Loaders[Name]> | { result: Ref<null>; refresh: () => void; pending: Ref<boolean>; error: Ref<null> }>
