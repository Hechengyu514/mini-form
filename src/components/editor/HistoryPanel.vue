<script setup lang="ts">
/**
 * 操作历史面板 — 展示撤销/重做栈，支持点击跳转到指定历史状态
 */
import { ref, computed } from 'vue'
import { useEditorStore } from '@/stores'

const store = useEditorStore()
const open = ref(false)

const undoItems = computed(() => [...store.undoStack].reverse())
const redoItems = computed(() => [...store.redoStack].reverse())

function jumpToUndo(index: number) {
  const steps = undoItems.value.length - index
  for (let i = 0; i < steps; i++) store.undo()
}

function jumpToRedo(index: number) {
  const steps = redoItems.value.length - index
  for (let i = 0; i < steps; i++) store.redo()
}
</script>

<template>
  <a-popover
    v-model:open="open"
    trigger="click"
    placement="bottomRight"
    :overlay-style="{ maxWidth: '320px' }"
  >
    <template #content>
      <div class="history-panel">
        <div class="history-section">
          <h4 class="history-title">
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none"><path d="M4 7h6a3 3 0 010 6H7" stroke="currentColor" stroke-width="1.5" fill="none"/><polyline points="5,4 2,7 5,10" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
            可撤销
            <span class="history-count">{{ undoItems.length }}</span>
          </h4>
          <div v-if="undoItems.length === 0" class="history-empty">无</div>
          <div
            v-for="(cmd, index) in undoItems"
            :key="index"
            class="history-item undo-item"
            @click="jumpToUndo(index)"
          >
            <span class="history-item__dot"></span>
            <span class="history-item__label">{{ cmd.description || '未知操作' }}</span>
          </div>
        </div>

        <div v-if="redoItems.length > 0" class="history-section">
          <h4 class="history-title redo-title">
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none"><path d="M12 7H6a3 3 0 000 6h3" stroke="currentColor" stroke-width="1.5" fill="none"/><polyline points="11,4 14,7 11,10" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
            可重做
            <span class="history-count">{{ redoItems.length }}</span>
          </h4>
          <div
            v-for="(cmd, index) in redoItems"
            :key="index"
            class="history-item redo-item"
            @click="jumpToRedo(index)"
          >
            <span class="history-item__dot"></span>
            <span class="history-item__label">{{ cmd.description || '未知操作' }}</span>
          </div>
        </div>
      </div>
    </template>

    <a-tooltip title="操作历史">
      <a-button size="small" :type="open ? 'primary' : 'default'">
        <template #icon>
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.3"/><polyline points="8,4 8,8 11,10" stroke="currentColor" stroke-width="1.3" fill="none"/></svg>
        </template>
        {{ store.undoStack.length }}
      </a-button>
    </a-tooltip>
  </a-popover>
</template>

<style scoped>
.history-panel {
  min-width: 220px;
  max-height: 400px;
  overflow-y: auto;
}
.history-section {
  margin-bottom: 8px;
}
.history-section + .history-section {
  border-top: 1px solid #f0f0f0;
  padding-top: 8px;
}
.history-title {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 600;
  color: #555;
}
.history-title.redo-title {
  color: #fa8c16;
}
.history-count {
  margin-left: auto;
  font-weight: 400;
  color: #999;
}
.history-empty {
  font-size: 12px;
  color: #bbb;
  padding: 4px 0 4px 16px;
}
.history-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 5px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.15s;
}
.history-item:hover {
  background: #f0f5ff;
}
.history-item__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #1677ff;
  flex-shrink: 0;
  margin-top: 5px;
}
.redo-item .history-item__dot {
  background: #fa8c16;
}
.history-item__label {
  color: #333;
  line-height: 1.5;
  word-break: break-all;
}
</style>
