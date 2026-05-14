<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentConfig } from '@/types'
import '@/assets/styles/form-field.css'

const props = defineProps<{
  config: ComponentConfig
  modelValue?: Record<string, string | string[]>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string | string[]>]
}>()

const rows = computed(() => props.config.matrixRows ?? [])
const cols = computed(() => props.config.matrixColumns ?? [])
const mode = computed(() => props.config.matrixMode ?? 'radio')

function getRowVal(rowId: string) {
  const mv = (props.modelValue && typeof props.modelValue === 'object') ? props.modelValue : {}
  return mv[rowId] ?? (mode.value === 'checkbox' ? [] : '')
}

function setRowVal(rowId: string, val: string | string[]) {
  emit('update:modelValue', { ...props.modelValue, [rowId]: val })
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
            <a-radio
              v-if="mode === 'radio'"
              :checked="getRowVal(row.id) === col.id"
              @change="setRowVal(row.id, col.id)"
            />
            <a-checkbox
              v-else
              :checked="(getRowVal(row.id) as string[]).includes(col.id)"
              @change="(checked: boolean) => {
                const cur = (getRowVal(row.id) as string[])
                setRowVal(row.id, checked ? [...cur, col.id] : cur.filter((v: string) => v !== col.id))
              }"
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
  padding: 10px 8px;
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
  width: 60px;
}
</style>
