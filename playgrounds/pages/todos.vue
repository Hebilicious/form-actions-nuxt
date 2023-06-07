<script setup lang="ts">
const { data, enhance: createTodo } = await useFormAction({ loader: "todos" })
const { enhance: deleteTodo } = await useFormAction({
  loader: "todos", // This is needed for typesafety
  run: ({ optimistic, formData }) => {
    // You can call cancel() here if you want to manually submit the form.
    optimistic(({ result }) => {
      result.value.todos = result.value.todos.filter(todo => todo.id !== formData.id)
    })
  }
})
</script>

<template>
  <div>
    <h1>Todos</h1>

    <form v-enhance="createTodo" method="POST" action="todos">
      <label>
        add a todo:
        <input
          name="description"
          autocomplete="off"
        >
      </label>
    </form>

    <ul v-if="data.loader?.todos" class="todos">
      <li v-for="todo in data.loader.todos" :key="todo.id">
        <form v-enhance="deleteTodo" method="POST" action="todos?delete">
          <input type="hidden" name="id" :value="todo.id">
          <span>{{ todo.description }} - {{ todo.id }}</span>
          <button aria-label="Mark as complete" />
        </form>
      </li>
    </ul>
  </div>
</template>
