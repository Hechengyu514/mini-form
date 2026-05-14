<script setup lang="ts">
import type { ComponentConfig } from '@/types'
import '@/assets/styles/form-field.css'

defineProps<{
  config: ComponentConfig
  modelValue?: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()
</script>

<template>
  <label class="form-field-label">
    <span v-if="config.required" class="form-field-required">*</span>
    {{ config.title }}
  </label>
  <p v-if="config.description" class="form-field-desc">{{ config.description }}</p>
  <a-checkbox-group
    :value="modelValue ?? []"
    @change="emit('update:modelValue', $event)"
  >
    <a-checkbox
      v-for="opt in config.options"
      :key="opt.id"
      :value="opt.value"
    >
      {{ opt.label }}
    </a-checkbox>
  </a-checkbox-group>
</template>

<style scoped>
.form-field-label {
  display: block;
}
</style>
