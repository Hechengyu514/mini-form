<script setup lang="ts">
/**
 * 表单编辑器主视图 — 三栏布局（组件库 | 画布 | 属性面板）
 *
 * 不维护本地状态，所有读写通过 useEditorStore 完成。
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Modal, message } from 'ant-design-vue'
import { useEditorStore, useFormSettingsStore } from '@/stores'
import { pluginManager } from '@/plugins'
import type { PluginComponentDef } from '@/plugins'
import type { ComponentConfig } from '@/types'
import CanvasItem from '@/components/editor/CanvasItem.vue'
import LogicSection from '@/components/editor/LogicSection.vue'
import MatrixEditor from '@/components/editor/MatrixEditor.vue'
import GlobalSettings from '@/components/editor/GlobalSettings.vue'
import Preview from '@/views/Preview/index.vue'
import TemplateDialog from '@/components/editor/TemplateDialog.vue'
import SharePanel from '@/components/editor/SharePanel.vue'
import HistoryPanel from '@/components/editor/HistoryPanel.vue'
import { getCompIcon } from '@/components/editor/icons'
import { loadCustomTemplates, saveCustomTemplates } from '@/templates'
import { VueDraggable } from 'vue-draggable-plus'
import { generateUUID } from '@/utils/uuid'

interface DragEvent {
  newIndex?: number
  oldIndex?: number
}

const store = useEditorStore()
const settingsStore = useFormSettingsStore()

const selectedCompDef = computed(() => {
  if (!store.selectedComp) return null
  return pluginManager.getByType(store.selectedComp.type) ?? null
})

const previewOpen = ref(false)
const templateDialogOpen = ref(false)
const sharePanelOpen = ref(false)
const sidebarCollapsed = ref(false)
const settingCollapsed = ref(false)
  
// ===== 表单命名 =====
const editingTitle = ref(false)
const titleInputRef = ref<InstanceType<typeof HTMLInputElement> | null>(null)

function startEditTitle() {
  editingTitle.value = true
  // 在下一个 tick 聚焦输入框
  setTimeout(() => {
    titleInputRef.value?.focus?.()
  }, 50)
}

function finishEditTitle() {
  editingTitle.value = false
  if (!settingsStore.formSettings.title.trim()) {
    settingsStore.formSettings.title = '未命名表单'
  }
}

// ===== 左侧组件库：按分类分组 =====
const categories = computed(() => {
  const cats: { category: string; items: ReturnType<typeof pluginManager.getByCategory> }[] = []
  for (const cat of pluginManager.getCategories()) {
    const items = pluginManager.getByCategory(cat).filter((c) => c.type !== 'submit-button')
    if (items.length > 0) {
      cats.push({ category: cat, items })
    }
  }
  return cats
})

const categoryLabels: Record<string, string> = {
  basic: '基础',
  info: '信息',
  choice: '选择',
  advanced: '高级',
  layout: '布局',
}

function getCategoryClass(cat: string): string {
  return cat.replace(/[^a-z-]/g, '')
}

// ===== 提交按钮（固定在末尾）=====
const draggableCompList = computed({
  get: () => store.compList.filter((c) => c.type !== 'submit-button'),
  set: (val) => {
    const submit = store.compList.find((c) => c.type === 'submit-button')
    store.compList = submit ? [...val, submit] : [...val]
  },
})

const submitButtonComp = computed(() =>
  store.compList.find((c) => c.type === 'submit-button'),
)

// ===== 点击添加组件 =====
function handleAddComponent(type: string) {
  const def = pluginManager.getByType(type)
  if (def) {
    store.addComp(type, def.defaultConfig)
  }
}


// ===== 选项列表操作 =====
function updateOption(index: number, label: string) {
  if (!store.selectedComp?.options) return
  const newOptions = [...store.selectedComp.options]
  const opt = newOptions[index]
  if (!opt) return
  newOptions[index] = { ...opt, label }
  store.updateSelectedComp({ options: newOptions })
}

function removeOption(index: number) {
  if (!store.selectedComp?.options) return
  const newOptions = [...store.selectedComp.options]
  newOptions.splice(index, 1)
  store.updateSelectedComp({ options: newOptions })
}

function addOption() {
  if (!store.selectedComp?.options) return
  const newOptions = [
    ...store.selectedComp.options,
    {
      id: generateUUID(),
      label: `选项${store.selectedComp.options.length + 1}`,
      value: String(store.selectedComp.options.length + 1),
    },
  ]
  store.updateSelectedComp({ options: newOptions })
}

// ===== 自定义模板 =====
const saveTemplateOpen = ref(false)
const saveTemplateName = ref('')
const saveTemplateDesc = ref('')


function confirmSaveTemplate() {
  const name = saveTemplateName.value.trim()
  if (!name) return
  const data = store.exportFormConfig()
  const templates = loadCustomTemplates()
  const existingIdx = templates.findIndex((t) => t.name === name)
  if (existingIdx !== -1) {
    Modal.confirm({
      title: '覆盖模板',
      content: `模板「${name}」已存在，是否覆盖？`,
      okText: '覆盖',
      cancelText: '取消',
      onOk: () => {
        templates[existingIdx] = {
          ...templates[existingIdx]!,
          description: saveTemplateDesc.value.trim() || `${data.components.length} 个字段`,
          fieldCount: data.components.length,
          config: { id: data.id, title: name, components: data.components, settings: data.settings },
        }
        saveCustomTemplates(templates)
        saveTemplateOpen.value = false
        message.success(`已覆盖模板「${name}」`)
      },
    })
    return
  }
  templates.push({
    id: `custom-${Date.now()}`,
    name,
    description: saveTemplateDesc.value.trim() || `${data.components.length} 个字段`,
    icon: "📋",
    tags: ["自定义"],
    fieldCount: data.components.length,
    config: { id: data.id, title: name, components: data.components, settings: data.settings },
  })
  saveCustomTemplates(templates)
  saveTemplateOpen.value = false
  message.success(`模板「${name}」已保存`)
}
function openSaveTemplateDialog() {
  saveTemplateName.value = settingsStore.formSettings.title || '自定义表单'
  saveTemplateDesc.value = `${store.compList.length} 个字段`
  saveTemplateOpen.value = true
}


function handleClear() {
  if (store.compList.length === 0) return
  store.clearAll()
  ensureSubmitButton()
}

function getDraggableList() {
  return store.compList.filter((c) => c.type !== 'submit-button')
}

function onRootCanvasAdd(e: DragEvent) {
  if (e.newIndex === undefined) return
  const list = getDraggableList()
  const comp = list[e.newIndex]
  if (!comp) return
  store.selectComp(comp.id)
  const idx = e.newIndex
  store.recordCommand({
    description: `添加「${comp.title || comp.type}」`,
    undo: () => {
      const r = store.compList.findIndex((c) => c.id === comp.id)
      if (r !== -1) store.compList.splice(r, 1)
    },
    redo: () => {
      const dList = getDraggableList()
      const insertAt = Math.min(idx, dList.length)
      store.compList.splice(insertAt, 0, comp)
      store.selectComp(comp.id)
    },
  })
}

function onRootCanvasUpdate(e: DragEvent) {
  const { oldIndex, newIndex } = e
  if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return
  const dList = getDraggableList()
  const item = dList[oldIndex]
  if (!item) return
  store.recordCommand({
    description: `移动「${item.title || item.type}」`,
    undo: () => {
      const realIdx = store.compList.findIndex((c) => c.id === item.id)
      if (realIdx !== -1) store.compList.splice(realIdx, 1)
      const dList2 = getDraggableList()
      const insertBefore = dList2[oldIndex]
      const insIdx = insertBefore ? store.compList.findIndex((c) => c.id === insertBefore.id) : store.compList.length
      store.compList.splice(insIdx, 0, item)
    },
    redo: () => {
      const realIdx = store.compList.findIndex((c) => c.id === item.id)
      if (realIdx !== -1) store.compList.splice(realIdx, 1)
      const dList2 = getDraggableList()
      const insertBefore = dList2[newIndex]
      const insIdx = insertBefore ? store.compList.findIndex((c) => c.id === insertBefore.id) : store.compList.length
      store.compList.splice(insIdx, 0, item)
    },
  })
}

// ===== 键盘快捷键 =====
function handleKeydown(e: KeyboardEvent) {
  const isMod = e.ctrlKey || e.metaKey
  if (isMod) {
    if (e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      store.undo()
    } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
      e.preventDefault()
      store.redo()
    }
    return
  }

  // Tab 键在画布字段间切换
  if (e.key === 'Tab') {
    e.preventDefault()
    const editable = store.compList.filter((c) => c.type !== 'submit-button')
    if (editable.length === 0) return
    const curIdx = editable.findIndex((c) => c.id === store.selectedId)
    const dir = e.shiftKey ? -1 : 1
    const nextIdx = ((curIdx === -1 ? (dir === 1 ? 0 : editable.length - 1) : curIdx + dir) + editable.length) % editable.length
    store.selectComp(editable[nextIdx]!.id)
  }
}

function ensureSubmitButton() {
  if (!store.compList.some((c) => c.type === 'submit-button')) {
    const def = pluginManager.getByType('submit-button')
    if (def) {
      store.compList.push(buildNewCompConfig(def))
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  ensureSubmitButton()
})
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

function buildNewCompConfig(def: PluginComponentDef): ComponentConfig {
  return {
    id: generateUUID(),
    type: def.type,
    title: def.defaultConfig.title ?? def.type,
    description: def.defaultConfig.description,
    placeholder: def.defaultConfig.placeholder,
    defaultValue: def.defaultConfig.defaultValue,
    required: def.defaultConfig.required,
    validation: def.defaultConfig.validation ? [...def.defaultConfig.validation] : [],
    logic: def.defaultConfig.logic ? [...def.defaultConfig.logic] : [],
    options: def.defaultConfig.options ? [...def.defaultConfig.options] : [],
    matrixRows: def.defaultConfig.matrixRows ? [...def.defaultConfig.matrixRows] : undefined,
    matrixColumns: def.defaultConfig.matrixColumns ? [...def.defaultConfig.matrixColumns] : undefined,
    matrixMode: def.defaultConfig.matrixMode,
    children: def.defaultConfig.children ? [...def.defaultConfig.children] : undefined,
    colSpan: def.defaultConfig.colSpan,
    layout: def.defaultConfig.layout,
    props: def.defaultConfig.props ? { ...def.defaultConfig.props } : {},
  }
}

function onCloneFromSidebar(item: PluginComponentDef): ComponentConfig {
  return buildNewCompConfig(item)
}
</script>

<template>
  <Preview :open="previewOpen" @on-close="previewOpen = false" />
  <TemplateDialog :open="templateDialogOpen" @close="templateDialogOpen = false" />
  <SharePanel :open="sharePanelOpen" @close="sharePanelOpen = false" />
  <div class="editor-layout">
    <!-- 左侧：组件库 -->
    <aside class="editor-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <button class="sidebar-toggle" @click="sidebarCollapsed = !sidebarCollapsed" :title="sidebarCollapsed ? '展开组件库' : '收起组件库'">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none"><polyline :points="sidebarCollapsed ? '6,3 11,8 6,13' : '10,3 5,8 10,13'" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
      </button>
      <h3 class="panel-title">组件库</h3>
      <div v-for="cat in categories" :key="cat.category" class="comp-category">
        <h4 class="category-label">{{ categoryLabels[cat.category] || cat.category }}</h4>
        <VueDraggable
          v-model="cat.items"
          :group="{ name: 'form', pull: 'clone', put: false }"
          :sort="false"
          :clone="onCloneFromSidebar"
          class="comp-grid"
        >
          <div
            v-for="item in cat.items"
            :key="item.type"
            class="comp-card"
            :class="'comp-card--' + getCategoryClass(item.category)"
            @click="handleAddComponent(item.type)"
          >
            <span class="comp-card__icon" v-html="getCompIcon(item.type)"></span>
            <span class="comp-card__name">{{ item.name }}</span>
          </div>
        </VueDraggable>
      </div>
    </aside>

    <!-- 中间：画布 -->
    <main class="editor-canvas">
      <div class="canvas-toolbar">
        <div class="toolbar-title-wrap">
          <h2 v-if="!editingTitle" class="toolbar-title" @click="startEditTitle">
            {{ settingsStore.formSettings.title }}
            <span class="toolbar-title__edit-icon">
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none"><path d="M2 11.5V14h2.5l7.4-7.4-2.5-2.5L2 11.5zM13.8 4.7a.66.66 0 000-.94l-1.56-1.56a.66.66 0 00-.94 0L10 3.5l2.5 2.5 1.3-1.3z" fill="currentColor"/></svg>
            </span>
          </h2>
          <a-input
            v-else
            ref="titleInputRef"
            class="toolbar-title-input"
            :value="settingsStore.formSettings.title"
            size="small"
            @blur="finishEditTitle"
            @press-enter="finishEditTitle"
            @input="settingsStore.formSettings.title = ($event.target as HTMLInputElement).value"
          />
        </div>
        <div class="toolbar-right">
          <a-tooltip :title="store.lastUndoLabel || '撤销 (Ctrl+Z)'">
            <a-button size="small" :disabled="!store.canUndo" @click="store.undo()">
              <template #icon>
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M4 7h6a3 3 0 010 6H7" stroke="currentColor" stroke-width="1.5" fill="none"/><polyline points="5,4 2,7 5,10" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
              </template>
            </a-button>
          </a-tooltip>
          <a-tooltip :title="store.lastRedoLabel || '重做 (Ctrl+Y)'">
            <a-button size="small" :disabled="!store.canRedo" @click="store.redo()">
              <template #icon>
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M12 7H6a3 3 0 000 6h3" stroke="currentColor" stroke-width="1.5" fill="none"/><polyline points="11,4 14,7 11,10" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
              </template>
            </a-button>
          </a-tooltip>
          <HistoryPanel />
          <span class="toolbar-divider"></span>
          <a-button size="small" @click="handleClear">清空画布</a-button>
          <a-button size="small" @click="openSaveTemplateDialog">保存为模板</a-button>
          <a-button size="small" @click="templateDialogOpen = true">从模板新建</a-button>
          <a-button size="small" @click="sharePanelOpen = true">分享</a-button>
          <a-button size="small" type="primary" @click="previewOpen = true">预览</a-button>
        </div>
      </div>

      <div class="canvas-body">
        <div class="canvas-form">
          <VueDraggable
            v-model="draggableCompList"
            :animation="150"
            group="form"
            handle=".canvas-item__drag-handle"
            ghost-class="sortable-ghost"
            class="canvas-sortable"
            :class="{ 'is-empty': draggableCompList.length === 0 }"
            @add="onRootCanvasAdd"
            @update="onRootCanvasUpdate"
          >
            <div v-if="draggableCompList.length === 0" class="canvas-watermark">
              <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#d9d9d9" stroke-width="1.2">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="15" x2="12" y2="15"/>
              </svg>
              <p>从左侧拖拽或点击组件开始搭建表单</p>
              <p class="canvas-watermark__hint">或点击「从模板新建」快速开始</p>
            </div>
            <CanvasItem
              v-for="(comp, index) in draggableCompList"
              :key="comp.id"
              :comp="comp"
              :index="index"
            />
          </VueDraggable>
          <div v-if="submitButtonComp && settingsStore.formSettings.showSubmitButton" class="canvas-submit-fixed">
            <CanvasItem
              :comp="submitButtonComp"
              :index="draggableCompList.length"
            />
          </div>
        </div>
      </div>
    </main>

    <aside class="editor-setting" :class="{ collapsed: settingCollapsed }">
      <button class="sidebar-toggle setting-toggle" @click="settingCollapsed = !settingCollapsed" :title="settingCollapsed ? '展开属性设置' : '收起属性设置'">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none"><polyline :points="settingCollapsed ? '10,3 5,8 10,13' : '6,3 11,8 6,13'" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
      </button>
      <h3 class="panel-title">属性设置</h3>
      <template v-if="store.selectedComp">
        <div
          v-if="selectedCompDef?.meta?.isDisplay && store.selectedComp.type !== 'submit-button'"
          class="setting-hint"
          style="text-align:center; padding: 40px 0"
        >
          该组件为纯展示组件，无属性可配置
        </div>
        <div
          v-if="!selectedCompDef?.meta?.isDisplay && store.selectedComp.type !== 'submit-button'"
          class="setting-section"
        >
          <h4 class="setting-section__title">基本属性</h4>
          <div class="setting-row">
            <label>标题</label>
            <a-input
              :value="store.selectedComp.title"
              size="small"
              @input="
                store.updateSelectedComp({ title: ($event.target as HTMLInputElement).value })
              "
            />
          </div>
          <div
            v-if="selectedCompDef?.meta?.hasDescription !== false"
            class="setting-row"
          >
            <label>描述</label>
            <a-input
              :value="store.selectedComp.description"
              size="small"
              placeholder="选填"
              @input="
                store.updateSelectedComp({ description: ($event.target as HTMLInputElement).value })
              "
            />
          </div>
          <div
            v-if="selectedCompDef?.meta?.hasPlaceholder"
            class="setting-row"
          >
            <label>占位符</label>
            <a-input
              :value="store.selectedComp.placeholder"
              size="small"
              @input="
                store.updateSelectedComp({ placeholder: ($event.target as HTMLInputElement).value })
              "
            />
          </div>
          <div class="setting-row setting-row--inline">
            <label>必填</label>
            <a-switch
              :checked="store.selectedComp.required"
              size="small"
              @change="store.updateSelectedComp({ required: $event })"
            />
          </div>
        </div>

        <div
          v-if="selectedCompDef?.meta?.hasOptions && store.selectedComp.options?.length"
          class="setting-section"
        >
          <h4 class="setting-section__title">选项列表</h4>
          <div
            v-for="(opt, idx) in store.selectedComp.options"
            :key="opt.id"
            class="setting-option-row"
          >
            <a-input
              :value="opt.label"
              size="small"
              @input="updateOption(idx, ($event.target as HTMLInputElement).value)"
            />
            <a-button
              size="small"
              type="text"
              danger
              :disabled="store.selectedComp.options!.length <= 1"
              @click="removeOption(idx)"
            >
              删除
            </a-button>
          </div>
          <a-button size="small" block @click="addOption">+ 添加选项</a-button>
        </div>

        <MatrixEditor v-if="selectedCompDef?.meta?.hasMatrix" />
        <div v-if="store.selectedComp.type === 'submit-button'" class="setting-section">
          <h4 class="setting-section__title">按钮属性</h4>
          <div class="setting-row">
            <label>按钮类型</label>
            <a-select
              :value="(store.selectedComp.props?.btnType as string) ?? 'primary'"
              size="small"
              @change="store.updateSelectedComp({ props: { ...store.selectedComp!.props, btnType: $event } })"
            >
              <a-select-option value="primary">主要按钮</a-select-option>
              <a-select-option value="default">默认按钮</a-select-option>
              <a-select-option value="dashed">虚线按钮</a-select-option>
            </a-select>
          </div>
          <div class="setting-row">
            <label>尺寸</label>
            <a-select
              :value="(store.selectedComp.props?.size as string) ?? 'middle'"
              size="small"
              @change="store.updateSelectedComp({ props: { ...store.selectedComp!.props, size: $event } })"
            >
              <a-select-option value="small">小</a-select-option>
              <a-select-option value="middle">中</a-select-option>
              <a-select-option value="large">大</a-select-option>
            </a-select>
          </div>
          <div class="setting-row">
            <label>对齐方式</label>
            <a-select
              :value="(store.selectedComp.props?.align as string) ?? 'center'"
              size="small"
              @change="store.updateSelectedComp({ props: { ...store.selectedComp!.props, align: $event } })"
            >
              <a-select-option value="left">左对齐</a-select-option>
              <a-select-option value="center">居中</a-select-option>
              <a-select-option value="right">右对齐</a-select-option>
            </a-select>
          </div>
          <div class="setting-row setting-row--inline">
            <label>撑满宽度</label>
            <a-switch
              :checked="(store.selectedComp.props?.block as boolean) ?? false"
              size="small"
              @change="store.updateSelectedComp({ props: { ...store.selectedComp!.props, block: $event } })"
            />
          </div>
        </div>

        <LogicSection />
      </template>

      <div v-if="store.selectedComp" class="form-settings__divider"></div>
      <GlobalSettings />
    </aside>
  </div>
  <a-modal
    :open="saveTemplateOpen"
    title="保存为模板"
    ok-text="保存"
    cancel-text="取消"
    @ok="confirmSaveTemplate"
    @cancel="saveTemplateOpen = false"
  >
    <div class="setting-row">
      <label>模板名称</label>
      <a-input v-model:value="saveTemplateName" placeholder="请输入模板名称" />
    </div>
    <div class="setting-row">
      <label>模板描述</label>
      <a-textarea v-model:value="saveTemplateDesc" placeholder="简单描述模板用途" :rows="3" />
    </div>
  </a-modal>
</template>

<style lang="scss">
$c-primary: #1677ff;
$c-bg-page: #f0f2f5;
$c-bg-panel: #fafafa;
$c-bg-white: #ffffff;
$c-border: #e8e8e8;
$c-text: #1f1f1f;
$c-text-secondary: #888;
$c-text-muted: #bbb;

.editor-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: $c-bg-page;
}
.panel-title {
  font-size: 13px; font-weight: 700; color: $c-text;
  margin-bottom: 16px; padding-bottom: 12px;
  border-bottom: 1px solid $c-border;
}
.editor-sidebar {
  width: 260px; flex-shrink: 0;
  border-right: 1px solid $c-border;
  padding: 20px 16px; overflow-y: auto;
  background: $c-bg-panel;
  transition: width 0.25s ease, padding 0.25s ease;
  position: relative;
  &.collapsed {
    width: 40px;
    padding: 20px 8px;
    overflow: hidden;
    .panel-title, .comp-category, .comp-grid { display: none; }
    .sidebar-toggle { right: 4px; }
  }
}
.sidebar-toggle {
  position: absolute;
  top: 16px;
  right: 8px;
  z-index: 10;
  width: 24px;
  height: 24px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  padding: 0;
  transition: color 0.2s;
  &:hover { color: $c-primary; border-color: $c-primary; }
}
.category-label {
  font-size: 11px; font-weight: 600; color: $c-text-secondary;
  margin: 20px 0 10px; text-transform: uppercase; letter-spacing: 0.5px;
  &:first-child { margin-top: 0; }
}
.comp-grid { display: grid !important; grid-template-columns: 1fr 1fr; gap: 8px; user-select: none; }
.comp-card {
  display: flex; align-items: center; gap: 8px; padding: 10px 12px;
  background: $c-bg-white; border: 1px solid $c-border; border-radius: 6px;
  cursor: grab; transition: all 0.2s; position: relative; overflow: hidden;
  &::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
  &--basic::before { background: #1677ff; }
  &--info::before { background: #fa8c16; }
  &--layout::before { background: #8c8c8c; }
  &--advanced::before { background: #eb2f96; }
  &--choice::before { background: #722ed1; }
  &:hover { border-color: $c-primary; box-shadow: 0 2px 8px rgba(22,119,255,0.1); transform: translateY(-1px); }
  &:active { cursor: grabbing; transform: translateY(0); }
  &__icon { width: 20px; height: 20px; flex-shrink: 0; color: $c-text-secondary; svg { width: 20px; height: 20px; display: block; } }
  &__name { font-size: 12px; color: $c-text; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
}
.editor-canvas { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.canvas-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; background: $c-bg-white; border-bottom: 1px solid $c-border; flex-shrink: 0; }
.toolbar-title-wrap { display: flex; align-items: center; min-width: 120px; }
.toolbar-title { margin: 0; font-size: 15px; font-weight: 600; color: $c-text; cursor: text; display: flex; align-items: center; gap: 6px; padding: 2px 6px; border-radius: 4px; transition: background 0.15s; &:hover { background: #f0f0f0; } &__edit-icon { opacity: 0; color: $c-text-secondary; display: flex; align-items: center; transition: opacity 0.15s; } &:hover &__edit-icon { opacity: 1; } }
.toolbar-title-input { width: 180px; font-size: 15px; font-weight: 600; }
.toolbar-right { display: flex; gap: 8px; align-items: center; }
.toolbar-divider { display: inline-block; width: 1px; height: 20px; background: #e8e8e8; }
.canvas-body { flex: 1; overflow-y: auto; padding: 32px 24px; background: #f5f6f8; }
.canvas-form { position: relative; max-width: 660px; margin: 0 auto; background: $c-bg-white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04); min-height: 200px; }
.canvas-sortable { padding: 24px 28px 12px; min-height: 180px; &.is-empty { display: flex; align-items: center; justify-content: center; } }
.canvas-submit-fixed { padding: 12px 28px 24px; border-top: 1px solid #e8e8e8; margin: 0 12px; opacity: 0.8; }
.sortable-ghost { opacity: 0.3; background: #e6f4ff; border: 2px dashed $c-primary; border-radius: 6px; }
.canvas-watermark { display: flex; flex-direction: column; align-items: center; gap: 12px; user-select: none; p { font-size: 13px; color: #bbb; margin: 0; } &__hint { font-size: 12px; color: #d9d9d9; } }
.canvas-item { position: relative; display: flex; align-items: flex-start; gap: 10px; padding: 14px 16px; background: transparent; border: 2px solid transparent; border-radius: 6px; margin-bottom: 6px; cursor: pointer; transition: all 0.2s ease; &:hover { background: #fafcff; border-color: #d6e4ff; } &.selected { background: #f0f5ff; border-color: $c-primary; box-shadow: 0 0 0 3px rgba(22,119,255,0.08); &::before { content: ''; position: absolute; left: -2px; top: 8px; bottom: 8px; width: 3px; background: $c-primary; border-radius: 0 2px 2px 0; } } &__drag-handle { display: flex; align-items: center; cursor: grab; flex-shrink: 0; padding-top: 6px; opacity: 0; transition: opacity 0.2s; &:active { cursor: grabbing; } } &:hover &__drag-handle, &.selected &__drag-handle { opacity: 1; } &__index { display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; font-size: 11px; font-weight: 600; color: #999; background: #f5f5f5; border-radius: 4px; flex-shrink: 0; margin-top: 4px; transition: all 0.2s; } .selected &__index { color: $c-primary; background: #e6f4ff; } &__body { flex: 1; min-width: 0; } &__actions { position: absolute; top: 8px; right: 8px; display: flex; gap: 2px; opacity: 0; transition: opacity 0.15s; } &:hover &__actions, &.selected &__actions { opacity: 1; } &__children-list { min-height: 56px; &.is-empty { min-height: 72px; display: flex; align-items: stretch; } padding: 4px 0 4px 16px; margin-top: 8px; border-left: 2px solid #e8e8e8; } &__drop-zone { border: 2px dashed #d9d9d9; border-radius: 6px; padding: 16px; text-align: center; color: #bbb; font-size: 12px; width: 100%; min-height: 48px; display: flex; align-items: center; justify-content: center; transition: border-color 0.2s; &:hover { border-color: $c-primary; } } }
.editor-setting { width: 300px; flex-shrink: 0; border-left: 1px solid $c-border; padding: 20px 16px; overflow-y: auto; background: $c-bg-panel; transition: width 0.25s ease, padding 0.25s ease; position: relative; &.collapsed { width: 40px; padding: 20px 8px; overflow: hidden; .panel-title, .setting-section, .setting-hint, .setting-empty, .form-settings, .form-settings__divider { display: none; } .sidebar-toggle { left: 4px; } } }
.setting-toggle { left: 8px; right: auto; }
.setting-empty { text-align: center; color: $c-text-muted; font-size: 13px; margin-top: 60px; }
.setting-section { padding-top: 8px; border-top: 1px solid $c-border; margin-top: 16px; &:first-child { border-top: none; margin-top: 0; padding-top: 0; } &__title { font-size: 13px; font-weight: 600; color: $c-text; margin: 0 0 12px; padding-left: 8px; border-left: 3px solid $c-primary; line-height: 1.3; } }
.setting-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; label { color: $c-text-secondary; font-size: 12px; font-weight: 500; } &--inline { flex-direction: row; justify-content: space-between; align-items: center; } }
.setting-option-row { display: flex; gap: 6px; align-items: center; margin-bottom: 8px; }
.setting-hint { font-size: 12px; color: $c-text-muted; padding: 8px 0; }
.logic-rule-card { border: 1px solid $c-border; border-radius: 6px; padding: 10px; margin-bottom: 10px; }
.logic-rule-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.logic-rule-idx { font-size: 12px; font-weight: 600; color: $c-text-secondary; }
.logic-conditions { margin: 8px 0; }
.logic-condition-row { display: flex; gap: 4px; align-items: center; margin-bottom: 6px; flex-wrap: wrap; }
.logic-condition-sep { width: 100%; font-size: 11px; color: $c-text-secondary; padding-left: 8px; margin: 2px 0; }
.validation-rule-card { border: 1px solid $c-border; border-radius: 6px; padding: 10px; margin-bottom: 10px; }
.validation-rule-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.validation-rule-idx { font-size: 12px; font-weight: 600; color: $c-text-secondary; }
.form-settings { padding: 4px 0; &__divider { height: 1px; background: $c-border; margin: 16px 0 12px; } }
</style>
