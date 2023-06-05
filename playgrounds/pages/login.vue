<script setup>
// This form works without any JS, the useActionForm can be removed and the app will use server side navigation.
</script>

<template>
  <form method="POST">
    <label>
      Email
      <input name="email" type="email" autocomplete="username">
    </label>
    <label>
      Password
      <input name="password" type="password" autocomplete="current-password">
    </label>
    <button>Log in</button>
  </form>
</template>
