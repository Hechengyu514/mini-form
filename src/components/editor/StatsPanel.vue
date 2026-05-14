<script setup lang="ts">
/**
 * 数据统计面板 — 使用 ECharts 展示提交数据的饼图、柱状图与评分分布
 */
import { computed, ref, onMounted, onUnmounted, nextTick, type ComponentPublicInstance } from 'vue'
import * as echarts from 'echarts'
import { useEditorStore, useSubmissionStore } from '@/stores'
import { analyzeStats } from '@/composables/useFormStats'

defineProps<{ visible: boolean }>()

const store = useEditorStore()
const submissionStore = useSubmissionStore()

const stats = computed(() => {
  if (submissionStore.submissions.length === 0) return []
  const aggregated: Record<string, unknown[]> = {}
  for (const sub of submissionStore.submissions) {
    for (const [id, value] of Object.entries(sub)) {
      if (!aggregated[id]) aggregated[id] = []
      aggregated[id]!.push(value)
    }
  }
  return analyzeStats(store.compList, aggregated)
})

const chartRefs = ref<Map<string, HTMLDivElement | null>>(new Map())
const chartInstances = new Map<string, echarts.ECharts>()

onMounted(() => {
  nextTick(() => renderCharts())
})

onUnmounted(() => {
  chartInstances.forEach((instance) => instance.dispose())
  chartInstances.clear()
})

function renderCharts() {
  chartRefs.value.forEach((el, id) => {
    if (!el) return
    const stat = stats.value.find((s) => s.title && store.compList.find((c) => c.id === id && c.title === s.title))
    if (!stat) return

    let option: echarts.EChartsOption | null = null

    if (stat.distribution) {
      option = {
        tooltip: { trigger: 'item' },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          data: stat.distribution.map((d) => ({ name: d.label, value: d.count })),
          label: { show: true, formatter: '{b}: {c}' },
        }],
      }
    } else if (stat.checkboxCounts) {
      const data = stat.checkboxCounts.filter((d) => d.count > 0)
      option = {
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: data.map((d) => d.label), axisLabel: { rotate: 30 } },
        yAxis: { type: 'value', minInterval: 1 },
        series: [{ type: 'bar', data: data.map((d) => d.count), itemStyle: { color: '#1677ff' } }],
      }
    } else if (stat.numericDistribution) {
      option = {
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: stat.numericDistribution.map((d) => d.score) },
        yAxis: { type: 'value', minInterval: 1 },
        series: [{ type: 'bar', data: stat.numericDistribution.map((d) => d.count), itemStyle: { color: '#52c41a' } }],
      }
    }

    if (option) {
      const existing = chartInstances.get(id)
      if (existing) existing.dispose()
      const chart = echarts.init(el)
      chartInstances.set(id, chart)
      chart.setOption(option)
    }
  })
}

function setChartRef(id: string) {
  return (el: Element | ComponentPublicInstance | null) => {
    const div = (el instanceof HTMLDivElement ? el : null)
    chartRefs.value.set(id, div)
    if (div) {
      setTimeout(() => renderCharts(), 0)
    }
  }
}
</script>

<template>
  <div v-if="visible && submissionStore.submissions.length > 0" class="stats-panel">
    <div class="stats-header">
      <h3>数据统计</h3>
      <span class="stats-count">共 {{ submissionStore.submissions.length }} 份提交</span>
    </div>

    <div
      v-for="stat in stats"
      :key="stat.title"
      class="stats-card"
    >
      <h4 class="stats-card__title">{{ stat.title }}</h4>

      <!-- 饼图：单选/下拉 -->
      <div v-if="stat.distribution" class="stats-chart-wrap">
        <div :ref="setChartRef(stat.title)" class="stats-chart"></div>
      </div>

      <!-- 柱状图：多选 / 矩阵 -->
      <div v-else-if="stat.checkboxCounts" class="stats-chart-wrap">
        <div :ref="setChartRef(stat.title)" class="stats-chart"></div>
      </div>

      <!-- 评分 / NPS -->
      <div v-else-if="stat.average !== undefined && stat.numericDistribution" class="stats-chart-wrap">
        <div class="stats-avg">
          <span class="stats-avg__num">{{ stat.average }}</span>
          <span class="stats-avg__label">平均分</span>
        </div>
        <div :ref="setChartRef(stat.title)" class="stats-chart stats-chart--sm"></div>
      </div>

      <!-- 文本回复列表 -->
      <div v-else-if="stat.responses && stat.responses.length > 0" class="stats-responses">
        <div v-for="(r, i) in stat.responses" :key="i" class="stats-response-item">
          <span class="stats-response-idx">#{{ i + 1 }}</span>
          <span class="stats-response-text">{{ r }}</span>
        </div>
      </div>

      <!-- 无数据 -->
      <div v-else class="stats-empty">暂无数据</div>
    </div>
  </div>
  <div v-else-if="visible && submissionStore.submissions.length === 0" class="stats-empty-hint">
    提交数据后将在此展示统计图表
  </div>
</template>

<style scoped>
.stats-panel {
  padding: 8px 0;
}
.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.stats-header h3 {
  margin: 0;
  font-size: 16px;
}
.stats-count {
  font-size: 13px;
  color: #888;
}
.stats-card {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}
.stats-card__title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
}
.stats-chart-wrap {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
.stats-chart {
  width: 100%;
  height: 220px;
}
.stats-chart--sm {
  flex: 1;
  height: 180px;
}
.stats-avg {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 72px;
  padding: 12px 0;
}
.stats-avg__num {
  font-size: 32px;
  font-weight: 700;
  color: #1677ff;
}
.stats-avg__label {
  font-size: 11px;
  color: #888;
}
.stats-responses {
  max-height: 200px;
  overflow-y: auto;
}
.stats-response-item {
  display: flex;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}
.stats-response-idx {
  color: #888;
  flex-shrink: 0;
}
.stats-response-text {
  color: #333;
  word-break: break-all;
}
.stats-empty {
  text-align: center;
  color: #bbb;
  font-size: 13px;
  padding: 20px 0;
}
.stats-empty-hint {
  text-align: center;
  color: #bbb;
  font-size: 13px;
  padding: 40px 0;
}
</style>
