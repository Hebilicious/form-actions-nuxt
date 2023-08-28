import { computed, ref } from "vue"
import { useThrottleFn } from "@vueuse/core"
import { NITRO_LOADER_PREFIX } from "../utils"
import { useFetch, useRoute } from "#imports"
import type { FetchNuxtLoaderFunction, LoaderName, LoaderOptions } from "#build/types/loader-types.d.ts"

type Loader = | LoaderName | undefined | false

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
export async function useLoader<Name extends LoaderName>(loader?: Name | undefined | false, loaderOptions?: LoaderOptions) {
  const params = computed(() => useRoute().params)

  const fetchNuxtLoader: FetchNuxtLoaderFunction<Name> = async (url: string, loaderOptions?: LoaderOptions) => {
    const { data: result, refresh, pending, error } = await useFetch(url, { key: url, immediate: true, params, ...loaderOptions })
    return { result, refresh, pending, error } // Because we're forcing the return, we get a static type here.
  }

  const load = useThrottleFn(async (loader?: Loader, loaderOptions?: LoaderOptions) => {
    const url = getLoaderUrl(loader)
    // @todo automatically detect if the loader doesn't exist.
    if (url) return fetchNuxtLoader(url, loaderOptions)
    return { result: ref(null), refresh: () => {}, pending: ref(false), error: ref(null) }
  }, 75)

  return load(loader, loaderOptions)
}
