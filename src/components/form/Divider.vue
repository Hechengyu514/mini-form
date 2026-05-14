<script setup lang="ts">
import type { ComponentConfig } from '@/types'

defineProps<{
  config: ComponentConfig
}>()
</script>

<template>
  <a-divider>{{ config.title || '' }}</a-divider>
</template>
