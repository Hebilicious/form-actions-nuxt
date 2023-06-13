export const NUXT_PE_HEADER = "x-nuxt-progressive-enhancement" as const
export const NITRO_LOADER_PREFIX = "_nitro/loader" as const

/** Template Strings */

export const loaderTypesBefore = /* typescript */`
import type { EventHandler } from "h3"
import type { Ref, WatchSource } from "vue"

export type MultiWatchSources = (WatchSource<unknown> | object)[]

type ExtractLoader<Type> = Type extends EventHandler<infer X> ? X : never;` as const

export const loaderTypesAfter = /* typescript */`
interface AsyncDataExecuteOptions {
    _initial?: boolean
    dedupe?: boolean
  }
  
type FetchResult<T> = {
  result: Ref<T>
  refresh: (opts?: AsyncDataExecuteOptions) => Promise<void>
  pending: Ref<boolean>
  error: Ref<FetchError | null>
}
    
export type FetchNuxtLoaderFunction<T extends LoaderName> = (url: T, watch?: MultiWatchSources) => Promise<FetchResult<Loaders[T]>>` as const
