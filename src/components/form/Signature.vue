<script setup lang="ts">
import { ref, watch, onMounted, nextTick, computed } from 'vue'
import type { ComponentConfig } from '@/types'
import '@/assets/styles/form-field.css'

const props = defineProps<{
  config: ComponentConfig
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const drawing = ref(false)
const hasContent = ref(false)

const width = computed(() => (props.config.props?.width as number) ?? 400)
const height = computed(() => (props.config.props?.height as number) ?? 150)

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.strokeStyle = '#1f1f1f'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (props.modelValue) {
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0)
      hasContent.value = true
    }
    img.src = props.modelValue
  }
}

function getPos(e: MouseEvent | Touch) {
  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function onStart(e: MouseEvent | TouchEvent) {
  e.preventDefault()
  drawing.value = true
  const ctx = canvasRef.value!.getContext('2d')!
  ctx.beginPath()
  const pos = 'touches' in e ? getPos(e.touches[0]!) : getPos(e as MouseEvent)
  ctx.moveTo(pos.x, pos.y)
}

function onMove(e: MouseEvent | TouchEvent) {
  if (!drawing.value) return
  e.preventDefault()
  const ctx = canvasRef.value!.getContext('2d')!
  const pos = 'touches' in e ? getPos(e.touches[0]!) : getPos(e as MouseEvent)
  ctx.lineTo(pos.x, pos.y)
  ctx.stroke()
  hasContent.value = true
}

function onEnd() {
  if (!drawing.value) return
  drawing.value = false
  const canvas = canvasRef.value!
  emit('update:modelValue', canvas.toDataURL('image/png'))
}

function clearSignature() {
  const canvas = canvasRef.value!
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  hasContent.value = false
  emit('update:modelValue', '')
}

onMounted(() => {
  nextTick(initCanvas)
})

watch(() => props.modelValue, () => {
  if (!props.modelValue) {
    clearSignature()
  }
})
</script>

<template>
  <label class="form-field-label">
    <span v-if="config.required" class="form-field-required">*</span>
    {{ config.title }}
  </label>
  <p v-if="config.description" class="form-field-desc">{{ config.description }}</p>
  <div class="signature-wrap">
    <canvas
      ref="canvasRef"
      :width="width"
      :height="height"
      class="signature-canvas"
      @mousedown="onStart"
      @mousemove="onMove"
      @mouseup="onEnd"
      @mouseleave="onEnd"
      @touchstart="onStart"
      @touchmove="onMove"
      @touchend="onEnd"
    />
    <a-button size="small" class="signature-clear" @click="clearSignature">清空重签</a-button>
  </div>
</template>

<style scoped>
.form-field-label {
  display: block;
}
.signature-wrap {
  display: block;
  width: 100%;
}
.signature-canvas {
  display: block;
  width: 100%;
  height: auto;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  cursor: crosshair;
  touch-action: none;
}
.signature-clear {
  margin-top: 6px;
}
</style>
