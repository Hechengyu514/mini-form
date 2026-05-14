<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentConfig } from '@/types'
import '@/assets/styles/form-field.css'

const props = defineProps<{
  config: ComponentConfig
  modelValue?: Record<string, Record<string, string>>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, Record<string, string>>]
}>()

const rows = computed(() => props.config.matrixRows ?? [])
const cols = computed(() => props.config.matrixColumns ?? [])

function getCellVal(rowId: string, colId: string): string {
  const mv = (props.modelValue && typeof props.modelValue === 'object') ? props.modelValue : {}
  return (mv[rowId] as Record<string, string> | undefined)?.[colId] ?? ''
}

function setCellVal(rowId: string, colId: string, val: string) {
  const cur = { ...props.modelValue }
  if (!cur[rowId]) cur[rowId] = {}
  cur[rowId] = { ...cur[rowId], [colId]: val }
  emit('update:modelValue', cur)
}
</script>

<template>
  <label class="form-field-label">
    <span v-if="config.required" class="form-field-required">*</span>
    {{ config.title }}
  </label>
  <p v-if="config.description" class="form-field-desc">{{ config.description }}</p>
  <div class="matrix-table-wrap">
    <table class="matrix-table">
      <thead>
        <tr>
          <th></th>
          <th v-for="col in cols" :key="col.id">{{ col.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td class="matrix-row-label">{{ row.label }}</td>
          <td v-for="col in cols" :key="col.id" class="matrix-cell">
            <a-input
              :value="getCellVal(row.id, col.id)"
              :placeholder="col.label"
              size="small"
              @input="setCellVal(row.id, col.id, ($event.target as HTMLInputElement).value)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.matrix-table-wrap {
  overflow-x: auto;
}
.matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.matrix-table th,
.matrix-table td {
  padding: 8px 6px;
  border: 1px solid #f0f0f0;
  text-align: center;
}
.matrix-table thead th {
  background: #fafafa;
  font-weight: 500;
  color: #555;
  white-space: nowrap;
}
.matrix-row-label {
  text-align: left !important;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  background: #fafafa;
}
.matrix-cell {
  min-width: 100px;
}
</style>
