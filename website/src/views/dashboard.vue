<template>
  <div class="dashboard-container">
    <div class="page-header">
      <h2>数据看板</h2>
    </div>

    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>知识库总量</span>
              <el-icon><Collection /></el-icon>
            </div>
          </template>
          <div class="card-content">
            <div class="number">{{ stats.knowledgeCount }}</div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>问答总量</span>
              <el-icon><ChatLineRound /></el-icon>
            </div>
          </template>
          <div class="card-content">
            <div class="number">{{ stats.chatCount }}</div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>用户总数</span>
              <el-icon><User /></el-icon>
            </div>
          </template>
          <div class="card-content">
            <div class="number">{{ stats.userCount }}</div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>反馈总数</span>
              <el-icon><ChatDotRound /></el-icon>
            </div>
          </template>
          <div class="card-content">
            <div class="number">{{ stats.feedbackCount }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>问答趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="chatTrendChart" style="width: 100%; height: 300px"></div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>知识库分布</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="knowledgeDistributionChart" style="width: 100%; height: 300px"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>用户反馈统计</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="feedbackAnalysisChart" style="width: 100%; height: 300px"></div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>问答关键词</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="wordCloudChart" style="width: 100%; height: 300px"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 热门问题区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>热门问题 TOP5</span>
            </div>
          </template>
          <div class="hot-questions-container">
            <div v-for="(item, index) in stats.hotQuestions" :key="index" class="hot-question-item">
              <div class="rank-badge">{{ index + 1 }}</div>
              <div class="question-content">
                <div class="question-text">{{ item.question }}</div>
                <div class="question-count">
                  <el-icon><User /></el-icon>
                  <span>{{ item.count }}次提问</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Collection, ChatLineRound, ChatDotRound, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import 'echarts-wordcloud'
import { getStats } from '@/api/admin'

interface Stats {
  knowledgeCount: number
  chatCount: number
  userCount: number
  feedbackCount: number
  chatTrends: Array<{ day: string; count: number }>
  knowledgeDistribution: Array<{ name: string; value: number }>
  feedbackAnalysis: Array<{ name: string; value: number }>
  chatKeywords: Array<{ name: string; value: number }>
  hotQuestions: Array<{ question: string; count: number }>
}

const stats = ref<Stats>({
  knowledgeCount: 0,
  chatCount: 0,
  userCount: 0,
  feedbackCount: 0,
  chatTrends: [],
  knowledgeDistribution: [],
  feedbackAnalysis: [],
  chatKeywords: [],
  hotQuestions: []
})

const chatTrendChart = ref<HTMLElement | null>(null)
const knowledgeDistributionChart = ref<HTMLElement | null>(null)
const feedbackAnalysisChart = ref<HTMLElement | null>(null)
const wordCloudChart = ref<HTMLElement | null>(null)

const fetchStats = async () => {
  try {
    const response = await getStats()
    stats.value = response
    initCharts()
    initWordCloudChart()
  } catch (error) {
    ElMessage.error('获取统计数据失败')
  }
}

const initCharts = () => {
  initChatTrendChart()
  initKnowledgeDistributionChart()
  initFeedbackAnalysisChart()
}

const initChatTrendChart = () => {
  if (!chatTrendChart.value) return
  const chart = echarts.init(chatTrendChart.value)
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params: any[]) => {
        const date = params[0].name
        const count = params[0].value
        return `${date}<br/>问答数量: ${count}`
      }
    },
    xAxis: {
      type: 'category',
      data: stats.value.chatTrends.map(item => item.day),
      axisLabel: {
        formatter: (value: string) => {
          const [year, month, day] = value.split('-')
          return `${month}-${day}`
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '问答数量'
    },
    series: [{
      data: stats.value.chatTrends.map(item => item.count),
      type: 'line',
      smooth: true,
      areaStyle: {
        opacity: 0.1
      }
    }]
  })
}

const initKnowledgeDistributionChart = () => {
  if (!knowledgeDistributionChart.value) return
  const chart = echarts.init(knowledgeDistributionChart.value)
  chart.setOption({
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [{
      type: 'pie',
      radius: '50%',
      data: stats.value.knowledgeDistribution,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  })
}

const initFeedbackAnalysisChart = () => {
  if (!feedbackAnalysisChart.value) return
  const chart = echarts.init(feedbackAnalysisChart.value)
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: stats.value.feedbackAnalysis.map(item => {
        const typeMap: Record<string, string> = {
          'feature': '功能建议',
          'bug': '问题反馈',
          'other': '其他'
        }
        return typeMap[item.name] || item.name
      })
    },
    yAxis: {
      type: 'value',
      name: '数量'
    },
    series: [{
      data: stats.value.feedbackAnalysis.map(item => item.value),
      type: 'bar',
      itemStyle: {
        color: '#409eff'
      }
    }]
  })
}

const initWordCloudChart = () => {
  if (!wordCloudChart.value) return
  const chart = echarts.init(wordCloudChart.value)
  chart.setOption({
    tooltip: {
      show: true
    },
    series: [{
      type: 'wordCloud',
      shape: 'circle',
      left: 'center',
      top: 'center',
      width: '90%',
      height: '90%',
      right: null,
      bottom: null,
      sizeRange: [12, 60],
      rotationRange: [-90, 90],
      rotationStep: 45,
      gridSize: 8,
      drawOutOfBound: false,
      textStyle: {
        fontFamily: 'sans-serif',
        fontWeight: 'bold',
        color: function () {
          return 'rgb(' + [
            Math.round(Math.random() * 160),
            Math.round(Math.random() * 160),
            Math.round(Math.random() * 160)
          ].join(',') + ')';
        }
      },
      emphasis: {
        focus: 'self',
        textStyle: {
          shadowBlur: 10,
          shadowColor: '#333'
        }
      },
      data: stats.value.chatKeywords
    }]
  })
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.stat-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-content {
  text-align: center;
}

.number {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  height: 100%;
}

.chart-container {
  padding: 20px;
}

.hot-questions-container {
  padding: 20px;
}

.hot-question-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.3s ease;
}

.hot-question-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.rank-badge {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 16px;
  flex-shrink: 0;
}

.question-content {
  flex: 1;
}

.question-text {
  font-size: 16px;
  color: #303133;
  margin-bottom: 8px;
  line-height: 1.5;
}

.question-count {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #909399;
}

.question-count .el-icon {
  margin-right: 4px;
}
</style> 