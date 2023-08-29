<script setup lang="ts">
const pages = [
  { name: "Home", path: "/" },
  { name: "Cool", path: "/cool" },
  { name: "Mangas", path: "/mangas" },
  { name: "Mangas:[id]", path: "/mangas/naruto" },
  { name: "Books", path: "/books" },
  { name: "Books:[bookId]", path: "/books/5" },
  { name: "Todos", path: "/todos" },
  { name: "Login", path: "/login" },
  { name: "Advanced Login", path: "/advanced-login" },
  { name: "Nested:Here", path: "/nested/here" },
  { name: "Nested:NestedAgain:Books", path: "/nested/nested-again/books" },
  { name: "Nested:NestedAgain:Stuff", path: "/nested/nested-again/stuff" }
]
</script>

<template>
  <div>
    <h1>Advanced playground</h1>
    <nav>
      <template v-for="page of pages" :key="page.path">
        <NuxtLink :to="page.path">
          {{ page.name }}
        </NuxtLink>
      </template>
    </nav>
    <hr>
    <slot />
  </div>
</template>

<style>
nav {
  display: flex;
  gap: 1rem;
}
</style>
