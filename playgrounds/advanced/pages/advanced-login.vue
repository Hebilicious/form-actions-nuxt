<script setup>
const { enhance, data } = await useFormAction()
</script>

<template>
  <form v-enhance="enhance" method="POST" action="login">
    <p v-if="data.formResponse?.missing" class="error">
      The email field is required
    </p>
    <p v-if="data.formResponse?.incorrect" class="error">
      Invalid credentials!
    </p>
    <p v-if="data.formResponse?.register" class="success">
      Succesfully Registered !
    </p>
    <label>
      Email
      <input name="email" type="email" :value="data.formResponse?.email ?? ''">
    </label>
    <label>
      Password
      <input name="password" type="password">
    </label>
    <button>Log in</button>
    <button formaction="login?register">
      Register
    </button>
  </form>
</template>
