export const useNavigation = async () => {
  const { data } = await useAsyncData("navigation", () => fetchContentNavigation())
  return data
}
