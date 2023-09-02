<script lang="ts" setup>
defineOptions({
  inheritAttrs: false
})

defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  }
})
</script>

<template>
  <div class="w-full h-full flex flex-col justify-between items-start bg-[#020420] p-20 pt-32 pb-16">
    <div
      style="position: absolute;width: 1156px;height: 1000px;left: -215px;top: -337px;background: radial-gradient(50% 50% at 50% 50%, #00DC82 0%, rgba(0, 220, 130, 0) 100%);filter: blur(180.5px);opacity: 0.5;"
    />
    <div>
      <h1 class="text-8xl mb-4 text-white flex items-center">
        <span>{{ title }}</span>
      </h1>
      <p class="text-5xl text-gray-200 leading-tight pr-10">
        {{ description }}
      </p>
    </div>
    <div class="flex items-end text-4xl font-semibold flex-nowrap">
      <Logo class="w-14 h-14 mr-2" />
      <span class="text-white pb-0.5 mr-2">Nuxt</span> <span class="pb-0.5 text-green-400">FormActions</span>
    </div>
  </div>
</template>

<style scoped>
._gradient {

}
</style>
