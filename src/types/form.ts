/** 单条校验规则 */
export interface ValidationRule {
  type: 'required' | 'pattern' | 'customPattern' | 'min' | 'max' | 'minLength' | 'maxLength'
  message?: string
  /** 内置正则名：phone | email | idCard | url | number | telephone */
  pattern?: string
  /** 自定义正则表达式字符串 */
  customRegex?: string
  /** 阈值，用于 min / max / minLength / maxLength */
  value?: number
}

/** 选项条目，用于 Radio / Checkbox / Select */
export interface OptionItem {
  id: string
  label: string
  value: string
}

/** 显隐逻辑运算符 */
export type ShowOrHideLogicOperator =
  | 'eq' | 'neq' | 'contains' | 'not_contains'
  | 'isEmpty' | 'isNotEmpty'
  | 'gt' | 'lt' | 'gte' | 'lte'

/** 单条显隐条件 */
export interface LogicCondition {
  sourceId: string
  operator: ShowOrHideLogicOperator
  /** 判空类运算符可省略 */
  value?: string | number
}

/** 显隐规则：多条件按 and / or 组合，命中后执行 show / hide */
export interface LogicRule {
  mode: 'and' | 'or'
  conditions: LogicCondition[]
  action: 'show' | 'hide'
}

/** 单个表单字段的完整配置，贯穿编辑器 Store → 画布 → 属性面板 → JSON 导出 */
export interface ComponentConfig {
  id: string
  type: string
  title: string
  description?: string
  placeholder?: string
  defaultValue?: string | number | boolean | string[]
  required?: boolean
  validation?: ValidationRule[]
  logic?: LogicRule[]
  options?: OptionItem[]
  matrixRows?: { id: string; label: string }[]
  matrixColumns?: { id: string; label: string }[]
  matrixMode?: 'radio' | 'checkbox'
  layout?: 'vertical' | 'horizontal'
  children?: ComponentConfig[]
  colSpan?: number
  /** 透传给渲染组件的扩展属性 */
  props?: Record<string, unknown>
}

/** 表单全局设置 */
export interface FormSettings {
  title: string
  description?: string
  successMessage?: string
  showSubmitButton: boolean
  showSerialNumber: boolean
  watermark?: string
  status?: 'draft' | 'completed'
}

/** 表单完整配置的导入导出格式 */
export interface FormConfig {
  id: string
  title: string
  components: ComponentConfig[]
  settings: FormSettings
}
