<script setup lang="ts">
/**
 * 预览模态框 — 表单填写、分页、校验、提交与统计图表
 *
 * 通过 provide('submitForm') 将提交逻辑注入 SubmitButton。
 */
import { ref, computed, provide } from 'vue'
import { useEditorStore, useFormSettingsStore, useSubmissionStore } from '@/stores'
import { useFormValidation, type ValidationResult } from '@/composables/useFormValidation'
import { useLogicEvaluator } from '@/composables/useLogicEvaluator'
import { pluginManager } from '@/plugins'
import type { ComponentConfig } from '@/types'
import PreviewField from '@/components/form/PreviewField.vue'
import StatsPanel from '@/components/editor/StatsPanel.vue'

defineProps<{ open: boolean }>()

const emit = defineEmits<{ onClose: [] }>()

const store = useEditorStore()
const settingsStore = useFormSettingsStore()
const submissionStore = useSubmissionStore()
const { validateForm } = useFormValidation()
const { computeHiddenIds } = useLogicEvaluator()

const formValues = ref<Record<string, unknown>>({})
const validationResults = ref<Map<string, ValidationResult> | null>(null)
const currentPage = ref(0)
const submitSuccess = ref(false)
const showStats = ref(false)
const errorModalOpen = ref(false)

const errorList = computed<string[]>(() => {
  if (!validationResults.value) return []
  const errs: string[] = []
  for (const [id, result] of validationResults.value.entries()) {
    if (!result.valid) {
      const comp = store.compList.find((c) => c.id === id)
      const label = comp?.title || comp?.type || id
      result.errors.forEach((e) => errs.push(`${label}：${e}`))
    }
  }
  return errs
})
const mobilePreview = ref(false)

const hiddenIds = computed(() => {
  const fields = store.flattenedCompList.map((c) => ({ id: c.id, logic: c.logic }))
  return computeHiddenIds(fields, formValues.value)
})

function getVisibleComps(list: ComponentConfig[], hidden: Set<string>): ComponentConfig[] {
  const result: ComponentConfig[] = []
  for (const comp of list) {
    if (hidden.has(comp.id)) continue
    result.push({
      ...comp,
      children: comp.children ? getVisibleComps(comp.children, hidden) : undefined,
    })
  }
  return result
}

const visibleComps = computed(() => getVisibleComps(store.compList, hiddenIds.value))

const pages = computed(() => {
  const all: ComponentConfig[][] = []
  let current: ComponentConfig[] = []
  for (const comp of visibleComps.value) {
    if (comp.type === 'page-break') {
      if (current.length > 0) { all.push(current); current = [] }
    } else {
      current.push(comp)
    }
  }
  if (current.length > 0) all.push(current)
  if (all.length === 0) all.push([])
  return all
})

const submitComp = computed(() =>
  store.compList.find((c) => c.type === 'submit-button'),
)

const totalPages = computed(() => pages.value.length)
const currentPageComps = computed(() => pages.value[currentPage.value] ?? [])
const isFirstPage = computed(() => currentPage.value === 0)
const isLastPage = computed(() => currentPage.value >= totalPages.value - 1)

const watermarkStyle = computed(() => {
  const text = settingsStore.formSettings.watermark
  if (!text) return {}
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><text x="100" y="70" text-anchor="middle" transform="rotate(-22 100 60)" font-size="16" fill="#999" opacity="0.3">${text}</text></svg>`
  return { backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")` }
})

const submittedData = computed(() => {
  return store.flattenedCompList
    .filter((c) => {
      const def = pluginManager.getByType(c.type)
      return !def?.meta?.isLayout && !def?.meta?.isDisplay
    })
    .map((c) => ({
      title: c.title || c.type,
      value: formValues.value[c.id] ?? '',
    }))
    .filter((r) => r.title)
})

