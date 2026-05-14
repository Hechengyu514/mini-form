<script setup lang="ts">
import { useEditorStore } from '@/stores'
import { generateUUID } from '@/utils/uuid'

const store = useEditorStore()

function updateRow(idx: number, label: string) {
  if (!store.selectedComp?.matrixRows) return
  const rows = [...store.selectedComp.matrixRows]
  const row = rows[idx]
  if (!row) return
  rows[idx] = { ...row, label }
  store.updateSelectedComp({ matrixRows: rows })
}

function addRow() {
  if (!store.selectedComp?.matrixRows) return
  const rows = [
    ...store.selectedComp.matrixRows,
    { id: generateUUID(), label: `行${store.selectedComp.matrixRows.length + 1}` },
  ]
  store.updateSelectedComp({ matrixRows: rows })
}

function removeRow(idx: number) {
  if (!store.selectedComp?.matrixRows) return
  const rows = [...store.selectedComp.matrixRows]
  rows.splice(idx, 1)
  store.updateSelectedComp({ matrixRows: rows })
}

function updateColumn(idx: number, label: string) {
  if (!store.selectedComp?.matrixColumns) return
  const cols = [...store.selectedComp.matrixColumns]
  const col = cols[idx]
  if (!col) return
  cols[idx] = { ...col, label }
  store.updateSelectedComp({ matrixColumns: cols })
}

function addColumn() {
  if (!store.selectedComp?.matrixColumns) return
  const cols = [
    ...store.selectedComp.matrixColumns,
    { id: generateUUID(), label: `列${store.selectedComp.matrixColumns.length + 1}` },
  ]
  store.updateSelectedComp({ matrixColumns: cols })
}

function removeColumn(idx: number) {
  if (!store.selectedComp?.matrixColumns) return
  const cols = [...store.selectedComp.matrixColumns]
  cols.splice(idx, 1)
  store.updateSelectedComp({ matrixColumns: cols })
}
</script>

<template>
  <div v-if="store.selectedComp?.matrixRows" class="setting-section">
    <h4 class="setting-section__title">矩阵行</h4>
    <div
      v-for="(row, idx) in store.selectedComp.matrixRows"
      :key="row.id"
      class="setting-option-row"
    >
      <a-input
        :value="row.label"
        size="small"
        @input="updateRow(idx, ($event.target as HTMLInputElement).value)"
      />
      <a-button
        size="small"
        type="text"
        danger
        :disabled="store.selectedComp.matrixRows!.length <= 1"
        @click="removeRow(idx)"
      >
        删除
      </a-button>
    </div>
    <a-button size="small" block @click="addRow">+ 添加行</a-button>
  </div>

  <div v-if="store.selectedComp?.matrixColumns" class="setting-section">
    <h4 class="setting-section__title">矩阵列</h4>
    <div
      v-for="(col, idx) in store.selectedComp.matrixColumns"
      :key="col.id"
      class="setting-option-row"
    >
      <a-input
        :value="col.label"
        size="small"
        @input="updateColumn(idx, ($event.target as HTMLInputElement).value)"
      />
      <a-button
        size="small"
        type="text"
        danger
        :disabled="store.selectedComp.matrixColumns!.length <= 1"
        @click="removeColumn(idx)"
      >
        删除
      </a-button>
    </div>
    <a-button size="small" block @click="addColumn">+ 添加列</a-button>
  </div>

  <div
    v-if="store.selectedComp?.matrixMode !== undefined"
    class="setting-section"
  >
    <h4 class="setting-section__title">矩阵选项</h4>
    <div class="setting-row">
      <label>选择模式</label>
      <a-select
        :value="store.selectedComp.matrixMode"
        size="small"
        @change="store.updateSelectedComp({ matrixMode: $event })"
      >
        <a-select-option value="radio">单选</a-select-option>
        <a-select-option value="checkbox">多选</a-select-option>
      </a-select>
    </div>
  </div>
</template>
