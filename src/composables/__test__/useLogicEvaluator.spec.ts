import { describe, it, expect } from 'vitest'
import { useLogicEvaluator } from '@/composables/useLogicEvaluator'
import type { LogicRule } from '@/types'

const { isVisible, computeHiddenIds } = useLogicEvaluator()

// ==================== 边界 ====================
describe('边界条件', () => {
  it('无规则 → 可见', () => {
    expect(isVisible(undefined, {})).toBe(true)
    expect(isVisible([], {})).toBe(true)
  })

  it('规则 conditions 为空数组 → 可见', () => {
    const rules: LogicRule[] = [{ mode: 'and', conditions: [], action: 'hide' }]
    expect(isVisible(rules, {})).toBe(true)
  })

  it('sourceId 不存在 → 按空值处理', () => {
    const rules: LogicRule[] = [
      {
        mode: 'and',
        conditions: [{ sourceId: 'nonexistent', operator: 'isEmpty' }],
        action: 'hide',
      },
    ]
    expect(isVisible(rules, {})).toBe(false)
  })
})

// ==================== isEmpty / isNotEmpty ====================
describe('isEmpty / isNotEmpty', () => {
  it('源字段为空 → isEmpty 触发', () => {
    const rules: LogicRule[] = [
      { mode: 'and', conditions: [{ sourceId: 'name', operator: 'isEmpty' }], action: 'hide' },
    ]
    expect(isVisible(rules, { name: '' })).toBe(false)
  })

  it('源字段有值 → isEmpty 不触发', () => {
    const rules: LogicRule[] = [
      { mode: 'and', conditions: [{ sourceId: 'name', operator: 'isEmpty' }], action: 'hide' },
    ]
    expect(isVisible(rules, { name: '张三' })).toBe(true)
  })

  it('源字段有值 → isNotEmpty 触发', () => {
    const rules: LogicRule[] = [
      { mode: 'and', conditions: [{ sourceId: 'name', operator: 'isNotEmpty' }], action: 'show' },
    ]
    expect(isVisible(rules, { name: '张三' })).toBe(true)
  })

  it('源字段为空 → isNotEmpty 不触发，默认可见', () => {
    const rules: LogicRule[] = [
      { mode: 'and', conditions: [{ sourceId: 'name', operator: 'isNotEmpty' }], action: 'show' },
    ]
    expect(isVisible(rules, { name: '' })).toBe(true)
  })
})

// ==================== eq / neq ====================
describe('eq / neq', () => {
  it('值相等 → eq 触发', () => {
    const rules: LogicRule[] = [
      {
        mode: 'and',
        conditions: [{ sourceId: 'gender', operator: 'eq', value: '男' }],
        action: 'show',
      },
    ]
    expect(isVisible(rules, { gender: '男' })).toBe(true)
  })

  it('值不等 → eq 不触发', () => {
    const rules: LogicRule[] = [
      {
        mode: 'and',
        conditions: [{ sourceId: 'gender', operator: 'eq', value: '男' }],
        action: 'show',
      },
    ]
    expect(isVisible(rules, { gender: '女' })).toBe(true) // 默认可见
  })

  it('值不等 → neq 触发', () => {
    const rules: LogicRule[] = [
      {
        mode: 'and',
        conditions: [{ sourceId: 'gender', operator: 'neq', value: '男' }],
        action: 'hide',
      },
    ]
    expect(isVisible(rules, { gender: '女' })).toBe(false)
  })
})

// ==================== contains / not_contains ====================
describe('contains / not_contains', () => {
  it('包含子串 → contains 触发', () => {
    const rules: LogicRule[] = [
      {
        mode: 'and',
        conditions: [{ sourceId: 'city', operator: 'contains', value: '北京' }],
        action: 'show',
      },
    ]
    expect(isVisible(rules, { city: '北京市海淀区' })).toBe(true)
  })

  it('不包含子串 → contains 不触发', () => {
    const rules: LogicRule[] = [
      {
        mode: 'and',
        conditions: [{ sourceId: 'city', operator: 'contains', value: '北京' }],
        action: 'show',
      },
    ]
    expect(isVisible(rules, { city: '上海' })).toBe(true)
  })

  it('包含子串 → not_contains 不触发', () => {
    const rules: LogicRule[] = [
      {
        mode: 'and',
        conditions: [{ sourceId: 'city', operator: 'not_contains', value: '北京' }],
        action: 'hide',
      },
    ]
    expect(isVisible(rules, { city: '上海' })).toBe(false)
  })
})

