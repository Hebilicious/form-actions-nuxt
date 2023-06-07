<script setup lang="ts">
const { result } = await useLoader("books")
</script>

<template>
  <div>
    <h1>Books</h1>
    {{ result }}
  </div>
</template>
