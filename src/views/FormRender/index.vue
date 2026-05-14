<script setup lang="ts">
/**
 * 分享表单独立页 — 从 localStorage 加载已发布的表单配置并渲染
 *
 * 通过路由参数 :id 定位存储的 FormConfig。
 */
import { ref, computed, onMounted, provide } from 'vue'
import { useRoute } from 'vue-router'
import { useFormValidation, type ValidationResult } from '@/composables/useFormValidation'
import { useLogicEvaluator } from '@/composables/useLogicEvaluator'
import { pluginManager } from '@/plugins'
import type { FormConfig, ComponentConfig } from '@/types'
import PreviewField from '@/components/form/PreviewField.vue'

const route = useRoute()
const { validateForm } = useFormValidation()
const { computeHiddenIds } = useLogicEvaluator()

const formConfig = ref<FormConfig | null>(null)
const notFound = ref(false)
const formValues = ref<Record<string, unknown>>({})
const validationResults = ref<Map<string, ValidationResult> | null>(null)
const currentPage = ref(0)
const submitSuccess = ref(false)
const errorModalOpen = ref(false)

const errorList = computed<string[]>(() => {
  if (!validationResults.value) return []
  const errs: string[] = []
  for (const [id, result] of validationResults.value.entries()) {
    if (!result.valid) {
      const comp = formConfig.value?.components.find((c) => c.id === id)
      const label = comp?.title || comp?.type || id
      result.errors.forEach((e) => errs.push(`${label}：${e}`))
    }
  }
  return errs
})

function flattenComponents(list: ComponentConfig[]): ComponentConfig[] {
  const result: ComponentConfig[] = []
  for (const comp of list) {
    result.push(comp)
    if (comp.children?.length) {
      result.push(...flattenComponents(comp.children))
    }
  }
  return result
}

const hiddenIds = computed(() => {
  if (!formConfig.value) return new Set<string>()
  const fields = flattenComponents(formConfig.value.components).map((c) => ({ id: c.id, logic: c.logic }))
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

const visibleComps = computed(() => {
  if (!formConfig.value) return []
  return getVisibleComps(formConfig.value.components, hiddenIds.value)
})

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
  formConfig.value?.components.find((c) => c.type === 'submit-button'),
)

const totalPages = computed(() => pages.value.length)
const currentPageComps = computed(() => pages.value[currentPage.value] ?? [])
const isFirstPage = computed(() => currentPage.value === 0)
const isLastPage = computed(() => currentPage.value >= totalPages.value - 1)

const watermarkStyle = computed(() => {
  const text = formConfig.value?.settings.watermark
  if (!text) return {}
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><text x="100" y="70" text-anchor="middle" transform="rotate(-22 100 60)" font-size="16" fill="#999" opacity="0.3">${text}</text></svg>`
  return { backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")` }
})

