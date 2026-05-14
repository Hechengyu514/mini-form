<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores'
import { pluginManager } from '@/plugins'
import type { LogicRule, LogicCondition, ShowOrHideLogicOperator } from '@/types'

const store = useEditorStore()

const operatorLabels: Record<string, string> = {
  eq: '等于',
  neq: '不等于',
  contains: '包含',
  not_contains: '不包含',
  isEmpty: '为空',
  isNotEmpty: '不为空',
  gt: '大于',
  lt: '小于',
  gte: '大于等于',
  lte: '小于等于',
}

/** 可被选择为依赖源的非展示型字段 */
const sourceFields = computed(() =>
  store.flattenedCompList.filter((c) => {
    const def = pluginManager.getByType(c.type)
    return !def?.meta?.isDisplay && !def?.meta?.isLayout && c.id !== store.selectedId
  }),
)

function addRule() {
  if (!store.selectedComp) return
  const rules = [...(store.selectedComp.logic ?? [])]
  rules.push({
    mode: 'and',
    action: 'show',
    conditions: [{ sourceId: '', operator: 'eq' as ShowOrHideLogicOperator, value: '' }],
  })
  store.updateSelectedComp({ logic: rules })
}

function removeRule(idx: number) {
  if (!store.selectedComp?.logic) return
  const rules = [...store.selectedComp.logic]
  rules.splice(idx, 1)
  store.updateSelectedComp({ logic: rules })
}

function updateRule(idx: number, patch: Partial<LogicRule>) {
  if (!store.selectedComp?.logic) return
  const rules = [...store.selectedComp.logic]
  Object.assign(rules[idx]!, patch)
  store.updateSelectedComp({ logic: rules })
}

function addCondition(ruleIdx: number) {
  if (!store.selectedComp?.logic) return
  const rules = [...store.selectedComp.logic]
  const rule = rules[ruleIdx]
  if (!rule) return
  rules[ruleIdx] = {
    ...rule,
    conditions: [...rule.conditions, { sourceId: '', operator: 'eq' as ShowOrHideLogicOperator, value: '' }],
  }
  store.updateSelectedComp({ logic: rules })
}

function removeCondition(ruleIdx: number, condIdx: number) {
  if (!store.selectedComp?.logic) return
  const rules = [...store.selectedComp.logic]
  const rule = rules[ruleIdx]
  if (!rule || rule.conditions.length <= 1) return
  const conditions = [...rule.conditions]
  conditions.splice(condIdx, 1)
  rules[ruleIdx] = { ...rule, conditions }
  store.updateSelectedComp({ logic: rules })
}

function updateCondition(ruleIdx: number, condIdx: number, patch: Partial<LogicCondition>) {
  if (!store.selectedComp?.logic) return
  const rules = [...store.selectedComp.logic]
  const rule = rules[ruleIdx]
  if (!rule) return
  const conditions = [...rule.conditions]
  const cond = conditions[condIdx]
  if (!cond) return
  conditions[condIdx] = { ...cond, ...patch }
  rules[ruleIdx] = { ...rule, conditions }
  store.updateSelectedComp({ logic: rules })
}
</script>

<template>
  <div v-if="store.selectedComp?.logic" class="setting-section">
    <h4 class="setting-section__title">显隐逻辑</h4>
    <div
      v-for="(rule, ri) in store.selectedComp.logic"
      :key="ri"
      class="logic-rule-card"
    >
      <div class="logic-rule-header">
        <span class="logic-rule-idx">规则 #{{ ri + 1 }}</span>
        <a-button size="small" type="text" danger @click="removeRule(ri)">删除</a-button>
      </div>
      <div class="setting-row">
        <label>条件关系</label>
        <a-radio-group
          :value="rule.mode"
          size="small"
          @change="updateRule(ri, { mode: ($event.target as HTMLInputElement).value as 'and' | 'or' })"
        >
          <a-radio-button value="and">全部满足 (AND)</a-radio-button>
          <a-radio-button value="or">任一满足 (OR)</a-radio-button>
        </a-radio-group>
      </div>
      <div class="logic-conditions">
        <div
          v-for="(cond, ci) in rule.conditions"
          :key="ci"
        >
          <div v-if="ci > 0" class="logic-condition-sep">
            {{ rule.mode === 'and' ? '且' : '或' }}
          </div>
          <div class="logic-condition-row">
            <a-select
              :value="cond.sourceId"
              size="small"
              placeholder="依赖字段"
              style="min-width: 110px"
              @change="updateCondition(ri, ci, { sourceId: $event })"
            >
              <a-select-option
                v-for="sf in sourceFields"
                :key="sf.id"
                :value="sf.id"
              >
                {{ sf.title }}
              </a-select-option>
            </a-select>
            <a-select
              :value="cond.operator"
              size="small"
              style="min-width: 90px"
              @change="updateCondition(ri, ci, { operator: $event })"
            >
              <a-select-option
                v-for="(label, op) in operatorLabels"
                :key="op"
                :value="op"
              >
                {{ label }}
              </a-select-option>
            </a-select>
            <a-input
              v-if="!['isEmpty', 'isNotEmpty'].includes(cond.operator)"
              :value="cond.value"
              size="small"
              placeholder="值"
              style="width: 80px"
              @input="updateCondition(ri, ci, { value: ($event.target as HTMLInputElement).value })"
            />
            <a-button
              size="small"
              type="text"
              danger
              :disabled="rule.conditions.length <= 1"
              @click="removeCondition(ri, ci)"
            >
              删
            </a-button>
          </div>
        </div>
      </div>
      <div class="setting-row">
        <label>命中后行为</label>
        <a-radio-group
          :value="rule.action"
          size="small"
          @change="updateRule(ri, { action: ($event.target as HTMLInputElement).value as 'show' | 'hide' })"
        >
          <a-radio-button value="show">显示</a-radio-button>
          <a-radio-button value="hide">隐藏</a-radio-button>
        </a-radio-group>
      </div>
      <a-button size="small" block @click="addCondition(ri)">+ 添加条件</a-button>
    </div>
    <a-button size="small" block @click="addRule">
      + 添加显隐规则
    </a-button>
  </div>
</template>
