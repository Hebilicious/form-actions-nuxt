import { ref } from "vue"
import { useThrottleFn } from "@vueuse/core"
import { NITRO_LOADER_PREFIX } from "../utils"
import { useFetch, useRoute, useRuntimeConfig } from "#imports"
import type { FetchNuxtLoaderFunction, LoaderName } from "#build/types/form-action-loaders.d.ts"

export type Loader = | LoaderName | undefined | false

const lastSubpath = (path: string) => path.split("/").pop() as string
export const getActionName = (loader?: Loader) => typeof loader === "string" ? loader : lastSubpath(useRoute().path.substring(1))
export const getLoaderUrl = (loader?: Loader) => loader === false ? "" : `/${NITRO_LOADER_PREFIX}/${getActionName(loader)}`

/**
 * Return data from a loader with type-safety.
 * @param loader Loader
 * @returns
 */
export function useLoader<R extends LoaderName>(loader?: R | undefined | false) {
  const fetchNuxtLoader: FetchNuxtLoaderFunction<R> = async (url: string, watch?: any[]) => {
    const { data: result, refresh, pending } = await useFetch(url, { watch, immediate: true })
    return { result, refresh, pending } // Because we're forcing the return, we get a static type here.
  }

  const load = useThrottleFn(async (loader?: Loader, watch?: any[]) => {
    const hasLoader = useRuntimeConfig().public.__serverLoaders__.find((l: string) => l === getActionName(loader)) as boolean

    const url = getLoaderUrl(loader)
    if (hasLoader && url.length > 0) {
      return fetchNuxtLoader(url, watch)
    }
    return { result: ref(null), refresh: () => {}, pending: ref(false) }
  }, 75)

  return load(loader)
}
