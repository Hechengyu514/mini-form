import type { ValidationRule } from '@/types'

const BUILTIN_PATTERNS: Record<string, RegExp> = {
  phone: /^1[3-9]\d{9}$/,
  telephone: /^(0\d{2,3}-?\d{7,8}|\d{7,8})$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  idCard: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
  url: /^https?:\/\/([\w-]+\.)+[\w-]+(\/[\w\-./?%&=]*)?$/,
  number: /^\d+$/,
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

function validateRule(value: unknown, rule: ValidationRule): string | null {
  const str = value !== undefined && value !== null ? String(value).trim() : ''
  const num = Number(value)

  switch (rule.type) {
    case 'required':
      if (str === '' || value === undefined || value === null) {
        return rule.message || '该项为必填'
      }
      if (Array.isArray(value) && value.length === 0) {
        return rule.message || '该项为必填'
      }
      return null

    case 'pattern':
      if (!str) return null
      const builtin = rule.pattern ? BUILTIN_PATTERNS[rule.pattern] : null
      if (builtin && !builtin.test(str)) {
        return rule.message || '格式不正确'
      }
      return null

    case 'customPattern':
      if (!str) return null
      if (rule.customRegex) {
        try {
          const re = new RegExp(rule.customRegex)
          if (!re.test(str)) return rule.message || '格式不正确'
        } catch {
          return '正则表达式配置错误'
        }
      }
      return null

    case 'min':
      if (!str) return null
      if (isNaN(num) || num < (rule.value ?? 0)) {
        return rule.message || `不能小于 ${rule.value}`
      }
      return null

    case 'max':
      if (!str) return null
      if (isNaN(num) || num > (rule.value ?? Infinity)) {
        return rule.message || `不能大于 ${rule.value}`
      }
      return null

    case 'minLength':
      if (!str) return null
      if (str.length < (rule.value ?? 0)) {
        return rule.message || `最少输入 ${rule.value} 个字符`
      }
      return null

    case 'maxLength':
      if (!str) return null
      if (str.length > (rule.value ?? Infinity)) {
        return rule.message || `最多输入 ${rule.value} 个字符`
      }
      return null

    default:
      return null
  }
}

/** 表单校验引擎：单字段校验 + 批量校验 */
export function useFormValidation() {
  function validateField(value: unknown, rules?: ValidationRule[]): ValidationResult {
    if (!rules || rules.length === 0) return { valid: true, errors: [] }

    const errors: string[] = []
    for (const rule of rules) {
      const error = validateRule(value, rule)
      if (error) errors.push(error)
    }

    return { valid: errors.length === 0, errors }
  }

  function validateForm(
    fields: Array<{ id: string; value: unknown; rules?: ValidationRule[] }>,
  ): Map<string, ValidationResult> {
    const results = new Map<string, ValidationResult>()
    for (const field of fields) {
      results.set(field.id, validateField(field.value, field.rules))
    }
    return results
  }

  return { validateField, validateForm }
}