// ==================== 数值比较 ====================
describe('gt / lt / gte / lte', () => {
  it('5 > 3 → gt 触发', () => {
    const rules: LogicRule[] = [
      {
        mode: 'and',
        conditions: [{ sourceId: 'score', operator: 'gt', value: 3 }],
        action: 'show',
      },
    ]
    expect(isVisible(rules, { score: '5' })).toBe(true)
  })

  it('3 > 5 → gt 不触发', () => {
    const rules: LogicRule[] = [
      {
        mode: 'and',
        conditions: [{ sourceId: 'score', operator: 'gt', value: 5 }],
        action: 'show',
      },
    ]
    expect(isVisible(rules, { score: '3' })).toBe(true)
  })

  it('源值非数字 → gt 不触发', () => {
    const rules: LogicRule[] = [
      {
        mode: 'and',
        conditions: [{ sourceId: 'score', operator: 'gt', value: 3 }],
        action: 'show',
      },
    ]
    expect(isVisible(rules, { score: 'abc' })).toBe(true)
  })

  it('5 >= 5 → gte 触发', () => {
    const rules: LogicRule[] = [
      {
        mode: 'and',
        conditions: [{ sourceId: 'score', operator: 'gte', value: 5 }],
        action: 'show',
      },
    ]
    expect(isVisible(rules, { score: '5' })).toBe(true)
  })

  it('3 < 5 → lt 触发', () => {
    const rules: LogicRule[] = [
      {
        mode: 'and',
        conditions: [{ sourceId: 'score', operator: 'lt', value: 5 }],
        action: 'show',
      },
    ]
    expect(isVisible(rules, { score: '3' })).toBe(true)
  })

  it('3 <= 3 → lte 触发', () => {
    const rules: LogicRule[] = [
      {
        mode: 'and',
        conditions: [{ sourceId: 'score', operator: 'lte', value: 3 }],
        action: 'show',
      },
    ]
    expect(isVisible(rules, { score: '3' })).toBe(true)
  })
})

// ==================== AND / OR 模式 ====================
describe('AND / OR 组合', () => {
  it('AND 全满足 → 触发', () => {
    const rules: LogicRule[] = [
      {
        mode: 'and',
        conditions: [
          { sourceId: 'a', operator: 'eq', value: '1' },
          { sourceId: 'b', operator: 'eq', value: '2' },
        ],
        action: 'hide',
      },
    ]
    expect(isVisible(rules, { a: '1', b: '2' })).toBe(false)
  })

  it('AND 一个不满足 → 不触发', () => {
    const rules: LogicRule[] = [
      {
        mode: 'and',
        conditions: [
          { sourceId: 'a', operator: 'eq', value: '1' },
          { sourceId: 'b', operator: 'eq', value: '2' },
        ],
        action: 'hide',
      },
    ]
    expect(isVisible(rules, { a: '1', b: 'x' })).toBe(true)
  })

  it('OR 一个满足 → 触发', () => {
    const rules: LogicRule[] = [
      {
        mode: 'or',
        conditions: [
          { sourceId: 'a', operator: 'eq', value: '1' },
          { sourceId: 'b', operator: 'eq', value: '2' },
        ],
        action: 'hide',
      },
    ]
    expect(isVisible(rules, { a: '1', b: 'x' })).toBe(false)
  })

  it('OR 全不满足 → 不触发', () => {
    const rules: LogicRule[] = [
      {
        mode: 'or',
        conditions: [
          { sourceId: 'a', operator: 'eq', value: '1' },
          { sourceId: 'b', operator: 'eq', value: '2' },
        ],
        action: 'hide',
      },
    ]
    expect(isVisible(rules, { a: 'x', b: 'y' })).toBe(true)
  })
})

// ==================== action 方向 ====================
describe('action 方向', () => {
  it('show 触发 → 字段可见', () => {
    const rules: LogicRule[] = [
      { mode: 'and', conditions: [{ sourceId: 'x', operator: 'eq', value: '1' }], action: 'show' },
    ]
    expect(isVisible(rules, { x: '1' })).toBe(true)
    expect(isVisible(rules, { x: '2' })).toBe(true) // 不触发 → 默认可见
  })

  it('hide 触发 → 字段不可见', () => {
    const rules: LogicRule[] = [
      { mode: 'and', conditions: [{ sourceId: 'x', operator: 'eq', value: '1' }], action: 'hide' },
    ]
    expect(isVisible(rules, { x: '1' })).toBe(false)
    expect(isVisible(rules, { x: '2' })).toBe(true)
  })
})

// ==================== computeHiddenIds ====================
describe('computeHiddenIds 批量计算', () => {
  it('返回所有应该隐藏的字段 id 集合', () => {
    const fields = [
      { id: 'name', logic: undefined },
      {
        id: 'phone',
        logic: [
          {
            mode: 'and' as const,
            conditions: [{ sourceId: 'name', operator: 'isEmpty' as const }],
            action: 'hide' as const,
          },
        ],
      },
      {
        id: 'email',
        logic: [
          {
            mode: 'and' as const,
            conditions: [{ sourceId: 'name', operator: 'isEmpty' as const }],
            action: 'hide' as const,
          },
        ],
      },
    ]
    const hidden = computeHiddenIds(fields, { name: '' })
    expect(hidden.has('phone')).toBe(true)
    expect(hidden.has('email')).toBe(true)
    expect(hidden.has('name')).toBe(false)
  })
})
