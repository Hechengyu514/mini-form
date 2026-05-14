import type { Component } from 'vue'
import type { ComponentConfig } from '@/types'

export type ComponentCategory = 'basic' | 'info' | 'advanced' | 'layout' | 'choice'

/** 单个组件的注册定义 */
export interface PluginComponentDef {
  type: string
  name: string
  icon: string
  category: ComponentCategory
  /** 异步加载 .vue 组件，画布渲染时按需请求 */
  component: () => Promise<Component>
  defaultConfig: Partial<ComponentConfig>
  /** 组件行为标记，编辑器据此区分值收集、校验、布局等差异 */
  meta?: {
    isDisplay?: boolean
    isLayout?: boolean
    skipValidation?: boolean
    hasPlaceholder?: boolean
    hasDescription?: boolean
    hasOptions?: boolean
    hasMatrix?: boolean
  }
}

/** 插件：一组组件定义的集合，通过 PluginManager.install() 批量注册 */
export interface FormPlugin {
  name: string
  components: PluginComponentDef[]
}
