/**
 * This file is a reference for what the generated types should look like.
 * This file won't be included in the module, but it is useful while developping
 * The form-actions module.
 */

import type { Ref, WatchSource } from "vue";
import type { FetchError, SearchParameters } from "ofetch"

type MultiWatchSources = (WatchSource<unknown> | object)[]

export type LoaderOptions = {
  watch?: MultiWatchSources
  params?: SearchParameters
}

type LoaderUrl = "/__loader/books" | "/__loader/stuff" | "/__loader/todos"

type LoaderName = "books" | "stuff" | "todos"

type LoaderData = any

export interface Loaders {
    "books": LoaderData
    "stuff": LoaderData
    "todos": LoaderData
}

interface AsyncDataExecuteOptions {
    _initial?: boolean
    dedupe?: boolean
}

type FetchResult<T> = {
    result: Ref<T | null>
    refresh: (opts?: AsyncDataExecuteOptions) => Promise<unknown>
    pending: Ref<boolean>
    error: Ref<FetchError | null>
}

export type FetchNuxtLoaderFunction<T extends LoaderName> = (url: string, loaderOptions?: LoaderOptions) => Promise<FetchResult<Loaders[T]>>
