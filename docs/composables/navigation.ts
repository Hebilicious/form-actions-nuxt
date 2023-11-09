import type { NavItem } from "@nuxt/content/dist/runtime/types"

export const useNavigation = async () => {
  const { data } = await useAsyncData("navigation", () => fetchContentNavigation())
  return data as Ref<NavItem[]>
}
