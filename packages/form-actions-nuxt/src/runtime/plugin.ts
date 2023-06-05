import { defineNuxtPlugin } from "#imports"

export default defineNuxtPlugin((nuxt) => {
  /**
   * The v-enhance directive should do the following:
   * 1. Bind the element to the useFormAction composable
   * 2. Run useFormAction cleanups when the component is unmounted
   */
  nuxt.vueApp.directive("enhance", {
    created(el, binding) {
      const enhancedFormElement = el as HTMLFormElement
      binding.value.setElement(enhancedFormElement)
    },
    unmounted(el, binding) {
      binding.value.cleanup()
    }
  })
})
