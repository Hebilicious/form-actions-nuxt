import { ref } from "vue"
import { useThrottleFn } from "@vueuse/core"
import { NITRO_LOADER_PREFIX } from "../utils"
import { useFetch, useRoute } from "#imports"
import type { FetchNuxtLoaderFunction, LoaderName, MultiWatchSources } from "#build/types/loader-types.d.ts"

export type Loader = | LoaderName | undefined | false

const lastSubpath = (path: string) => path.split("/").pop() as string
export const getActionName = (loader?: Loader) => typeof loader === "string" ? loader : lastSubpath(useRoute().path.substring(1))
export const getLoaderUrl = (loader?: Loader) => loader === false ? "" : `/${NITRO_LOADER_PREFIX}/${getActionName(loader)}`

/**
 * Return data from a loader with type-safety.
 * @param loader Loader
 * @returns
 */
export function useLoader<R extends LoaderName>(loader?: R | undefined | false, watch?: MultiWatchSources) {
  const fetchNuxtLoader: FetchNuxtLoaderFunction<R> = async (url: string, watch?: MultiWatchSources) => {
    const { data: result, refresh, pending, error } = await useFetch(url, { watch, immediate: true })
    return { result, refresh, pending, error } // Because we're forcing the return, we get a static type here.
  }

  const load = useThrottleFn(async (loader?: Loader, watch?: MultiWatchSources) => {
    const url = getLoaderUrl(loader)
    if (url.length > 0) return fetchNuxtLoader(url, watch)
    return { result: ref(null), refresh: () => {}, pending: ref(false), error: ref(null) }
  }, 75)

  return load(loader, watch)
}
