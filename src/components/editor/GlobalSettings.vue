<script setup lang="ts">
import { useFormSettingsStore } from '@/stores'

const settingsStore = useFormSettingsStore()
</script>

<template>
  <div class="form-settings">
    <h4 class="setting-section__title">全局表单设置</h4>
    <div class="setting-row">
      <label>表单标题</label>
      <a-input
        :value="settingsStore.formSettings.title"
        size="small"
        @input="settingsStore.formSettings.title = ($event.target as HTMLInputElement).value"
      />
    </div>
    <div class="setting-row">
      <label>表单描述</label>
      <a-textarea
        :value="settingsStore.formSettings.description"
        size="small"
        placeholder="显示在标题下方的引导文案"
        :rows="2"
        @input="settingsStore.formSettings.description = ($event.target as HTMLInputElement).value"
      />
    </div>
    <div class="setting-row">
      <label>提交成功提示</label>
      <a-input
        :value="settingsStore.formSettings.successMessage"
        size="small"
        placeholder="留空则显示默认文案"
        @input="settingsStore.formSettings.successMessage = ($event.target as HTMLInputElement).value"
      />
    </div>
    <div class="setting-row setting-row--inline">
      <label>表单状态</label>
      <a-tag v-if="settingsStore.formSettings.status === 'completed'" color="green">已完成</a-tag>
      <a-tag v-else color="blue">草稿</a-tag>
      <a-switch
        :checked="settingsStore.formSettings.status === 'completed'"
        size="small"
        checked-children="✓"
        un-checked-children="✎"
        @change="settingsStore.formSettings.status = $event ? 'completed' : 'draft'"
      />
    </div>
    <div class="setting-row setting-row--inline">
      <label>显示字段序号</label>
      <a-switch
        :checked="settingsStore.formSettings.showSerialNumber"
        size="small"
        @change="settingsStore.formSettings.showSerialNumber = $event"
      />
    </div>
    <div class="setting-row setting-row--inline">
      <label>显示提交按钮</label>
      <a-switch
        :checked="settingsStore.formSettings.showSubmitButton"
        size="small"
        @change="settingsStore.formSettings.showSubmitButton = $event"
      />
    </div>
    <div class="setting-row">
      <label>水印文本</label>
      <a-input
        :value="settingsStore.formSettings.watermark"
        size="small"
        placeholder="留空则不显示"
        @input="settingsStore.formSettings.watermark = ($event.target as HTMLInputElement).value"
      />
    </div>
  </div>
</template>
