import type { FormConfig } from '@/types'

export interface TemplateInfo {
  id: string
  name: string
  description: string
  icon: string
  tags: string[]
  fieldCount: number
  load: () => Promise<FormConfig>
}

export interface CustomTemplate {
  id: string
  name: string
  description: string
  icon: string
  tags: string[]
  fieldCount: number
  config: FormConfig
}

const CUSTOM_TEMPLATES_KEY = 'mini-form-custom-templates'

export function loadCustomTemplates(): CustomTemplate[] {
  try {
    const raw = localStorage.getItem(CUSTOM_TEMPLATES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveCustomTemplates(templates: CustomTemplate[]) {
  localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates))
}

export function deleteCustomTemplate(id: string) {
  const templates = loadCustomTemplates()
  saveCustomTemplates(templates.filter((t) => t.id !== id))
}

export const builtinTemplates: TemplateInfo[] = [
  {
    id: 'contact',
    name: '联系我们',
    description: '包含姓名、邮箱、电话和留言的标准联系表单，适用于企业官网的联系我们页面',
    icon: '✉️',
    tags: ['通用', '商务'],
    fieldCount: 7,
    load: () => import('./contact-form.json').then((m) => (m.default ?? m) as FormConfig),
  },
  {
    id: 'survey',
    name: '问卷调查',
    description: '多项选择、评分和文本组成的调研问卷，适合产品满意度调研',
    icon: '📊',
    tags: ['调研', '数据收集'],
    fieldCount: 6,
    load: () => import('./survey-form.json').then((m) => (m.default ?? m) as FormConfig),
  },
  {
    id: 'registration',
    name: '活动报名',
    description: '包含个人信息、联系方式和偏好的活动报名表单',
    icon: '🎫',
    tags: ['活动', '报名'],
    fieldCount: 8,
    load: () => import('./registration-form.json').then((m) => (m.default ?? m) as FormConfig),
  },
  {
    id: 'feedback',
    name: '用户反馈',
    description: '用于收集用户意见和问题反馈，支持截图上传',
    icon: '💬',
    tags: ['反馈', '体验'],
    fieldCount: 6,
    load: () => import('./feedback-form.json').then((m) => (m.default ?? m) as FormConfig),
  },
  {
    id: 'leave-request',
    name: '请假申请',
    description: '标准的员工请假申请表单，包含日期、类型和审批流程',
    icon: '📝',
    tags: ['办公', 'HR'],
    fieldCount: 9,
    load: () => import('./leave-request.json').then((m) => (m.default ?? m) as FormConfig),
  },
]
