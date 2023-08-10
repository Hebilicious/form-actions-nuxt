import type { ComputedRef } from "vue"
import type { FetchError } from "ofetch"
import type { ErrorRef, UseFormAction } from "../types"
import type { LoaderName, Loaders } from "#build/types/loader-types.d.ts"

/**
 * Use form action does the following :
 * - Get the data from the loader
 * - Listen to the form submission
 * - Handle custom logic and optimistic updates
 * - Submit the form data to the server
 * - Refresh the loader
 * - Handle CSR navigation / error
 */
export declare function useFormAction<Name extends LoaderName>({ run, loader, loaderOptions }?: UseFormAction<Name>): Promise<{
    data: ComputedRef<{
        loader: Loaders[Name] | null;
        formResponse: Record<string, unknown>;
        actionResponse: Record<string, unknown>;
    }>;
    loading: ComputedRef<boolean>;
    error: ComputedRef<ErrorRef | FetchError<any> | undefined>;
    enhance: {
        setElement(el: HTMLFormElement): void;
        cleanup(): void;
    };
}>
