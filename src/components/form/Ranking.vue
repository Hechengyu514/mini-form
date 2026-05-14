<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentConfig } from '@/types'
import '@/assets/styles/form-field.css'
import { VueDraggable } from 'vue-draggable-plus'

const props = defineProps<{
  config: ComponentConfig
  modelValue?: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const items = computed({
  get: () => {
    const order = Array.isArray(props.modelValue) ? props.modelValue : (props.config.options?.map((o) => o.id) ?? [])
    const opts = props.config.options ?? []
    return order
      .map((id) => opts.find((o) => o.id === id))
      .filter(Boolean) as { id: string; label: string }[]
  },
  set: (val) => {
    emit('update:modelValue', val.map((v) => v.id))
  },
})
</script>

<template>
  <label class="form-field-label">
    <span v-if="config.required" class="form-field-required">*</span>
    {{ config.title }}
  </label>
  <p v-if="config.description" class="form-field-desc">{{ config.description }}</p>
  <VueDraggable
    v-model="items"
    :animation="150"
    handle=".rank-handle"
    ghost-class="rank-ghost"
    class="rank-list"
  >
    <div v-for="(item, idx) in items" :key="item.id" class="rank-item">
      <span class="rank-handle">
        <svg viewBox="0 0 20 20" width="14" height="14" fill="#bbb"><circle cx="7" cy="6" r="1.5"/><circle cx="13" cy="6" r="1.5"/><circle cx="7" cy="14" r="1.5"/><circle cx="13" cy="14" r="1.5"/></svg>
      </span>
      <span class="rank-idx">{{ idx + 1 }}</span>
      <span class="rank-label">{{ item.label }}</span>
    </div>
  </VueDraggable>
</template>

<style scoped>
.rank-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.rank-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  cursor: default;
}
.rank-item:hover {
  border-color: #b3d4ff;
  background: #f0f7ff;
}
.rank-handle {
  cursor: grab;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.rank-handle:active {
  cursor: grabbing;
}
.rank-idx {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: #1677ff;
  background: #e6f4ff;
  border-radius: 4px;
  flex-shrink: 0;
}
.rank-label {
  font-size: 14px;
  color: #333;
}
.rank-ghost {
  opacity: 0.4;
  background: #e6f4ff;
  border: 2px dashed #1677ff;
}
</style>
