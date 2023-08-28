<script setup lang="ts">
const { result } = await useLoader("mangas")
</script>

<template>
  <div>
    <h1>Mangas Main</h1>
    {{ result }}
  </div>
</template>
