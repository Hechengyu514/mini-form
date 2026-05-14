import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { ComponentConfig, FormSettings } from '@/types'
import { useCommandHistory, type Command } from '@/composables/useCommandHistory'
import { useFormSettingsStore } from './formSettings'
import { generateUUID } from '@/utils/uuid'

function findCompById(id: string, list: ComponentConfig[]): ComponentConfig | null {
  for (const comp of list) {
    if (comp.id === id) return comp
    if (comp.children?.length) {
      const found = findCompById(id, comp.children)
      if (found) return found
    }
  }
  return null
}

function findParentList(
  id: string,
  list: ComponentConfig[],
): { parentList: ComponentConfig[]; index: number } | null {
  for (let i = 0; i < list.length; i++) {
    if (list[i]!.id === id) return { parentList: list, index: i }
    if (list[i]!.children?.length) {
      const result = findParentList(id, list[i]!.children!)
      if (result) return result
    }
  }
  return null
}

function assignNewIds(comp: ComponentConfig) {
  comp.id = generateUUID()
  if (comp.children) {
    for (const child of comp.children) {
      assignNewIds(child)
    }
  }
}

function createCompFromDefaults(
  type: string,
  defaultConfig: Partial<ComponentConfig>,
): ComponentConfig {
  return {
    id: generateUUID(),
    type,
    title: defaultConfig.title ?? type,
    description: defaultConfig.description,
    placeholder: defaultConfig.placeholder,
    defaultValue: defaultConfig.defaultValue,
    required: defaultConfig.required,
    validation: defaultConfig.validation ? [...defaultConfig.validation] : [],
    logic: defaultConfig.logic ? [...defaultConfig.logic] : [],
    options: defaultConfig.options ? [...defaultConfig.options] : [],
    matrixRows: defaultConfig.matrixRows ? [...defaultConfig.matrixRows] : undefined,
    matrixColumns: defaultConfig.matrixColumns ? [...defaultConfig.matrixColumns] : undefined,
    matrixMode: defaultConfig.matrixMode,
    children: defaultConfig.children ? [...defaultConfig.children] : undefined,
    colSpan: defaultConfig.colSpan,
    layout: defaultConfig.layout,
    props: defaultConfig.props ? { ...defaultConfig.props } : {},
  }
}

function loadCompList(): ComponentConfig[] {
  const saved = localStorage.getItem('mini-form-state')
  if (saved) {
    const parsed = JSON.parse(saved) as { compList?: ComponentConfig[] }
    if (parsed.compList) return parsed.compList
  }
  return []
}

/**
 * 编辑器核心 Store — 画布组件管理与撤销/重做
 *
 * 画布数据通过 deep watch 自动持久化到 localStorage。
 */
