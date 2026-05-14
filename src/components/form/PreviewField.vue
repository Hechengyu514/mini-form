<script setup lang="ts">
import type { ComponentConfig } from '@/types'
import FormField from '@/components/form/FormField.vue'

defineOptions({ name: 'PreviewField' })

defineProps<{
  comp: ComponentConfig
  formValues: Record<string, unknown>
  serial?: number
}>()

const emit = defineEmits<{
  'update:formValue': [id: string, value: unknown]
}>()

function onChildUpdate(childId: string, childValue: unknown) {
  emit('update:formValue', childId, childValue)
}
</script>

<template>
  <div class="preview-field-wrap" :class="{ 'has-serial': serial !== undefined }">
    <span v-if="serial !== undefined" class="preview-serial">{{ serial }}</span>
    <FormField
      :config="comp"
      :model-value="formValues[comp.id]"
      @update:model-value="emit('update:formValue', comp.id, $event)"
    >
      <template v-if="comp.children && comp.children.length > 0">
        <PreviewField
          v-for="child in comp.children"
          :key="child.id"
          :comp="child"
          :form-values="formValues"
          @update:form-value="onChildUpdate"
        />
      </template>
    </FormField>
  </div>
</template>

<style scoped>
.preview-field-wrap {
  display: flex;
  align-items: flex-start;
}
.preview-field-wrap :deep(.form-field) {
  flex: 1;
  min-width: 0;
}
.preview-field-wrap.has-serial :deep(.form-field-label) {
  padding-top: 2px;
}
.preview-serial {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  font-size: 11px;
  font-weight: 600;
  color: #999;
  background: #f5f5f5;
  border-radius: 4px;
  margin-right: 8px;
  margin-top: 2px;
  flex-shrink: 0;
}
</style>
