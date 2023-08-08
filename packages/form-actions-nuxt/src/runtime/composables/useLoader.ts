import { ref } from "vue"
import { useThrottleFn } from "@vueuse/core"
import { NITRO_LOADER_PREFIX } from "../utils"
import { useFetch, useRoute } from "#imports"
import type { FetchNuxtLoaderFunction, LoaderName, MultiWatchSources } from "#build/types/loader-types.d.ts"

export type Loader = | LoaderName | undefined | false

const getLoaderName = (loaderName: LoaderName) => `/${NITRO_LOADER_PREFIX}/${loaderName}` as const
const lastSubpath = (path: string) => path.split("/").pop() as string
const validLoaderName = (loader: Loader): loader is LoaderName => typeof loader === "string" && loader.length > 0
export const getActionName = (loader: Loader): LoaderName | string => validLoaderName(loader) ? loader : lastSubpath(useRoute().path.substring(1))
export const getLoaderUrl = (loader: Loader) => validLoaderName(loader) ? getLoaderName(loader) : undefined

/**
 * Return data from a loader with type-safety.
 * @param loader Loader
 * @returns
 */
export function useLoader<Name extends LoaderName>(loader?: Name | undefined | false, watch?: MultiWatchSources) {
  const fetchNuxtLoader: FetchNuxtLoaderFunction<Name> = async (url: string, watch?: MultiWatchSources) => {
    const { data: result, refresh, pending, error } = await useFetch(url, { watch, immediate: true })
    return { result, refresh, pending, error } // Because we're forcing the return, we get a static type here.
  }

  const load = useThrottleFn(async (loader?: Loader, watch?: MultiWatchSources) => {
    const url = getLoaderUrl(loader)
    // @todo automatically detect if the loader doesn't exist.
    if (url) return fetchNuxtLoader(url, watch)
    return { result: ref(null), refresh: () => {}, pending: ref(false), error: ref(null) }
  }, 75)

  return load(loader, watch)
}
