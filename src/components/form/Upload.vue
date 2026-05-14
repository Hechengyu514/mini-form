<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ComponentConfig } from '@/types'
import { generateUUID } from '@/utils/uuid'
import '@/assets/styles/form-field.css'

interface FileItem {
  uid: string
  name: string
  size: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  percent: number
  file?: File
}

const props = defineProps<{
  config: ComponentConfig
  modelValue?: FileItem[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FileItem[]]
}>()

const dropActive = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const maxSize = computed(() => (props.config.props?.maxSize as number) ?? 0)
const accept = computed(() => (props.config.props?.accept as string) ?? '')
const maxCount = computed(() => (props.config.props?.maxCount as number) ?? 0)
const multiple = computed(() => props.config.props?.multiple !== false)

function triggerPick() {
  fileInput.value?.click()
}

function addFiles(raw: FileList | null) {
  if (!raw || raw.length === 0) return
  const existing = (props.modelValue ?? []) as FileItem[]
  const remaining = maxCount.value > 0 ? maxCount.value - existing.filter(f => f.status === 'done').length : Infinity
  if (remaining <= 0) return

  const toAdd: FileItem[] = []
  for (let i = 0; i < Math.min(raw.length, remaining); i++) {
    const file = raw[i]!
    if (maxSize.value > 0 && file.size > maxSize.value * 1024 * 1024) continue
    toAdd.push({
      uid: generateUUID(),
      name: file.name,
      size: file.size,
      status: 'pending',
      percent: 0,
      file,
    })
  }

  const merged = [...existing, ...toAdd]
  emit('update:modelValue', merged)

  toAdd.forEach((item) => {
    uploadFile(item, merged)
  })
}

function uploadFile(item: FileItem, list: FileItem[]) {
  const idx = list.findIndex(f => f.uid === item.uid)
  if (idx === -1 || !item.file) return

  const action = (props.config.props?.action as string) || '/upload'

  // 模拟上传（无后端时直接标记完成）
  if (action === '/upload') {
    simulateUpload(item, idx, list)
    return
  }

  const formData = new FormData()
  formData.append('file', item.file)

  const xhr = new XMLHttpRequest()

  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      const pct = Math.round((e.loaded / e.total) * 100)
      list[idx] = { ...list[idx]!, percent: pct, status: 'uploading' }
      emit('update:modelValue', [...list])
    }
  })

  xhr.addEventListener('load', () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      list[idx] = { ...list[idx]!, percent: 100, status: 'done' }
    } else {
      list[idx] = { ...list[idx]!, status: 'error' }
    }
    emit('update:modelValue', [...list])
  })

  xhr.addEventListener('error', () => {
    list[idx] = { ...list[idx]!, status: 'error' }
    emit('update:modelValue', [...list])
  })

  list[idx] = { ...list[idx]!, status: 'uploading', percent: 0 }
  emit('update:modelValue', [...list])
  xhr.open('POST', action)
  xhr.send(formData)
}

const simulateTimers = new Map<string, ReturnType<typeof setInterval>>()

function simulateUpload(item: FileItem, idx: number, list: FileItem[]) {
  let pct = 0
  const timer = setInterval(() => {
    pct += Math.random() * 40 + 10
    if (pct >= 100) {
      pct = 100
      clearInterval(timer)
      simulateTimers.delete(item.uid)
      list[idx] = { ...list[idx]!, percent: 100, status: 'done' }
    } else {
      list[idx] = { ...list[idx]!, percent: Math.round(pct), status: 'uploading' }
    }
    emit('update:modelValue', [...list])
  }, 200)
  simulateTimers.set(item.uid, timer)
}

function cancelSimulate(uid: string) {
  const timer = simulateTimers.get(uid)
  if (timer) {
    clearInterval(timer)
    simulateTimers.delete(uid)
  }
}

function removeFile(uid: string) {
  cancelSimulate(uid)
  emit('update:modelValue', ((props.modelValue ?? []) as FileItem[]).filter(f => f.uid !== uid))
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  dropActive.value = true
}
function onDragLeave() {
  dropActive.value = false
}
function onDrop(e: DragEvent) {
  e.preventDefault()
  dropActive.value = false
  addFiles(e.dataTransfer?.files ?? null)
}

const fileList = computed(() => (props.modelValue ?? []) as FileItem[])
</script>

<template>
  <label class="form-field-label">
    <span v-if="config.required" class="form-field-required">*</span>
    {{ config.title }}
  </label>
  <p v-if="config.description" class="form-field-desc">{{ config.description }}</p>

  <div
    class="upload-dropzone"
    :class="{ active: dropActive }"
    @click="triggerPick"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <svg class="upload-icon" viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#bfbfbf" stroke-width="1.5">
      <path d="M12 16V4" /><polyline points="8,8 12,4 16,8" />
      <path d="M4 16v4a2 2 0 002 2h12a2 2 0 002-2v-4" />
    </svg>
    <p class="upload-text">点击或拖拽文件至此处上传</p>
    <p class="upload-desc">
      <template v-if="accept">格式: {{ accept }}</template>
      <template v-if="maxSize > 0">{{ accept ? '，' : '' }}单文件 ≤ {{ maxSize }}MB</template>
      <template v-if="maxCount > 0">，最多 {{ maxCount }} 个</template>
      <template v-if="!accept && maxSize <= 0 && maxCount <= 0">支持任意格式文件</template>
    </p>
  </div>

  <input
    ref="fileInput"
    type="file"
    :accept="accept || undefined"
    :multiple="multiple"
    style="display: none"
    @change="addFiles(($event.target as HTMLInputElement).files)"
  />

  <div v-if="fileList.length > 0" class="upload-file-list">
    <div v-for="f in fileList" :key="f.uid" class="upload-file-item">
      <span class="upload-file-name">{{ f.name }}</span>
      <span class="upload-file-size">{{ formatSize(f.size) }}</span>
      <span v-if="f.status === 'uploading'" class="upload-file-status">上传中 {{ f.percent }}%</span>
      <span v-else-if="f.status === 'done'" class="upload-file-status done">完成</span>
      <span v-else-if="f.status === 'error'" class="upload-file-status error">失败</span>
      <span v-else class="upload-file-status">待上传</span>
      <a-button size="small" type="text" danger @click.stop="removeFile(f.uid)">删除</a-button>
    </div>
  </div>
</template>

<style scoped>
.form-field-label {
  display: block;
}
.upload-dropzone {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  background: #fafafa;
  padding: 28px 16px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s, background 0.3s;
}
.upload-dropzone:hover,
.upload-dropzone.active {
  border-color: #1677ff;
  background: #f0f5ff;
}
.upload-icon {
  margin-bottom: 8px;
}
.upload-text {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}
.upload-desc {
  font-size: 12px;
  color: #bbb;
}

.upload-file-list {
  margin-top: 10px;
}
.upload-file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 13px;
}
.upload-file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #333;
}
.upload-file-size {
  color: #999;
  flex-shrink: 0;
}
.upload-file-status {
  flex-shrink: 0;
  color: #fa8c16;
  font-size: 12px;
}
.upload-file-status.done {
  color: #52c41a;
}
.upload-file-status.error {
  color: #ff4d4f;
}
</style>