function exportCSV() {
  const header = '字段,值'
  const rows = submittedData.value.map((r) => {
    const val = typeof r.value === 'object' ? JSON.stringify(r.value) : String(r.value ?? '')
    return `"${r.title}","${val.replace(/"/g, '""')}"`
  })
  const csv = [header, ...rows].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${settingsStore.formSettings.title || '表单数据'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

provide('submitForm', handleSubmit)

function initDefaults() {
  const values: Record<string, unknown> = {}
  for (const comp of store.flattenedCompList) {
    values[comp.id] = comp.defaultValue ?? ''
  }
  formValues.value = values
  validationResults.value = null
  submitSuccess.value = false
  showStats.value = false
  errorModalOpen.value = false
  mobilePreview.value = false
  currentPage.value = 0
}

function updateFormValue(id: string, value: unknown) {
  formValues.value = { ...formValues.value, [id]: value }
}

function prevPage() {
  if (currentPage.value > 0) currentPage.value--
}

function nextPage() {
  if (currentPage.value < totalPages.value - 1) currentPage.value++
}

function handleSubmit() {
  const fields = store.flattenedCompList
    .filter((c) => {
      const def = pluginManager.getByType(c.type)
      return !def?.meta?.skipValidation
    })
    .map((c) => {
      const rules = c.validation ? [...c.validation] : []
      if (c.required && !rules.some((r) => r.type === "required")) {
        rules.unshift({ type: "required", message: `${c.title || "该项"}为必填` })
      }
      return { id: c.id, value: formValues.value[c.id], rules }
    })
  validationResults.value = validateForm(fields)

  const hasError = [...(validationResults.value?.values() ?? [])].some((r) => r.errors.length > 0)
  if (hasError) {
  errorModalOpen.value = true
} else if (fields.length > 0) {
    submissionStore.addSubmission({ ...formValues.value })
    submitSuccess.value = true
  }
}

function handleClose() {
  validationResults.value = null
  submitSuccess.value = false
  showStats.value = false
  mobilePreview.value = false
  emit('onClose')
}

function getSerial(id: string): number | undefined {
  let n = 1
  for (const comp of store.flattenedCompList) {
    if (comp.type === 'page-break') continue
    const def = pluginManager.getByType(comp.type)
    if (def?.meta?.isDisplay) continue
    if (def?.meta?.isLayout) continue
    if (comp.id === id) return n
    n++
  }
  return undefined
}

function getFieldError(id: string): string | null {
  if (!validationResults.value) return null
  const r = validationResults.value.get(id)
  if (!r || r.errors.length === 0) return null
  return r.errors[0] ?? null
}
</script>

<template>
  <a-modal
    :open="open"
    title="预览"
    :width="mobilePreview ? 400 : 520"
    :footer="null"
    @cancel="handleClose"
    @after-open="initDefaults"
  >
    <!-- 移动端 / 桌面端切换 -->
    <div v-if="!submitSuccess" class="preview-toolbar">
      <a-button size="small" @click="mobilePreview = !mobilePreview">
        {{ mobilePreview ? '桌面端' : '移动端' }}
      </a-button>
    </div>

    <!-- 移动端框架 -->
    <div :class="mobilePreview ? 'mobile-frame' : ''">
      <div class="preview-form" :class="{ 'has-watermark': settingsStore.formSettings.watermark }">
        <div v-if="settingsStore.formSettings.watermark" class="preview-watermark-layer" :style="watermarkStyle"></div>
        <h2 class="preview-title">{{ settingsStore.formSettings.title }}</h2>
        <p v-if="settingsStore.formSettings.description" class="preview-desc">{{ settingsStore.formSettings.description }}</p>

        <!-- 分页指示器 -->
        <div v-if="totalPages > 1" class="page-indicator">
          第 {{ currentPage + 1 }} / {{ totalPages }} 页
        </div>

        <!-- 字段列表 -->
        <template v-if="!submitSuccess">
          <div
            v-for="comp in currentPageComps.filter(c => c.type !== 'submit-button')"
            :key="comp.id"
            class="preview-field"
            :class="{ 'has-error': getFieldError(comp.id) }"
          >
            <PreviewField
              :comp="comp"
              :form-values="formValues"
              :serial="settingsStore.formSettings.showSerialNumber ? getSerial(comp.id) : undefined"
              @update:form-value="updateFormValue"
            />
            <p v-if="getFieldError(comp.id)" class="field-error">
              {{ getFieldError(comp.id) }}
            </p>
          </div>

          <div v-if="currentPageComps.length === 0" class="preview-empty">
            本页没有可见字段
          </div>

          <!-- 分页导航 -->
          <div class="preview-footer">
            <div v-if="totalPages > 1" class="page-nav">
              <a-button :disabled="isFirstPage" @click="prevPage">上一页</a-button>
              <a-button :disabled="isLastPage" @click="nextPage">下一页</a-button>
            </div>
            <div v-if="settingsStore.formSettings.showSubmitButton && submitComp" class="preview-submit">
              <PreviewField
                :comp="submitComp"
                :form-values="formValues"
                @update:form-value="updateFormValue"
              />
            </div>
          </div>
          <a-modal
    :open="errorModalOpen"
    title="提交失败"
    ok-text="知道了"
    :footer="null"
    @cancel="errorModalOpen = false"
  >
    <p class="error-hint">请修正以下问题后重新提交：</p>
    <ul class="error-list">
      <li v-for="(err, i) in errorList" :key="i">{{ err }}</li>
    </ul>
    <a-button type="primary" block style="margin-top: 12px" @click="errorModalOpen = false">知道了</a-button>
  </a-modal>
</template>

        <!-- 提交成功 → 结果/统计 -->
        <div v-else class="preview-result">
          <template v-if="!showStats">
            <div class="preview-result__success">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="#52c41a"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              <p class="preview-result__title">{{ settingsStore.formSettings.successMessage || '提交成功' }}</p>
            </div>
            <div class="preview-result__table-wrap">
              <table class="preview-result__table">
                <thead>
                  <tr><th>字段</th><th>值</th></tr>
                </thead>
                <tbody>
                  <tr v-for="row in submittedData" :key="row.title">
                    <td>{{ row.title }}</td>
                    <td>{{ typeof row.value === 'object' ? JSON.stringify(row.value) : String(row.value ?? '') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <a-button type="primary" block @click="exportCSV">导出 CSV</a-button>
            <a-button block style="margin-top: 8px" @click="showStats = true">查看统计图表</a-button>
          </template>
          <template v-else>
            <a-button block style="margin-bottom: 12px" @click="showStats = false">返回提交结果</a-button>
            <StatsPanel :visible="showStats" />
          </template>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<style lang="scss" scoped>
.preview-toolbar {
  margin-bottom: 8px;
  text-align: right;
}
.mobile-frame {
  max-width: 375px;
  margin: 0 auto;
  border: 2px solid #333;
  border-radius: 24px;
  padding: 20px 14px;
  min-height: 600px;
  background: #fff;
}

.preview-form {
  padding: 8px 0;
  position: relative;
}
.preview-watermark-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-repeat: repeat;
  z-index: 0;
}
.preview-form.has-watermark > *:not(.preview-watermark-layer) {
  position: relative;
  z-index: 1;
}
.preview-title {
  font-size: 18px;
  text-align: center;
  margin-bottom: 8px;
}
.preview-desc {
  text-align: center;
  font-size: 13px;
  color: #888;
  margin-bottom: 24px;
  white-space: pre-wrap;
}
.page-indicator {
  text-align: center;
  font-size: 13px;
  color: #888;
  margin-bottom: 16px;
}
.preview-field {
  margin-bottom: 16px;
  padding: 12px 0;
  &.has-error {
    background: #fff2f0;
    border: 1px solid #ffccc7;
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 16px;
  }
}
.field-error {
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 6px;
}
.preview-empty {
  text-align: center;
  color: #bbb;
  padding: 40px 0;
}
.preview-footer {
  margin-top: 24px;
}
.page-nav {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

// 提交结果
.preview-result {
  text-align: center;
}
.preview-result__success {
  margin-bottom: 16px;
  svg {
    display: block;
    margin: 0 auto 8px;
  }
}
.preview-result__title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}
.preview-result__table-wrap {
  max-height: 240px;
  overflow-y: auto;
  margin: 16px 0;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
}
.preview-result__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  th, td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
  }
  th {
    background: #fafafa;
    font-weight: 500;
    color: #666;
    position: sticky;
    top: 0;
  }
  td {
    color: #333;
    word-break: break-all;
  }
}
</style>
