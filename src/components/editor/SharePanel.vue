<script setup lang="ts">
/**
 * 分享发布面板 — 生成分享链接与二维码，发布时将表单配置写入 localStorage
 */
import { ref, watch, nextTick } from 'vue'
import { useEditorStore, useSubmissionStore } from '@/stores'
import QRCode from 'qrcode'

const props = defineProps<{ open: boolean }>()

const emit = defineEmits<{ close: [] }>()

const store = useEditorStore()
const submissionStore = useSubmissionStore()

const published = ref(false)
const copied = ref(false)
const qrDataUrl = ref('')
const shareId = ref('')

function generateShareUrl() {
  if (!shareId.value) shareId.value = Date.now().toString(36)
  return `${window.location.origin}/form/${shareId.value}`
}

const shareUrl = ref('')

watch(() => props.open, (val) => {
  if (val) {
    shareId.value = Date.now().toString(36)
    shareUrl.value = generateShareUrl()
    copied.value = false
    published.value = false
    qrDataUrl.value = ''
  }
})

async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Clipboard API 不可用时静默失败
  }
}

async function togglePublish() {
  published.value = !published.value
  if (published.value) {
    const data = store.exportFormConfig()
    localStorage.setItem(`mini-form-share-${shareId.value}`, JSON.stringify(data))
    await nextTick()
    try {
      const canvas = document.getElementById('qrcode-canvas') as HTMLCanvasElement | null
      if (canvas) {
        await QRCode.toCanvas(canvas, shareUrl.value, { width: 160, margin: 1 })
        qrDataUrl.value = canvas.toDataURL()
      }
    } catch { /* ignore */ }
  } else {
    localStorage.removeItem(`mini-form-share-${shareId.value}`)
    qrDataUrl.value = ''
  }
}
</script>

<template>
  <a-modal
    :open="open"
    title="分享发布"
    :footer="null"
    width="480px"
    @cancel="emit('close')"
  >
    <div class="share-body">
      <!-- 发布状态 -->
      <div class="share-status">
        <span class="share-status__label">表单状态</span>
        <a-tag v-if="published" color="green">已发布</a-tag>
        <a-tag v-else color="default">未发布</a-tag>
        <a-switch :checked="published" size="small" @change="togglePublish" />
      </div>

      <p class="share-desc">
        {{ published ? '表单已公开发布，任何人可通过链接填写' : '开启后生成分享链接和二维码' }}
      </p>

      <!-- 分享链接 -->
      <div class="share-field">
        <label>分享链接</label>
        <div class="share-link-row">
          <a-input :value="shareUrl" readonly size="small" />
          <a-button size="small" type="primary" @click="copyLink">
            {{ copied ? '已复制' : '复制' }}
          </a-button>
        </div>
      </div>

      <!-- 二维码 -->
      <div v-if="published" class="share-qr">
        <canvas id="qrcode-canvas" style="display:none"></canvas>
        <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR Code" class="share-qr__img" />
        <p class="share-qr__hint">扫描二维码打开表单</p>
      </div>

      <div class="share-meta">
        <span>表单字段：{{ store.compList.length }} 个</span>
        <span>收集数据：{{ submissionStore.submissions.length }} 份</span>
      </div>
    </div>
  </a-modal>
</template>

<style scoped>
.share-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.share-status {
  display: flex;
  align-items: center;
  gap: 10px;
}
.share-status__label {
  font-size: 13px;
  font-weight: 500;
  color: #555;
}
.share-desc {
  margin: 0;
  font-size: 13px;
  color: #888;
}
.share-field label {
  display: block;
  font-size: 12px;
  color: #888;
  margin-bottom: 6px;
}
.share-link-row {
  display: flex;
  gap: 8px;
}
.share-link-row .a-input {
  flex: 1;
}
.share-qr {
  text-align: center;
  padding: 12px 0;
}
.share-qr__img {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 8px;
  background: #fff;
}
.share-qr__hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #bbb;
}
.share-meta {
  display: flex;
  gap: 24px;
  font-size: 12px;
  color: #888;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}
</style>
