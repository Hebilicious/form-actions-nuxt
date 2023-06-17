<script setup lang="ts">
const { result } = await useLoader()
</script>

<template>
  <div>
    <h1>Stuff</h1>
    {{ result }}
  </div>
</template>