const submittedData = computed(() => {
  if (!formConfig.value) return []
  return formConfig.value.components
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

provide('submitForm', handleSubmit)

onMounted(() => {
  const id = route.params.id as string
  try {
    const raw = localStorage.getItem(`mini-form-share-${id}`)
    if (!raw) {
      notFound.value = true
      return
    }
    const config = JSON.parse(raw) as FormConfig
    if (!config.components || !Array.isArray(config.components)) {
      notFound.value = true
      return
    }
    formConfig.value = config
    initDefaults()
  } catch {
    notFound.value = true
  }
})

function initDefaults() {
  if (!formConfig.value) return
  const values: Record<string, unknown> = {}
  for (const comp of formConfig.value.components) {
    values[comp.id] = comp.defaultValue ?? ''
  }
  formValues.value = values
  validationResults.value = null
  submitSuccess.value = false
  currentPage.value = 0
  errorModalOpen.value = false
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
  if (!formConfig.value) return
  const fields = formConfig.value.components
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
    submitSuccess.value = true
  }
}

function getSerial(id: string): number | undefined {
  if (!formConfig.value) return undefined
  let n = 1
  for (const comp of formConfig.value.components) {
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
  <div v-if="notFound" class="render-not-found">
    <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="#bbb" stroke-width="1.2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="13"/>
      <circle cx="12" cy="16" r="0.5" fill="#bbb" stroke="none"/>
    </svg>
    <h2>表单不存在</h2>
    <p>该分享链接无效或表单已被取消发布</p>
  </div>

  <div v-else-if="!formConfig" class="render-loading">
    <p>加载中...</p>
  </div>

  <div v-else class="render-page">
    <div class="render-form" :class="{ 'has-watermark': formConfig.settings.watermark }">
      <div v-if="formConfig.settings.watermark" class="render-watermark-layer" :style="watermarkStyle"></div>
      <h1 class="render-title">{{ formConfig.settings.title }}</h1>
      <p v-if="formConfig.settings.description" class="render-desc">{{ formConfig.settings.description }}</p>

      <!-- 分页指示器 -->
      <div v-if="totalPages > 1" class="page-indicator">
        第 {{ currentPage + 1 }} / {{ totalPages }} 页
      </div>

      <!-- 表单字段 -->
      <template v-if="!submitSuccess">
        <div
          v-for="comp in currentPageComps.filter(c => c.type !== 'submit-button')"
          :key="comp.id"
          class="render-field"
          :class="{ 'has-error': getFieldError(comp.id) }"
        >
          <PreviewField
            :comp="comp"
            :form-values="formValues"
            :serial="formConfig.settings.showSerialNumber ? getSerial(comp.id) : undefined"
            @update:form-value="updateFormValue"
          />
          <p v-if="getFieldError(comp.id)" class="field-error">{{ getFieldError(comp.id) }}</p>
        </div>

        <div v-if="currentPageComps.length === 0" class="render-empty">
          本页没有可见字段
        </div>

        <!-- 分页 + 提交 -->
        <div class="render-footer">
          <div v-if="totalPages > 1" class="page-nav">
            <a-button :disabled="isFirstPage" @click="prevPage">上一页</a-button>
            <a-button :disabled="isLastPage" @click="nextPage">下一页</a-button>
          </div>
          <div v-if="formConfig.settings.showSubmitButton && submitComp" class="render-submit">
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

      <!-- 提交成功 -->
      <div v-else class="render-result">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="#52c41a"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        <p class="render-result__title">{{ formConfig.settings.successMessage || '提交成功' }}</p>
        <div class="render-result__table-wrap">
          <table class="render-result__table">
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
      </div>
    </div>
  </div>
</template>

<style scoped>
.render-page {
  min-height: 100vh;
  background: #f0f2f5;
  display: flex;
  justify-content: center;
  padding: 40px 16px;
}
.render-form {
  width: 100%;
  max-width: 660px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
  padding: 40px 32px;
  position: relative;
  align-self: flex-start;
}
.render-watermark-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-repeat: repeat;
  z-index: 0;
  border-radius: 8px;
  overflow: hidden;
}
.render-form.has-watermark > *:not(.render-watermark-layer) {
  position: relative;
  z-index: 1;
}
.render-title {
  font-size: 22px;
  text-align: center;
  margin-bottom: 8px;
}
.render-desc {
  text-align: center;
  font-size: 14px;
  color: #888;
  margin-bottom: 32px;
  white-space: pre-wrap;
}
.page-indicator {
  text-align: center;
  font-size: 13px;
  color: #888;
  margin-bottom: 20px;
}
.render-field {
  margin-bottom: 20px;
  &.has-error {
    background: #fff2f0;
    border: 1px solid #ffccc7;
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 20px;
  }
}
.field-error {
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 6px;
}
.render-empty {
  text-align: center;
  color: #bbb;
  padding: 40px 0;
}
.render-footer {
  margin-top: 32px;
}
.page-nav {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}
.render-result {
  text-align: center;
}
.render-result__title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin: 12px 0 20px;
}
.render-result__table-wrap {
  max-height: 320px;
  overflow-y: auto;
  margin: 16px 0;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
}
.render-result__table {
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
.render-not-found,
.render-loading {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #888;
  gap: 12px;
}
.render-not-found h2 {
  font-size: 18px;
  color: #555;
  margin: 0;
}
.render-not-found p {
  font-size: 14px;
  margin: 0;
}
</style>
