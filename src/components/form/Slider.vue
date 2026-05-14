<script setup lang="ts">
import type { ComponentConfig } from '@/types'
import '@/assets/styles/form-field.css'

const props = defineProps<{
  config: ComponentConfig
  modelValue?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const min = (props.config.props?.min as number) ?? 0
const max = (props.config.props?.max as number) ?? 100
const step = (props.config.props?.step as number) ?? 1
</script>

<template>
  <label class="form-field-label">
    <span v-if="config.required" class="form-field-required">*</span>
    {{ config.title }}
  </label>
  <p v-if="config.description" class="form-field-desc">{{ config.description }}</p>
  <div class="slider-wrap">
    <a-slider
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      style="flex: 1"
      @change="emit('update:modelValue', $event)"
    />
    <span class="slider-value">{{ modelValue ?? min }}</span>
  </div>
</template>

<style scoped>
.slider-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}
.slider-value {
  font-size: 14px;
  font-weight: 600;
  color: #1677ff;
  min-width: 36px;
  text-align: right;
}
</style>
