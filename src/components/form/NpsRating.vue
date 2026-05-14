<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentConfig } from '@/types'
import '@/assets/styles/form-field.css'

const props = defineProps<{
  config: ComponentConfig
  modelValue?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const scores = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

const label = computed(() => {
  const v = props.modelValue
  if (v === undefined || v === null) return ''
  if (v <= 6) return '贬损者'
  if (v <= 8) return '被动者'
  return '推荐者'
})

const labelColor = computed(() => {
  if (label.value === '推荐者') return '#52c41a'
  if (label.value === '被动者') return '#faad14'
  if (label.value === '贬损者') return '#ff4d4f'
  return ''
})
</script>

<template>
  <label class="form-field-label">
    <span v-if="config.required" class="form-field-required">*</span>
    {{ config.title }}
  </label>
  <p v-if="config.description" class="form-field-desc">{{ config.description }}</p>
  <p v-if="!config.description" class="form-field-desc">0 = 非常不愿意推荐，10 = 非常愿意推荐</p>
  <div class="nps-row">
    <button
      v-for="s in scores"
      :key="s"
      type="button"
      class="nps-btn"
      :class="{ active: modelValue === s }"
      @click="emit('update:modelValue', s)"
    >
      {{ s }}
    </button>
  </div>
  <div v-if="label" class="nps-label" :style="{ color: labelColor, borderColor: labelColor }">
    {{ label }}（{{ modelValue }} 分）
  </div>
</template>

<style scoped>
.nps-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.nps-btn {
  width: 36px;
  height: 36px;
  border: 2px solid #d9d9d9;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  font-weight: 600;
  color: #555;
  cursor: pointer;
  transition: all 0.15s;
}
.nps-btn:hover {
  border-color: #1677ff;
  color: #1677ff;
}
.nps-btn.active {
  background: #1677ff;
  border-color: #1677ff;
  color: #fff;
}
.nps-label {
  margin-top: 12px;
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid;
}
</style>
