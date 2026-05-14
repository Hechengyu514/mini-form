/**
 * 应用入口
 *
 * 初始化 Vue 实例、全局插件（Pinia / Router / Ant Design Vue），
 * 注册内置表单组件后挂载到 #app。
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'

import App from './App.vue'
import router from './router'

import 'ant-design-vue/dist/reset.css'
import './assets/styles/global.css'

import { pluginManager } from './plugins'
import { builtinPlugin } from './components/form/registry'

pluginManager.install(builtinPlugin)

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Antd)

app.mount('#app')
