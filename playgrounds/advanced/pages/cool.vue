<server lang="ts">
export const loader = defineServerLoader(async () => {
  return { cool: "stuff", supercool: "more-stuffsss" }
})
</server>

<script setup lang="ts">
const { result } = await useLoader("cool")
</script>

<template>
  <div>
    <h1>Stuff</h1>
    {{ result }}
  </div>
</template>
