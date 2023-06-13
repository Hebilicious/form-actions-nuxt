<script setup>
const { result } = useLoader("books")
</script>

<template>
  <h1>Hello World !</h1>
  <pre>{{ result }}</pre>
</template>
