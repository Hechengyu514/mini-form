import { describe, it, expect } from 'vitest'
import { useFormValidation } from '@/composables/useFormValidation'

const { validateField, validateForm } = useFormValidation()

// ==================== 边界条件 ====================
describe('边界条件', () => {
  it('无校验规则 → 始终通过', () => {
    const r = validateField('test', [])
    expect(r.valid).toBe(true)
    expect(r.errors).toEqual([])
  })

  it('rules 为 undefined → 通过', () => {
    const r = validateField('test', undefined)
    expect(r.valid).toBe(true)
  })

  it('值本身为 undefined → 非 required 规则跳过', () => {
    const r = validateField(undefined, [{ type: 'pattern', pattern: 'phone' }])
    expect(r.valid).toBe(true)
  })

  it('值本身为 null → 非 required 规则跳过', () => {
    const r = validateField(null, [{ type: 'pattern', pattern: 'email' }])
    expect(r.valid).toBe(true)
  })
})

// ==================== required ====================
describe('required 校验', () => {
  it('空字符串 → 不通过', () => {
    const r = validateField('', [{ type: 'required', message: '必填' }])
    expect(r.valid).toBe(false)
    expect(r.errors).toContain('必填')
  })

  it('纯空格 → 不通过（trim 后为空）', () => {
    const r = validateField('   ', [{ type: 'required', message: '必填' }])
    expect(r.valid).toBe(false)
  })

  it('undefined → 不通过', () => {
    const r = validateField(undefined, [{ type: 'required' }])
    expect(r.valid).toBe(false)
  })

  it('null → 不通过', () => {
    const r = validateField(null, [{ type: 'required' }])
    expect(r.valid).toBe(false)
  })

  it('非空字符串 → 通过', () => {
    const r = validateField('hello', [{ type: 'required' }])
    expect(r.valid).toBe(true)
  })

  it('空数组 → 不通过', () => {
    const r = validateField([], [{ type: 'required', message: '至少选一项' }])
    expect(r.valid).toBe(false)
    expect(r.errors).toContain('至少选一项')
  })

  it('非空数组 → 通过', () => {
    const r = validateField(['a'], [{ type: 'required' }])
    expect(r.valid).toBe(true)
  })

  it('数字 0 → 通过（0 是有效值非空）', () => {
    const r = validateField(0, [{ type: 'required' }])
    expect(r.valid).toBe(true)
  })

  it('无自定义 message → 使用默认文案', () => {
    const r = validateField('', [{ type: 'required' }])
    expect(r.errors[0]).toContain('必填')
  })
})

// ==================== pattern 内置正则 ====================
describe('pattern 内置正则校验', () => {
  it('有效手机号 → 通过', () => {
    const r = validateField('13800138000', [{ type: 'pattern', pattern: 'phone' }])
    expect(r.valid).toBe(true)
  })

  it('无效手机号（位数不对）→ 不通过', () => {
    const r = validateField('12345', [
      { type: 'pattern', pattern: 'phone', message: '手机号格式错误' },
    ])
    expect(r.valid).toBe(false)
    expect(r.errors).toContain('手机号格式错误')
  })

  it('有效邮箱 → 通过', () => {
    const r = validateField('test@example.com', [{ type: 'pattern', pattern: 'email' }])
    expect(r.valid).toBe(true)
  })

  it('无效邮箱 → 不通过', () => {
    const r = validateField('not-an-email', [{ type: 'pattern', pattern: 'email' }])
    expect(r.valid).toBe(false)
  })

  it('有效身份证号（18位）→ 通过', () => {
    const r = validateField('110101199003077658', [{ type: 'pattern', pattern: 'idCard' }])
    expect(r.valid).toBe(true)
  })

  it('有效身份证号（15位）→ 通过', () => {
    const r = validateField('110101900307765', [{ type: 'pattern', pattern: 'idCard' }])
    expect(r.valid).toBe(true)
  })

  it('无效身份证号 → 不通过', () => {
    const r = validateField('abcdefg', [{ type: 'pattern', pattern: 'idCard' }])
    expect(r.valid).toBe(false)
  })

  it('有效 URL → 通过', () => {
    const r = validateField('https://github.com', [{ type: 'pattern', pattern: 'url' }])
    expect(r.valid).toBe(true)
  })

  it('无效 URL → 不通过', () => {
    const r = validateField('not-a-url', [{ type: 'pattern', pattern: 'url' }])
    expect(r.valid).toBe(false)
  })

  it('纯数字字符串 → 通过 digit', () => {
    const r = validateField('12345', [{ type: 'pattern', pattern: 'number' }])
    expect(r.valid).toBe(true)
  })

  it('含字母字符串 → 数字校验不通过', () => {
    const r = validateField('123a5', [{ type: 'pattern', pattern: 'number' }])
    expect(r.valid).toBe(false)
  })
})

