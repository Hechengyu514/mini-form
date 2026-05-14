<script setup lang="ts">
import { ref, shallowRef, watch, type Component } from 'vue'
import type { ComponentConfig } from '@/types'
import { pluginManager } from '@/plugins'
import type { PluginComponentDef } from '@/plugins'

const props = defineProps<{
  config: ComponentConfig
  modelValue?: unknown
}>()

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
}>()

const value = ref<unknown>(props.modelValue ?? props.config.defaultValue)
const comp = shallowRef<Component | null>(null)

/** 根据组件 type 异步加载对应的 .vue 组件 */
async function loadComponent(def: PluginComponentDef) {
  try {
    const mod = await def.component()
    comp.value = (mod as { default: Component }).default ?? (mod as Component)
  } catch {
    comp.value = null
  }
}

watch(
  () => props.config.type,
  (type) => {
    const def = pluginManager.getByType(type)
    if (def) loadComponent(def)
  },
  { immediate: true },
)

watch(
  () => props.modelValue,
  (v) => {
    value.value = v ?? props.config.defaultValue
  },
)

function onInput(val: unknown) {
  value.value = val
  emit('update:modelValue', val)
}
</script>

<template>
  <div class="form-field">
    <component
      v-if="comp"
      :is="comp"
      :config="config"
      :model-value="value"
      @update:model-value="onInput"
    >
      <slot />
    </component>
  </div>
</template>
