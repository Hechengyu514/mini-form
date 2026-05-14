import type { PluginComponentDef, FormPlugin } from './types'

/**
 * 组件注册与查询中心（全局单例）
 *
 * 组件库面板、画布拖拽、属性面板均通过此管理器获取组件定义。
 */
class PluginManager {
  private registry = new Map<string, PluginComponentDef>()

  register(def: PluginComponentDef): void {
    if (this.registry.has(def.type)) {
      console.warn(`[PluginManager] 组件类型 "${def.type}" 已注册，将被覆盖`)
    }
    this.registry.set(def.type, def)
  }

  install(plugin: FormPlugin): void {
    plugin.components.forEach((c) => this.register(c))
  }

  getByType(type: string): PluginComponentDef | undefined {
    return this.registry.get(type)
  }

  getByCategory(category: string): PluginComponentDef[] {
    return [...this.registry.values()].filter((c) => c.category === category)
  }

  getAll(): PluginComponentDef[] {
    return [...this.registry.values()]
  }

  getCategories(): string[] {
    return [...new Set(this.getAll().map((c) => c.category))]
  }
}

export const pluginManager = new PluginManager()
