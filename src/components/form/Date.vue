<script setup lang="ts">
import type { ComponentConfig } from '@/types'
import '@/assets/styles/form-field.css'

defineProps<{
  config: ComponentConfig
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <label class="form-field-label">
    <span v-if="config.required" class="form-field-required">*</span>
    {{ config.title }}
  </label>
  <p v-if="config.description" class="form-field-desc">{{ config.description }}</p>
  <a-date-picker
    :value="modelValue || undefined"
    :placeholder="config.placeholder"
    style="width: 100%"
    @change="emit('update:modelValue', $event ? $event.format('YYYY-MM-DD') : '')"
  />
</template>
