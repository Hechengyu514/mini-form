<script setup lang="ts">
import type { ComponentConfig } from '@/types'
import '@/assets/styles/form-field.css'

defineProps<{
  config: ComponentConfig
  modelValue?: string | string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
}>()
</script>

<template>
  <label class="form-field-label">
    <span v-if="config.required" class="form-field-required">*</span>
    {{ config.title }}
  </label>
  <p v-if="config.description" class="form-field-desc">{{ config.description }}</p>
  <a-select
    :value="modelValue"
    :placeholder="config.placeholder"
    style="width: 100%"
    @change="emit('update:modelValue', $event)"
  >
    <a-select-option v-for="opt in config.options" :key="opt.id" :value="opt.value">
      {{ opt.label }}
    </a-select-option>
  </a-select>
</template>
