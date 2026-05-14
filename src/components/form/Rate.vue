<script setup lang="ts">
import type { ComponentConfig } from '@/types'
import '@/assets/styles/form-field.css'

defineProps<{
  config: ComponentConfig
  modelValue?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()
</script>

<template>
  <label class="form-field-label">
    <span v-if="config.required" class="form-field-required">*</span>
    {{ config.title }}
  </label>
  <p v-if="config.description" class="form-field-desc">{{ config.description }}</p>
  <a-rate :value="modelValue ?? 0" @change="emit('update:modelValue', $event)" />
</template>

<style scoped>
.form-field-label {
  margin-right: 8px;
}
</style>