export const useEditorStore = defineStore('editor', () => {
  const compList = ref<ComponentConfig[]>(loadCompList())
  const selectedId = ref<string | null>(null)

  watch(
    compList,
    () => {
      const saved = localStorage.getItem('mini-form-state')
      const state = saved ? JSON.parse(saved) : {}
      state.compList = compList.value
      localStorage.setItem('mini-form-state', JSON.stringify(state))
    },
    { deep: true },
  )

  const history = useCommandHistory()

  const selectedComp = computed(() => {
    if (!selectedId.value) return null
    return findCompById(selectedId.value, compList.value)
  })

  const flattenedCompList = computed(() => {
    function flatten(list: ComponentConfig[]): ComponentConfig[] {
      const result: ComponentConfig[] = []
      for (const comp of list) {
        result.push(comp)
        if (comp.children?.length) {
          result.push(...flatten(comp.children))
        }
      }
      return result
    }
    return flatten(compList.value)
  })

  function addComp(type: string, defaultConfig: Partial<ComponentConfig>, index?: number) {
    const comp = createCompFromDefaults(type, defaultConfig)
    const targetIndex =
      index !== undefined && index >= 0 && index < compList.value.length
        ? index
        : compList.value.length

    if (targetIndex < compList.value.length) {
      compList.value.splice(targetIndex, 0, comp)
    } else {
      compList.value.push(comp)
    }
    selectedId.value = comp.id

    history.execute({
      description: `添加「${comp.title}」`,
      undo: () => {
        const r = findParentList(comp.id, compList.value)
        if (r) r.parentList.splice(r.index, 1)
        if (selectedId.value === comp.id) selectedId.value = null
      },
      redo: () => {
        if (targetIndex < compList.value.length) {
          compList.value.splice(targetIndex, 0, comp)
        } else {
          compList.value.push(comp)
        }
        selectedId.value = comp.id
      },
    })
  }

  function deleteComp(id: string) {
    const result = findParentList(id, compList.value)
    if (!result) return
    const deleted = result.parentList[result.index]!
    if (deleted.type === 'submit-button') return
    const parentList = result.parentList
    const idx = result.index
    const prevSelected = selectedId.value
    const deletedTitle = deleted.title || deleted.type

    parentList.splice(idx, 1)
    if (selectedId.value === id) selectedId.value = null

    history.execute({
      description: `删除「${deletedTitle}」`,
      undo: () => {
        parentList.splice(idx, 0, deleted)
        selectedId.value = prevSelected
      },
      redo: () => {
        const r = findParentList(id, compList.value)
        if (r) r.parentList.splice(r.index, 1)
        if (selectedId.value === id) selectedId.value = null
      },
    })
  }

  function copyComp(id: string) {
    const result = findParentList(id, compList.value)
    if (!result) return
    const clone = JSON.parse(JSON.stringify(result.parentList[result.index!])) as ComponentConfig
    assignNewIds(clone)
    const cloneId = clone.id
    const parentList = result.parentList
    const insertIdx = result.index + 1

    parentList.splice(insertIdx, 0, clone)
    selectedId.value = cloneId

    history.execute({
      description: `复制「${clone.title || clone.type}」`,
      undo: () => {
        const r = findParentList(cloneId, compList.value)
        if (r) r.parentList.splice(r.index, 1)
        if (selectedId.value === cloneId) selectedId.value = null
      },
      redo: () => {
        const source = findCompById(id, compList.value)
        if (!source) return
        const c = JSON.parse(JSON.stringify(source)) as ComponentConfig
        assignNewIds(c)
        const r = findParentList(id, compList.value)
        if (r) {
          r.parentList.splice(r.index + 1, 0, c)
          selectedId.value = c.id
        }
      },
    })
  }

  function selectComp(id: string | null) {
    selectedId.value = id
  }

  function updateCompById(id: string, patch: Partial<ComponentConfig>) {
    const comp = findCompById(id, compList.value)
    if (!comp) return
    Object.assign(comp, patch)
  }

  function updateSelectedComp(patch: Partial<ComponentConfig>) {
    const comp = selectedComp.value
    if (!comp) return

    const oldValues: Record<string, unknown> = {}
    for (const key of Object.keys(patch)) {
      oldValues[key] = (comp as unknown as Record<string, unknown>)[key]
    }

    Object.assign(comp, patch)
    const compId = comp.id

    // 合并连续对同一组件的属性修改，避免逐键回退
    const top = history.undoStack.value.at(-1) as Command & {
      _mergeId?: string
      _mergePatch?: Partial<ComponentConfig>
    }
    if (top?._mergeId === compId) {
      Object.assign(top._mergePatch!, patch)
      const mergedPatch = { ...top._mergePatch }
      top.redo = () => {
        const c = findCompById(compId, compList.value)
        if (c) Object.assign(c, mergedPatch)
      }
      return
    }

    const mergedPatch = { ...patch }
    history.execute({
      description: `修改「${comp.title || comp.type}」属性`,
      _mergeId: compId,
      _mergePatch: mergedPatch,
      undo: () => {
        const c = findCompById(compId, compList.value)
        if (c) Object.assign(c, oldValues)
      },
      redo: () => {
        const c = findCompById(compId, compList.value)
        if (c) Object.assign(c, mergedPatch)
      },
    } as Command & { _mergeId: string; _mergePatch: Partial<ComponentConfig> })
  }

  function exportFormConfig() {
    const settingsStore = useFormSettingsStore()
    return JSON.parse(
      JSON.stringify({
        id: generateUUID(),
        title: settingsStore.formSettings.title,
        components: compList.value,
        settings: settingsStore.formSettings,
      }),
    )
  }

  function importFormConfig(data: { components: ComponentConfig[]; settings?: Partial<FormSettings> }) {
    const settingsStore = useFormSettingsStore()
    const prevComps = compList.value
    const prevSettings = { ...settingsStore.formSettings }
    const prevSelected = selectedId.value

    compList.value = data.components
    if (data.settings) Object.assign(settingsStore.formSettings, data.settings)
    selectedId.value = null

    history.execute({
      description: '应用模板',
      undo: () => {
        compList.value = prevComps
        Object.assign(settingsStore.formSettings, prevSettings)
        selectedId.value = prevSelected
      },
      redo: () => {
        compList.value = data.components
        if (data.settings) Object.assign(settingsStore.formSettings, data.settings)
        selectedId.value = null
      },
    })
  }

  function clearAll() {
    if (compList.value.length === 0) return
    const prevComps = [...compList.value]
    const prevSelected = selectedId.value

    compList.value = []
    selectedId.value = null

    history.execute({
      description: '清空画布',
      undo: () => {
        compList.value = prevComps
        selectedId.value = prevSelected
      },
      redo: () => {
        compList.value = []
        selectedId.value = null
      },
    })
  }

  function recordCommand(cmd: Command) {
    history.execute(cmd)
  }

  return {
    compList,
    selectedId,
    selectedComp,
    flattenedCompList,
    recordCommand,
    addComp,
    deleteComp,
    copyComp,
    selectComp,
    updateCompById,
    updateSelectedComp,
    exportFormConfig,
    importFormConfig,
    clearAll,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    lastUndoLabel: history.lastUndoLabel,
    lastRedoLabel: history.lastRedoLabel,
    undoStack: history.undoStack,
    redoStack: history.redoStack,
    undo: history.undo,
    redo: history.redo,
  }
})
