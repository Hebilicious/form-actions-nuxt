<script setup lang="ts">
import { useForm } from "@vorms/core"
import { zodResolver } from "@vorms/resolvers/zod"
import z from "zod"

const { register, errors, validateForm } = useForm({
  initialValues: {
    account: "",
    password: "",
    remember: false
  },
  validate: zodResolver(
    z.object({
      account: z.string().min(1, "Account is required!"),
      password: z.string().min(1, "Password is required!")
    })
  ),
  onSubmit() { }
})

const { enhance } = await useFormAction({
  run: async ({ cancel, submitForm }) => {
    cancel() // Cancel the default form submission
    const result = await validateForm() // Validate with the library
    if (Object.keys(result).length === 0) await submitForm() // Submit the form if valid ...
  }
})

const { value: account, attrs: accountAttrs } = register("account", {
  validate(value) {
    if (!value) return "Account is required!"
  }
})
const { value: password, attrs: passwordAttrs } = register("password")
const { value: remember, attrs: rememberAttrs } = register("remember")
</script>

<template>
  <div class="Wrapper">
    <form v-enhance="enhance">
      <div class="field">
        <input
          v-model="account"
          class="field__input"
          type="text"
          placeholder="Account"
          v-bind="accountAttrs"
        >
        <div v-show="'account' in errors" class="field__error">
          {{ errors.account }}
        </div>
      </div>
      <div class="field">
        <input
          v-model="password"
          class="field__input"
          type="password"
          placeholder="Password"
          v-bind="passwordAttrs"
        >
        <div v-show="'password' in errors" class="field__error">
          {{ errors.password }}
        </div>
      </div>

      <div class="field checkbox">
        <input
          id="remember"
          v-model="remember"
          class="field__checkbox"
          type="checkbox"
          v-bind="rememberAttrs"
        >
        <label for="remember">remember</label>
      </div>

      <div class="field">
        <input type="submit">
      </div>
    </form>
  </div>
</template>

<style lang="css">
body {
  background: #344951;
  color: white;
}
.Wrapper {
  display: grid;
  place-items: center;
  min-height: 100dvh;
}

form {
  min-width: 25rem;
}

.field + .field {
  margin-top: 15px;
}

.field__input,
input[type='submit'] {
  box-sizing: border-box;
  width: 100%;
  border-radius: 4px;
  border: 1px solid white;
  padding: 12px 16px;
}

.field__error {
  color: red;
  margin-top: 2px;
}

.checkbox {
  display: flex;
  align-items: center;
}

.field__checkbox {
  accent-color: #41b883;
}

.field__checkbox + label {
  margin-left: 4px;
}

input[type='submit'] {
  background: #41b883;
  border: 1px solid #41b883;
  color: #344951;
  cursor: pointer;
}
</style>
