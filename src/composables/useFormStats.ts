import type { ComponentConfig } from '@/types'

export interface SubmissionsData {
  [fieldId: string]: unknown[]
}

/** 将提交数据按字段 ID 聚合 */
export function aggregateSubmissions(submissions: Record<string, unknown>[]): SubmissionsData {
  const result: SubmissionsData = {}
  for (const sub of submissions) {
    for (const [id, value] of Object.entries(sub)) {
      if (!result[id]) result[id] = []
      result[id]!.push(value)
    }
  }
  return result
}

export interface FieldStats {
  type: string
  title: string
  distribution?: { label: string; count: number }[]
  checkboxCounts?: { label: string; count: number }[]
  average?: number
  numericDistribution?: { score: number; count: number }[]
  responses?: string[]
}

/** 分析各字段的提交数据，生成统计分布 */
export function analyzeStats(
  comps: ComponentConfig[],
  aggregated: SubmissionsData,
): FieldStats[] {
  return comps
    .filter((c) => {
      if (['divider', 'page-break', 'submit-button', 'signature', 'upload'].includes(c.type)) return false
      return true
    })
    .map((comp) => {
      const values = aggregated[comp.id] ?? []
      const type = comp.type

      if (['radio', 'select'].includes(type)) {
        const options = comp.options ?? []
        const counts = new Map<string, number>()
        options.forEach((o) => counts.set(o.value, 0))
        for (const v of values) {
          const key = String(v ?? '')
          counts.set(key, (counts.get(key) ?? 0) + 1)
        }
        return {
          type,
          title: comp.title,
          distribution: options.map((o) => ({ label: o.label, count: counts.get(o.value) ?? 0 })),
        }
      }

      if (type === 'checkbox') {
        const options = comp.options ?? []
        const counts = new Map<string, number>()
        options.forEach((o) => counts.set(o.value, 0))
        for (const v of values) {
          const arr = Array.isArray(v) ? v : [v]
          for (const item of arr) {
            const key = String(item ?? '')
            counts.set(key, (counts.get(key) ?? 0) + 1)
          }
        }
        return {
          type,
          title: comp.title,
          checkboxCounts: options.map((o) => ({ label: o.label, count: counts.get(o.value) ?? 0 })),
        }
      }

      if (['rate', 'slider', 'nps', 'number'].includes(type)) {
        const nums = values.map(Number).filter((n) => !isNaN(n))
        const avg = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
        const dist = new Map<number, number>()
        const min = type === 'nps' ? 0 : type === 'slider' ? (comp.props?.min as number) ?? 0 : 1
        const max = type === 'nps' ? 10 : type === 'slider' ? (comp.props?.max as number) ?? 100 : 5
        for (let i = min; i <= max; i++) dist.set(i, 0)
        for (const n of nums) {
          const rounded = Math.round(n)
          dist.set(rounded, (dist.get(rounded) ?? 0) + 1)
        }
        return {
          type,
          title: comp.title,
          average: Math.round(avg * 10) / 10,
          numericDistribution: Array.from(dist.entries()).map(([score, count]) => ({ score, count })),
        }
      }

      if (type === 'matrix') {
        const rows = comp.matrixRows ?? []
        const cols = comp.matrixColumns ?? []
        const counts = new Map<string, number>()
        cols.forEach((c) => counts.set(c.label, 0))
        for (const v of values) {
          const rowVals = v as Record<string, string | string[]> | undefined
          if (!rowVals) continue
          for (const rowId of Object.keys(rowVals)) {
            const val = rowVals[rowId]
            const arr = Array.isArray(val) ? val : [val]
            for (const item of arr) {
              const col = cols.find((c) => c.id === item)
              if (col) counts.set(col.label, (counts.get(col.label) ?? 0) + 1)
            }
          }
        }
        return {
          type,
          title: comp.title,
          checkboxCounts: cols.map((c) => ({ label: c.label, count: counts.get(c.label) ?? 0 })),
        }
      }

      return {
        type,
        title: comp.title,
        responses: values.map((v) => {
          if (typeof v === 'object' && v !== null) return JSON.stringify(v)
          return String(v ?? '')
        }).filter((s) => s.length > 0),
      }
    })
}
