<script setup lang="ts">
import type { ComponentConfig } from '@/types'

defineProps<{
  config: ComponentConfig
}>()
</script>

<template>
  <div class="page-break">
    <div class="page-break__line"></div>
    <span class="page-break__label">分页符</span>
    <div class="page-break__line"></div>
  </div>
</template>

<style scoped>
.page-break {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
}
.page-break__line {
  flex: 1;
  height: 1px;
  background: #d9d9d9;
}
.page-break__label {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}
</style>
