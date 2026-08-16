<template>
    <div class="dashboard">
        <h2 class="page-title">后台首页</h2>

        <!-- 第一行：核心统计卡片 -->
        <el-row :gutter="20" class="stat-cards">
            <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-icon" style="background: #ecf5ff; color: #409eff;">
                        <el-icon :size="28"><Document /></el-icon>
                    </div>
                    <div class="stat-body">
                        <div class="stat-label">支付订单</div>
                        <div class="stat-value">{{ stats.payOrderCount }}</div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-icon" style="background: #fdf6ec; color: #e6a23c;">
                        <el-icon :size="28"><TrendCharts /></el-icon>
                    </div>
                    <div class="stat-body">
                        <div class="stat-label">订单量</div>
                        <div class="stat-value">{{ stats.orderCount }}</div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-icon" style="background: #f0f9eb; color: #67c23a;">
                        <el-icon :size="28"><Money /></el-icon>
                    </div>
                    <div class="stat-body">
                        <div class="stat-label">销售额</div>
                        <div class="stat-value">{{ stats.salesAmount }}</div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-icon" style="background: #fef0f0; color: #f56c6c;">
                        <el-icon :size="28"><User /></el-icon>
                    </div>
                    <div class="stat-body">
                        <div class="stat-label">新增用户</div>
                        <div class="stat-value">{{ stats.newUserCount }}</div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 第二行：商品/分类/团购简要统计 -->
        <el-row :gutter="20" class="stat-cards" style="margin-top: 0">
            <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-icon" style="background: #fdf3ff; color: #9b59b6;">
                        <el-icon :size="28"><Goods /></el-icon>
                    </div>
                    <div class="stat-body">
                        <div class="stat-label">商品总数</div>
                        <div class="stat-value">{{ stats.goodsCount }}</div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-icon" style="background: #ecf5ff; color: #409eff;">
                        <el-icon :size="28"><List /></el-icon>
                    </div>
                    <div class="stat-body">
                        <div class="stat-label">分类数量</div>
                        <div class="stat-value">{{ stats.categoryCount }}</div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-icon" style="background: #f0f9ff; color: #13ce66;">
                        <el-icon :size="28"><ShoppingCart /></el-icon>
                    </div>
                    <div class="stat-body">
                        <div class="stat-label">进行中的团购</div>
                        <div class="stat-value">{{ stats.grouponActiveCount }}</div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-icon" style="background: #fef0f0; color: #f56c6c;">
                        <el-icon :size="28"><Ticket /></el-icon>
                    </div>
                    <div class="stat-body">
                        <div class="stat-label">优惠券数量</div>
                        <div class="stat-value">{{ stats.couponCount }}</div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 快捷操作 -->
        <el-card class="quick-links" shadow="never">
            <template #header>
                <span>快捷操作</span>
            </template>
            <el-space wrap>
                <el-button type="primary" @click="$router.push('/goods/list')">
                    <el-icon><Goods /></el-icon> 商品管理
                </el-button>
                <el-button type="success" @click="$router.push('/category/list')">
                    <el-icon><List /></el-icon> 分类管理
                </el-button>
                <el-button type="warning" @click="$router.push('/order/list')">
                    <el-icon><Document /></el-icon> 订单管理
                </el-button>
                <el-button type="info" @click="$router.push('/user/list')">
                    <el-icon><User /></el-icon> 用户管理
                </el-button>
                <el-button type="danger" @click="$router.push('/groupon/list')">
                    <el-icon><ShoppingCart /></el-icon> 团购管理
                </el-button>
                <el-button type="warning" @click="$router.push('/coupon/list')">
                    <el-icon><Ticket /></el-icon> 优惠券
                </el-button>
            </el-space>
        </el-card>
    </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import {
    Goods, List, User, ShoppingCart, Document,
    Money, Ticket, TrendCharts
} from '@element-plus/icons-vue'
import { getCategoryTree } from '~/api/category'
import { getGrouponList } from '~/api/groupon'
import { getCouponList } from '~/api/coupon'
import axios from '~/axios'

const stats = reactive({
    payOrderCount: '-',
    orderCount: '-',
    salesAmount: '-',
    newUserCount: '-',
    goodsCount: '-',
    categoryCount: 0,
    grouponActiveCount: 0,
    couponCount: 0,
})

async function loadStats() {
    try {
        // 分类数量
        const tree = await getCategoryTree()
        function countCategory(nodes) {
            let count = 0
            for (const node of nodes) {
                count += 1
                if (node.children && node.children.length > 0) {
                    count += countCategory(node.children)
                }
            }
            return count
        }
        stats.categoryCount = countCategory(tree || [])

        // 进行中的团购
        try {
            const grouponRes = await getGrouponList({ pageNum: 1, pageSize: 1, status: 1 })
            stats.grouponActiveCount = grouponRes.totalCount || 0
        } catch {
            stats.grouponActiveCount = '-'
        }

        // 优惠券数量
        try {
            const couponRes = await getCouponList({ pageNum: 1, pageSize: 1 })
            stats.couponCount = couponRes.totalCount || 0
        } catch {
            stats.couponCount = '-'
        }

        // 后台统计接口（如果后端有）
        try {
            const dashboardRes = await axios.get('/mall/v1/admin/dashboard/stats')
            if (dashboardRes) {
                stats.payOrderCount = dashboardRes.payOrderCount ?? '-'
                stats.orderCount = dashboardRes.orderCount ?? '-'
                stats.salesAmount = dashboardRes.salesAmount != null
                    ? `¥${((dashboardRes.salesAmount || 0) / 100).toFixed(2)}`
                    : '-'
                stats.newUserCount = dashboardRes.newUserCount ?? '-'
                stats.goodsCount = dashboardRes.goodsCount ?? '-'
            }
        } catch {
            // 后端还未提供该接口时，使用占位数据
            stats.payOrderCount = '-'
            stats.orderCount = '-'
            stats.salesAmount = '-'
            stats.newUserCount = '-'
            stats.goodsCount = '-'
        }
    } catch (e) {
        console.error('加载统计数据失败', e)
    }
}

onMounted(() => {
    loadStats()
})
</script>

<style scoped>
.dashboard {
    padding: 0;
}

.page-title {
    font-size: 22px;
    font-weight: 600;
    margin-bottom: 24px;
    color: #303133;
}

.stat-cards {
    margin-bottom: 24px;
}

.stat-card {
    cursor: default;
}

.stat-card :deep(.el-card__body) {
    display: flex;
    align-items: center;
    padding: 18px 20px;
    gap: 16px;
}

.stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.stat-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.stat-label {
    font-size: 13px;
    color: #909399;
}

.stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #303133;
    line-height: 1.2;
}

.quick-links {
    margin-top: 24px;
}
</style>