// ==================== customPattern ====================
describe('customPattern 自定义正则校验', () => {
  it('匹配自定义正则 → 通过', () => {
    const r = validateField('abc123', [
      { type: 'customPattern', customRegex: '^[a-z]+\\d+$', message: '格式错误' },
    ])
    expect(r.valid).toBe(true)
  })

  it('不匹配自定义正则 → 不通过', () => {
    const r = validateField('123abc', [
      { type: 'customPattern', customRegex: '^[a-z]+\\d+$', message: '格式错误' },
    ])
    expect(r.valid).toBe(false)
  })

  it('空值 → 跳过 customPattern', () => {
    const r = validateField('', [{ type: 'customPattern', customRegex: '.*' }])
    expect(r.valid).toBe(true)
  })

  it('非法正则表达式 → 返回配置错误信息，而非崩溃', () => {
    const r = validateField('test', [
      { type: 'customPattern', customRegex: '[invalid(regex', message: '格式错误' },
    ])
    expect(r.valid).toBe(false)
    expect(r.errors[0]).toContain('正则表达式配置错误')
  })
})

// ==================== min / max ====================
describe('min / max 数值范围校验', () => {
  it('大于最小值 → 通过', () => {
    const r = validateField('10', [{ type: 'min', value: 5, message: '不能小于 5' }])
    expect(r.valid).toBe(true)
  })

  it('等于最小值 → 通过', () => {
    const r = validateField('5', [{ type: 'min', value: 5 }])
    expect(r.valid).toBe(true)
  })

  it('小于最小值 → 不通过', () => {
    const r = validateField('3', [{ type: 'min', value: 5, message: '不能小于 5' }])
    expect(r.valid).toBe(false)
    expect(r.errors).toContain('不能小于 5')
  })

  it('非数字值 → min 不通过', () => {
    const r = validateField('abc', [{ type: 'min', value: 5 }])
    expect(r.valid).toBe(false)
  })

  it('小于最大值 → 通过', () => {
    const r = validateField('8', [{ type: 'max', value: 10 }])
    expect(r.valid).toBe(true)
  })

  it('大于最大值 → 不通过', () => {
    const r = validateField('15', [{ type: 'max', value: 10, message: '不能大于 10' }])
    expect(r.valid).toBe(false)
  })
})

// ==================== minLength / maxLength ====================
describe('minLength / maxLength 长度校验', () => {
  it('满足最小长度 → 通过', () => {
    const r = validateField('hello', [{ type: 'minLength', value: 3 }])
    expect(r.valid).toBe(true)
  })

  it('不满足最小长度 → 不通过', () => {
    const r = validateField('hi', [{ type: 'minLength', value: 3, message: '最少 3 个字符' }])
    expect(r.valid).toBe(false)
    expect(r.errors).toContain('最少 3 个字符')
  })

  it('等于最大长度 → 通过', () => {
    const r = validateField('abc', [{ type: 'maxLength', value: 3 }])
    expect(r.valid).toBe(true)
  })

  it('超过最大长度 → 不通过', () => {
    const r = validateField('abcdef', [{ type: 'maxLength', value: 3 }])
    expect(r.valid).toBe(false)
  })
})

// ==================== 组合校验 ====================
describe('多规则组合', () => {
  it('全部通过 → valid 为 true，errors 为空', () => {
    const r = validateField('13800138000', [
      { type: 'required', message: '必填' },
      { type: 'pattern', pattern: 'phone', message: '格式错误' },
    ])
    expect(r.valid).toBe(true)
    expect(r.errors).toEqual([])
  })

  it('一条不通过 → valid 为 false，收集所有 errors', () => {
    const r = validateField('', [
      { type: 'required', message: '必填' },
      { type: 'pattern', pattern: 'phone', message: '格式错误' },
    ])
    expect(r.valid).toBe(false)
    expect(r.errors.length).toBe(1)
  })

  it('两条都不通过 → 收集两条 error', () => {
    const r = validateField('abc', [
      { type: 'pattern', pattern: 'phone', message: '格式错误' },
      { type: 'min', value: 10, message: '不能小于 10' },
    ])
    expect(r.valid).toBe(false)
    expect(r.errors.length).toBe(2)
  })
})

// ==================== validateForm 批量 ====================
describe('validateForm 批量校验', () => {
  it('批量校验多个字段 → 返回每个字段的结果', () => {
    const results = validateForm([
      { id: 'name', value: '', rules: [{ type: 'required', message: '姓名必填' }] },
      { id: 'phone', value: '13800138000', rules: [{ type: 'pattern', pattern: 'phone' }] },
    ])
    expect(results.get('name')!.valid).toBe(false)
    expect(results.get('phone')!.valid).toBe(true)
  })
})
