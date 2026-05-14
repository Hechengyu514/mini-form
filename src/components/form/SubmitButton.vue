<script setup lang="ts">
import { computed, inject } from 'vue'
import type { ComponentConfig } from '@/types'

const props = defineProps<{
  config: ComponentConfig
}>()

const submitForm = inject<() => void>('submitForm', () => {})

type BtnType = 'primary' | 'default' | 'dashed'
type BtnSize = 'small' | 'middle' | 'large'
type AlignValue = 'left' | 'center' | 'right'

const btnType = computed<BtnType>(() => (props.config.props?.btnType as BtnType) ?? 'primary')
const btnSize = computed<BtnSize>(() => (props.config.props?.size as BtnSize) ?? 'middle')
const btnBlock = computed(() => (props.config.props?.block as boolean) ?? false)
const btnAlign = computed<AlignValue>(() => (props.config.props?.align as AlignValue) ?? 'center')
</script>

<template>
  <div class="submit-btn-wrap" :style="{ textAlign: btnAlign }">
    <a-button
      :type="btnType"
      :block="btnBlock"
      :size="btnSize"
      @click="submitForm"
    >
      {{ config.title || '提交' }}
    </a-button>
  </div>
</template>

<style scoped>
.submit-btn-wrap {
  padding: 8px 0;
}
</style>
