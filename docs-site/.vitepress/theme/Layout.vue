<script setup>
import DefaultTheme from 'vitepress/theme'
import LastUpdated from './LastUpdated.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #doc-footer-before>
      <LastUpdated />
    </template>
  </Layout>
</template>
