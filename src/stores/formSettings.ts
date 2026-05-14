import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { FormSettings } from '@/types'

function loadSettings(): FormSettings {
  const saved = localStorage.getItem('mini-form-state')
  if (saved) {
    const parsed = JSON.parse(saved) as { settings?: FormSettings }
    if (parsed.settings) return parsed.settings
  }
  return {
    title: '未命名表单',
    showSubmitButton: true,
    showSerialNumber: false,
    status: 'draft',
  }
}

export const useFormSettingsStore = defineStore('formSettings', () => {
  const formSettings = ref<FormSettings>(loadSettings())

  watch(
    formSettings,
    () => {
      const saved = localStorage.getItem('mini-form-state')
      const state = saved ? JSON.parse(saved) : {}
      state.settings = formSettings.value
      localStorage.setItem('mini-form-state', JSON.stringify(state))
    },
    { deep: true },
  )

  function updateSettings(patch: Partial<FormSettings>) {
    Object.assign(formSettings.value, patch)
  }

  return { formSettings, updateSettings }
})
