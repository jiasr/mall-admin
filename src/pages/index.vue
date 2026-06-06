<template>
    <div class="dashboard">
        <h2 class="page-title">欢迎回来，{{ $store.state.user.username || '管理员' }}</h2>

        <el-row :gutter="20" class="stat-cards">
            <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-icon" style="background: #ecf5ff; color: #409eff;">
                        <el-icon :size="32"><Goods /></el-icon>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">{{ stats.goodsCount }}</div>
                        <div class="stat-label">商品总数</div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-icon" style="background: #fdf6ec; color: #e6a23c;">
                        <el-icon :size="32"><List /></el-icon>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">{{ stats.categoryCount }}</div>
                        <div class="stat-label">分类数量</div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-icon" style="background: #f0f9eb; color: #67c23a;">
                        <el-icon :size="32"><User /></el-icon>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">{{ stats.userCount }}</div>
                        <div class="stat-label">用户总数</div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-icon" style="background: #fef0f0; color: #f56c6c;">
                        <el-icon :size="32"><ShoppingCart /></el-icon>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">{{ stats.orderCount }}</div>
                        <div class="stat-label">订单总数</div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <el-card class="quick-links">
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
                <el-button type="warning">
                    <el-icon><Document /></el-icon> 订单管理
                </el-button>
                <el-button type="info">
                    <el-icon><User /></el-icon> 用户管理
                </el-button>
            </el-space>
        </el-card>
    </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { Goods, List, User, ShoppingCart, Document } from '@element-plus/icons-vue'
import { getCategoryTree } from '~/api/category'
import axios from '~/axios'

const stats = reactive({
    goodsCount: 0,
    categoryCount: 0,
    userCount: 0,
    orderCount: 0,
})

async function loadStats() {
    try {
        const tree = await getCategoryTree()
        // 递归统计分类数量
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

        // 统计商品数
        const goodsRes = await axios.get("/v1/goods/simple-list?pageIndex=1&pageSize=1")
        // 简单获取（如果可以的话）
        stats.goodsCount = '-'
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
    padding: 20px;
    gap: 16px;
}

.stat-icon {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.stat-value {
    font-size: 28px;
    font-weight: 700;
    color: #303133;
    line-height: 1.2;
}

.stat-label {
    font-size: 14px;
    color: #909399;
    margin-top: 4px;
}

.quick-links {
    margin-top: 24px;
}
</style>
