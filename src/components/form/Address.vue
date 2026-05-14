<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentConfig } from '@/types'
import '@/assets/styles/form-field.css'

// 中国省/市/区数据 — china-area-data v5
import areaData from 'china-area-data'

interface AddressValue {
  region: string[]
  detail: string
}

const props = defineProps<{
  config: ComponentConfig
  modelValue?: AddressValue
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AddressValue]
}>()

interface AreaNode {
  value: string
  label: string
  children?: AreaNode[]
}

/** 将 china-area-data 的扁平结构转为 Cascader 的树形 options */
function buildAreaTree(): AreaNode[] {
  const root = areaData['86']
  if (!root || typeof root !== 'object') return []

  return Object.entries(root).map(([code, name]) => {
    const node: AreaNode = { value: code, label: String(name) }
    const children = areaData[code]
    if (children && typeof children === 'object') {
      node.children = Object.entries(children).map(([cityCode, cityName]) => {
        const cityNode: AreaNode = { value: cityCode, label: String(cityName) }
        const districts = areaData[cityCode]
        if (districts && typeof districts === 'object') {
          cityNode.children = Object.entries(districts).map(([distCode, distName]) => ({
            value: distCode,
            label: String(distName),
          }))
        }
        return cityNode
      })
    }
    return node
  })
}

const areaOptions = buildAreaTree()

const region = computed(() => props.modelValue?.region ?? [])
const detail = computed(() => props.modelValue?.detail ?? '')

function onRegionChange(val: string[] | undefined) {
  emit('update:modelValue', {
    region: val ?? [],
    detail: detail.value,
  })
}

function onDetailChange(e: Event) {
  emit('update:modelValue', {
    region: region.value,
    detail: (e.target as HTMLInputElement).value,
  })
}
</script>

<template>
  <label class="form-field-label">
    <span v-if="config.required" class="form-field-required">*</span>
    {{ config.title }}
  </label>
  <p v-if="config.description" class="form-field-desc">{{ config.description }}</p>
  <a-cascader
    :value="region"
    :options="areaOptions"
    :placeholder="config.props?.cascaderPlaceholder || '请选择省/市/区'"
    :allow-clear="config.props?.allowClear !== false"
    :show-search="config.props?.showSearch !== false"
    :change-on-select="config.props?.changeOnSelect !== false"
    style="width: 100%; margin-bottom: 8px"
    @change="onRegionChange"
  />
  <a-input
    :value="detail"
    :placeholder="config.props?.detailPlaceholder || '详细地址（街道、门牌号等）'"
    style="width: 100%"
    @change="onDetailChange"
  />
</template>

<style scoped>
.form-field-label {
  display: block;
}
</style>
