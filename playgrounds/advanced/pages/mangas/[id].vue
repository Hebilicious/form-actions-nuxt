<server lang="ts" path="mangas">
export const loader = defineServerLoader(async (event) => {
  return { mangas: ["one-piece"], params: getQuery(event) }
})
</server>

<script setup lang="ts">
const { result } = await useLoader("mangas")
</script>

<template>
  <div>
    <h1>Mangas Nested</h1>
    {{ result }}
  </div>
</template>
