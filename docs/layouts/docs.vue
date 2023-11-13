<script setup lang="ts">
const navigation = await useNavigation()
</script>

<template>
  <div>
    <UMain>
      <UContainer>
        <UPage>
          <template #left>
            <UAside>
              <template #top>
                <UDocsSearchButton size="md" />
              </template>
              <UNavigationTree :links="mapContentNavigation(navigation)" />
            </UAside>
          </template>
          <slot />
        </UPage>
      </UContainer>
    </UMain>
  </div>
</template>
