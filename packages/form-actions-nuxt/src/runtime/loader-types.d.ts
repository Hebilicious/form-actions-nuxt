/**
 * This file is a reference for what the generated types should look like.
 * This file won't be included in the module, but `useFormAction` references it
 * through tsconfig in development only.
 */

import { type Ref } from "vue";

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
    refresh: (opts?: AsyncDataExecuteOptions) => Promise<void>
    pending: Ref<boolean>
}
  
export type FetchNuxtLoaderFunction<T extends LoaderName> = (url: string, watch?: any[]) => Promise<FetchResult<Loaders[T]>>
