<script setup>
const { data } = useFormAction({ loader: "books" })
</script>

<template>
  <h1>Books</h1>
  <pre>{{ data }}</pre>
</template>
