<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { page } = useData()
const date = computed(() => page.value.lastUpdated ? new Date(page.value.lastUpdated) : null)
const iso = computed(() => date.value?.toISOString())
const label = computed(() => date.value
  ? new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC'
    }).format(date.value)
  : '')
</script>

<template>
  <p v-if="date" class="agent-os-last-updated">
    Last updated: <time :datetime="iso">{{ label }} UTC</time>
  </p>
</template>
