import type { LogicRule, LogicCondition } from '@/types'

function toComparable(value: unknown): string | number {
  return value !== undefined && value !== null ? (value as string | number) : ''
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

function evaluateCondition(condition: LogicCondition, values: Record<string, unknown>): boolean {
  const sourceValue = values[condition.sourceId]
  const sv = toComparable(sourceValue)
  const tv = condition.value !== undefined ? condition.value : ''

  switch (condition.operator) {
    case 'isEmpty':
      return isEmpty(sourceValue)
    case 'isNotEmpty':
      return !isEmpty(sourceValue)
    case 'eq':
      return String(sv) === String(tv)
    case 'neq':
      return String(sv) !== String(tv)
    case 'contains':
      return String(sv).includes(String(tv))
    case 'not_contains':
      return !String(sv).includes(String(tv))
    case 'gt':
      return Number(sv) > Number(tv) && !isNaN(Number(sv))
    case 'gte':
      return Number(sv) >= Number(tv) && !isNaN(Number(sv))
    case 'lt':
      return Number(sv) < Number(tv) && !isNaN(Number(sv))
    case 'lte':
      return Number(sv) <= Number(tv) && !isNaN(Number(sv))
    default:
      return false
  }
}

/** 字段显隐引擎：根据 LogicRule 和当前表单值判断字段是否可见 */
export function useLogicEvaluator() {
  function isVisible(rules: LogicRule[] | undefined, values: Record<string, unknown>): boolean {
    if (!rules || rules.length === 0) return true

    for (const rule of rules) {
      if (rule.conditions.length === 0) continue

      const triggered =
        rule.mode === 'and'
          ? rule.conditions.every((c) => evaluateCondition(c, values))
          : rule.conditions.some((c) => evaluateCondition(c, values))

      if (triggered) {
        return rule.action !== 'hide'
      }
    }

    return true
  }

  function computeHiddenIds(
    fields: Array<{ id: string; logic?: LogicRule[] }>,
    values: Record<string, unknown>,
  ): Set<string> {
    const hidden = new Set<string>()
    for (const field of fields) {
      if (!isVisible(field.logic, values)) {
        hidden.add(field.id)
      }
    }
    return hidden
  }

  return { isVisible, computeHiddenIds }
}
