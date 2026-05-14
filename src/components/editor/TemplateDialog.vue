<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Modal } from 'ant-design-vue'
import { useEditorStore, useFormSettingsStore } from '@/stores'
import { builtinTemplates, loadCustomTemplates, deleteCustomTemplate, type TemplateInfo, type CustomTemplate } from '@/templates'
import { generateUUID } from '@/utils/uuid'

const props = defineProps<{ open: boolean }>()

const emit = defineEmits<{ close: [] }>()

const store = useEditorStore()
const settingsStore = useFormSettingsStore()
const loading = ref<string | null>(null)

const customTemplates = ref<CustomTemplate[]>(loadCustomTemplates())

function refreshCustom() {
  customTemplates.value = loadCustomTemplates()
}

watch(() => props.open, (val) => {
  if (val) refreshCustom()
})

const customTemplateInfos = computed<TemplateInfo[]>(() =>
  customTemplates.value.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    icon: t.icon,
    tags: t.tags,
    fieldCount: t.fieldCount,
    load: async () => t.config,
  })),
)

async function useTemplate(t: TemplateInfo) {
  loading.value = t.id
  try {
    const data = await t.load()
    store.importFormConfig({
      components: data.components,
      settings: data.settings,
    })
    if (data.title) {
      settingsStore.formSettings.title = data.title
    }
    const submit = data.components.find((c) => c.type === 'submit-button')
    if (!submit) {
      const { pluginManager } = await import('@/plugins')
      const def = pluginManager.getByType('submit-button')
      if (def && !store.compList.some((c) => c.type === 'submit-button')) {
        store.compList.push({
          id: generateUUID(),
          type: 'submit-button',
          title: '提交',
          props: { btnType: 'primary', align: 'center', block: false, size: 'middle' },
        })
      }
    }
    emit('close')
  } catch (err) {
    console.error('Failed to load template:', err)
  } finally {
    loading.value = null
  }
}

function handleDelete(ct: CustomTemplate, e: Event) {
  e.stopPropagation()
  Modal.confirm({
    title: '删除模板',
    content: `确定要删除模板「${ct.name}」吗？`,
    okText: '删除',
    cancelText: '取消',
    okType: 'danger',
    onOk: () => {
      deleteCustomTemplate(ct.id)
      refreshCustom()
    },
  })
}
</script>

<template>
  <a-modal
    :open="open"
    title="从模板新建"
    :footer="null"
    width="680px"
    @cancel="emit('close')"
  >
    <!-- 内置模板 -->
    <h4 class="template-section-title">内置模板</h4>
    <div class="template-grid">
      <div
        v-for="t in builtinTemplates"
        :key="t.id"
        class="template-card"
        @click="useTemplate(t)"
      >
        <div class="template-card__icon">{{ t.icon }}</div>
        <div class="template-card__info">
          <h4 class="template-card__name">{{ t.name }}</h4>
          <p class="template-card__desc">{{ t.description }}</p>
          <div class="template-card__meta">
            <span class="template-card__count">{{ t.fieldCount }} 个字段</span>
            <span v-for="tag in t.tags" :key="tag" class="template-card__tag">{{ tag }}</span>
          </div>
        </div>
        <div v-if="loading === t.id" class="template-card__loading">加载中...</div>
      </div>
    </div>

    <!-- 自定义模板 -->
    <h4 v-if="customTemplateInfos.length > 0" class="template-section-title">自定义模板</h4>
    <div v-if="customTemplateInfos.length > 0" class="template-grid">
      <div
        v-for="t in customTemplateInfos"
        :key="t.id"
        class="template-card"
        @click="useTemplate(t)"
      >
        <div class="template-card__icon">{{ t.icon }}</div>
        <div class="template-card__info">
          <h4 class="template-card__name">{{ t.name }}</h4>
          <p class="template-card__desc">{{ t.description }}</p>
          <div class="template-card__meta">
            <span class="template-card__count">{{ t.fieldCount }} 个字段</span>
            <span v-for="tag in t.tags" :key="tag" class="template-card__tag">{{ tag }}</span>
          </div>
        </div>
        <button
          class="template-card__delete"
          title="删除模板"
          @click="handleDelete(customTemplates.find(ct => ct.id === t.id)!, $event)"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4m2 0v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4h9.34z" stroke="currentColor" stroke-width="1.3"/></svg>
        </button>
        <div v-if="loading === t.id" class="template-card__loading">加载中...</div>
      </div>
    </div>

    <div v-if="builtinTemplates.length === 0 && customTemplateInfos.length === 0" class="template-empty">
      暂无模板，搭建表单后点击「保存为模板」即可创建
    </div>
  </a-modal>
</template>

<style scoped>
.template-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #888;
  margin: 0 0 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f0f0f0;
}
.template-section-title + .template-section-title {
  margin-top: 20px;
}
.template-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 4px;
}
.template-card {
  display: flex;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}
.template-card:hover {
  border-color: #1677ff;
  box-shadow: 0 2px 8px rgba(22, 119, 255, 0.1);
}
.template-card__icon {
  font-size: 28px;
  flex-shrink: 0;
}
.template-card__info {
  min-width: 0;
  flex: 1;
}
.template-card__name {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
}
.template-card__desc {
  margin: 0 0 8px;
  font-size: 12px;
  color: #888;
  line-height: 1.5;
}
.template-card__meta {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}
.template-card__count {
  font-size: 11px;
  color: #1677ff;
  font-weight: 500;
}
.template-card__tag {
  font-size: 10px;
  background: #f5f5f5;
  color: #888;
  padding: 1px 6px;
  border-radius: 3px;
}
.template-card__loading {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,.85);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #1677ff;
  border-radius: 8px;
}
.template-card__delete {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bbb;
  opacity: 0;
  transition: all 0.15s;
}
.template-card:hover .template-card__delete {
  opacity: 1;
}
.template-card__delete:hover {
  background: #fff2f0;
  color: #ff4d4f;
}
.template-empty {
  text-align: center;
  color: #bbb;
  padding: 40px 0;
  font-size: 13px;
}
</style>
