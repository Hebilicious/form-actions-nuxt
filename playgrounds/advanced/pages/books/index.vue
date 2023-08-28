<script setup lang="ts">
const route = useRoute()
const { result } = await useLoader("books")
</script>

<template>
  <div>
    <h1>Main Books</h1>
    {{ route.params }}
    {{ result }}
  </div>
</template>
