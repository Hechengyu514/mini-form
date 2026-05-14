<script setup lang="ts">
import { ref, watch } from 'vue'
import DOMPurify from 'dompurify'
import type { ComponentConfig } from '@/types'
import '@/assets/styles/form-field.css'

const props = defineProps<{
  config: ComponentConfig
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const content = ref<string>(String(props.modelValue ?? props.config.defaultValue ?? ''))
const editorRef = ref<HTMLElement | null>(null)

const ALLOWED_TAGS = ['strong', 'em', 'u', 'ul', 'ol', 'li', 'br', 'p', 'div', 'span']

function sanitize(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS })
}

watch(() => props.modelValue, (v) => {
  content.value = sanitize((v as string) ?? '')
})

function syncValue() {
  if (!editorRef.value) return
  content.value = sanitize(editorRef.value.innerHTML)
  emit('update:modelValue', content.value)
}

function onInput() {
  syncValue()
}

/** 应用行内样式（加粗/斜体/下划线）— 使用 Range API 包裹选中文本 */
function applyInline(tagName: string) {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || !editorRef.value) return

  const range = sel.getRangeAt(0)
  if (range.collapsed) return

  // 检查选区是否已在目标标签内 → 取消样式
  const container = range.commonAncestorContainer
  const parentEl = container.nodeType === 3 ? container.parentElement : (container as Element)
  const existing = parentEl?.closest(tagName)

  if (existing) {
    const fragment = document.createDocumentFragment()
    while (existing.firstChild) fragment.appendChild(existing.firstChild)
    existing.replaceWith(fragment)
  } else {
    try {
      const el = document.createElement(tagName)
      range.surroundContents(el)
    } catch {
      // 跨节点选区无法包裹时忽略
    }
  }

  sel.removeAllRanges()
  editorRef.value.focus()
  syncValue()
}

/** 在编辑器末尾插入列表（ul / ol） */
function insertList(tag: 'ul' | 'ol') {
  if (!editorRef.value) return
  const list = document.createElement(tag)
  const li = document.createElement('li')
  li.textContent = '​'
  list.appendChild(li)
  editorRef.value.appendChild(list)
  editorRef.value.focus()
  syncValue()
}
</script>

<template>
  <label class="form-field-label">
    <span v-if="config.required" class="form-field-required">*</span>
    {{ config.title }}
  </label>
  <p v-if="config.description" class="form-field-desc">{{ config.description }}</p>
  <div class="rich-editor">
    <div class="rich-toolbar">
      <button type="button" @click="applyInline('strong')" title="加粗"><strong>B</strong></button>
      <button type="button" @click="applyInline('em')" title="斜体"><em>I</em></button>
      <button type="button" @click="applyInline('u')" title="下划线"><u>U</u></button>
      <span class="rich-sep"></span>
      <button type="button" @click="insertList('ul')" title="无序列表">&bull;</button>
      <button type="button" @click="insertList('ol')" title="有序列表">1.</button>
    </div>
    <div
      ref="editorRef"
      class="rich-content"
      contenteditable="true"
      v-html="content"
      @input="onInput"
      @blur="syncValue"
    ></div>
  </div>
</template>

<style scoped>
.rich-editor {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
  transition: border-color 0.2s;
}
.rich-editor:focus-within {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
}
.rich-toolbar {
  display: flex;
  gap: 2px;
  padding: 6px 8px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
}
.rich-toolbar button {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #555;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rich-toolbar button:hover {
  background: #e6f4ff;
  color: #1677ff;
}
.rich-sep {
  width: 1px;
  background: #d9d9d9;
  margin: 0 4px;
}
.rich-content {
  min-height: 100px;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.6;
  outline: none;
}
.rich-content:empty::before {
  content: attr(data-placeholder);
  color: #bbb;
}
</style>
