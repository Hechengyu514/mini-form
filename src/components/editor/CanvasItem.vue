<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentConfig } from '@/types'
import { useEditorStore } from '@/stores'
import { VueDraggable } from 'vue-draggable-plus'
import FormField from '@/components/form/FormField.vue'
import { pluginManager } from '@/plugins'

interface DragEvent {
  newIndex?: number
  oldIndex?: number
}

const props = defineProps<{
  comp: ComponentConfig
  index: number
}>()

const store = useEditorStore()

const isSelected = computed(() => store.selectedId === props.comp.id)

const isContainer = computed(() => {
  const def = pluginManager.getByType(props.comp.type)
  return def?.meta?.isLayout === true && def.type !== 'divider'
})

const childrenModel = computed<ComponentConfig[]>({
  get: () => props.comp.children ?? [],
  set: (val) => {
    store.updateCompById(props.comp.id, { children: val })
  },
})

function handleSelect() {
  store.selectComp(props.comp.id)
}

function handleCopy(e: Event) {
  e.stopPropagation()
  store.copyComp(props.comp.id)
}

function handleDelete(e: Event) {
  e.stopPropagation()
  store.deleteComp(props.comp.id)
}

function onChildrenAdd(e: DragEvent) {
  if (e.newIndex === undefined) return
  const list = props.comp.children ?? []
  const child = list[e.newIndex]
  if (!child) return
  store.selectComp(child.id)
  const idx = e.newIndex
  store.recordCommand({
    description: `添加「${child.title || child.type}」`,
    undo: () => {
      const children = props.comp.children
      if (!children) return
      const r = children.findIndex((c) => c.id === child.id)
      if (r !== -1) children.splice(r, 1)
    },
    redo: () => {
      const c = props.comp.children ?? []
      const insertAt = Math.min(idx, c.length)
      c.splice(insertAt, 0, child)
      store.selectComp(child.id)
    },
  })
}

function onChildrenUpdate(e: DragEvent) {
  const { oldIndex, newIndex } = e
  if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return
  const moved = props.comp.children?.[oldIndex]
  store.recordCommand({
    description: `移动「${moved?.title || moved?.type || '组件'}」`,
    undo: () => {
      const c = props.comp.children
      if (!c) return
      const [item] = c.splice(newIndex, 1)
      if (item) c.splice(oldIndex, 0, item)
    },
    redo: () => {
      const c = props.comp.children
      if (!c) return
      const [item] = c.splice(oldIndex, 1)
      if (item) c.splice(newIndex, 0, item)
    },
  })
}
</script>

<template>
  <div
    class="canvas-item"
    :class="{ selected: isSelected }"
    @click.stop="handleSelect"
  >
    <div v-if="comp.type !== 'submit-button'" class="canvas-item__drag-handle">
      <svg viewBox="0 0 20 20" width="16" height="16" fill="#bbb">
        <circle cx="7" cy="7" r="1.5" /><circle cx="13" cy="7" r="1.5" />
        <circle cx="7" cy="13" r="1.5" /><circle cx="13" cy="13" r="1.5" />
      </svg>
    </div>
    <span v-if="comp.type !== 'submit-button'" class="canvas-item__index">{{ index + 1 }}</span>
    <div class="canvas-item__body">
      <FormField :config="comp">
        <template v-if="isContainer">
          <VueDraggable
            v-model="childrenModel"
            :animation="150"
            group="form"
            handle=".canvas-item__drag-handle"
            ghost-class="sortable-ghost"
            :filter="'.canvas-item__drop-zone'"
            class="canvas-item__children-list"
            :class="{ 'is-empty': !comp.children || comp.children.length === 0 }"
            @add="onChildrenAdd"
            @update="onChildrenUpdate"
          >
            <CanvasItem
              v-for="(child, idx) in comp.children"
              :key="child.id"
              :comp="child"
              :index="idx"
            />
            <div class="canvas-item__drop-zone">
              {{ (comp.children && comp.children.length > 0) ? '拖拽到此处添加' : '将组件拖拽到此处' }}
            </div>
          </VueDraggable>
        </template>
      </FormField>
    </div>
    <div v-if="isSelected && comp.type !== 'submit-button'" class="canvas-item__actions">
      <a-button size="small" type="text" @click="handleCopy">复制</a-button>
      <a-button size="small" type="text" danger @click="handleDelete">删除</a-button>
    </div>
  </div>
</template>
