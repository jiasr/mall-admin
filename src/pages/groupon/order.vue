<template>
    <div class="groupon-order-page">
        <!-- 筛选栏 -->
        <el-card class="filter-card" shadow="never">
            <el-form :inline="true" :model="filterForm">
                <el-form-item label="活动名称">
                    <el-input
                        v-model="filterForm.activityName"
                        placeholder="搜索活动名称"
                        clearable
                        @keyup.enter="handleSearch"
                    />
                </el-form-item>
                <el-form-item label="团编号">
                    <el-input
                        v-model="filterForm.groupId"
                        placeholder="搜索团编号"
                        clearable
                        @keyup.enter="handleSearch"
                    />
                </el-form-item>
                <el-form-item label="团状态">
                    <el-select v-model="filterForm.groupStatus" placeholder="全部状态" clearable style="width: 130px">
                        <el-option label="拼团中" :value="0" />
                        <el-option label="已成团" :value="1" />
                        <el-option label="拼团失败" :value="2" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleSearch">
                        <el-icon><Search /></el-icon> 搜索
                    </el-button>
                    <el-button @click="handleReset">
                        <el-icon><Refresh /></el-icon> 重置
                    </el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 团购订单表格 -->
        <el-card class="table-card" shadow="never">
            <el-table :data="tableData" border style="width: 100%" v-loading="loading" @expand-change="handleExpand">
                <el-table-column type="expand">
                    <template #default="scope">
                        <div class="expand-content" v-loading="scope.row._loading">
                            <h4 class="expand-title">参团成员 ({{ scope.row._members ? scope.row._members.length : 0 }} / {{ scope.row.groupSize }})</h4>
                            <el-table :data="scope.row._members || []" border size="small">
                                <el-table-column prop="userId" label="用户ID" width="120" align="center" />
                                <el-table-column prop="userName" label="用户名" min-width="120" />
                                <el-table-column prop="userAvatar" label="头像" width="70" align="center">
                                    <template #default="subScope">
                                        <el-avatar :src="subScope.row.userAvatar" :size="32" />
                                    </template>
                                </el-table-column>
                                <el-table-column label="购买数量" width="80" align="center">
                                    <template #default="subScope">
                                        {{ subScope.row.quantity }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="金额" width="100" align="center">
                                    <template #default="subScope">
                                        <span class="price">¥{{ ((subScope.row.payAmount || 0) / 100).toFixed(2) }}</span>
                                    </template>
                                </el-table-column>
                                <el-table-column label="参团时间" min-width="160">
                                    <template #default="subScope">
                                        {{ subScope.row.joinTime }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="是否团长" width="80" align="center">
                                    <template #default="subScope">
                                        <el-tag v-if="subScope.row.isLeader" type="warning" size="small">团长</el-tag>
                                        <span v-else class="text-muted">成员</span>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="groupId" label="团编号" width="140" align="center" />
                <el-table-column prop="activityName" label="所属活动" min-width="160" show-overflow-tooltip />
                <el-table-column label="团购商品" width="120" show-overflow-tooltip>
                    <template #default="scope">
                        <span>{{ scope.row.goodsTitle }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="团购价" width="100" align="center">
                    <template #default="scope">
                        <span class="price">¥{{ ((scope.row.grouponPrice || 0) / 100).toFixed(2) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="进度" width="130" align="center">
                    <template #default="scope">
                        <div class="progress-info">
                            <span class="progress-num">{{ scope.row.currentSize }} / {{ scope.row.groupSize }}</span>
                            <el-progress
                                :percentage="Math.round((scope.row.currentSize / scope.row.groupSize) * 100)"
                                :stroke-width="6"
                                :color="scope.row.currentSize >= scope.row.groupSize ? '#67c23a' : '#409eff'"
                                :show-text="false"
                            />
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="开团时间" min-width="160">
                    <template #default="scope">
                        <span class="time-text">{{ scope.row.createTime }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="截止时间" min-width="160">
                    <template #default="scope">
                        <span class="time-text">{{ scope.row.expireTime }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="状态" width="90" align="center">
                    <template #default="scope">
                        <el-tag v-if="scope.row.groupStatus === 1" type="success" size="small">已成团</el-tag>
                        <el-tag v-else-if="scope.row.groupStatus === 2" type="danger" size="small">拼团失败</el-tag>
                        <el-tag v-else type="warning" size="small">拼团中</el-tag>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="pagination">
                <el-pagination
                    v-model:current-page="pager.pageNum"
                    v-model:page-size="pager.pageSize"
                    :page-sizes="[10, 20, 50]"
                    :total="pager.total"
                    layout="total, sizes, prev, pager, next, jumper"
                    background
                    @size-change="handleSearch"
                    @current-change="handleSearch"
                />
            </div>
        </el-card>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getGrouponOrderList, getGrouponGroupDetail } from '~/api/groupon'

const tableData = ref([])
const loading = ref(false)

const filterForm = reactive({
    activityName: '',
    groupId: '',
    groupStatus: null,
})

const pager = reactive({
    pageNum: 1,
    pageSize: 10,
    total: 0,
})

// 加载数据
async function fetchData() {
    loading.value = true
    try {
        const params = { pageNum: pager.pageNum, pageSize: pager.pageSize }
        if (filterForm.activityName) params.activityName = filterForm.activityName
        if (filterForm.groupId) params.groupId = filterForm.groupId
        if (filterForm.groupStatus !== null && filterForm.groupStatus !== '') params.groupStatus = filterForm.groupStatus

        const data = await getGrouponOrderList(params)
        tableData.value = (data.list || []).map(item => ({
            ...item,
            _members: null,
            _loading: false,
        }))
        pager.total = data.totalCount || 0
    } catch (e) {
        console.error('获取团购订单列表失败', e)
    } finally {
        loading.value = false
    }
}

function handleSearch() {
    pager.pageNum = 1
    fetchData()
}

function handleReset() {
    filterForm.activityName = ''
    filterForm.groupId = ''
    filterForm.groupStatus = null
    pager.pageNum = 1
    fetchData()
}

// 展开行懒加载成员信息
async function handleExpand(row, expandedRows) {
    const target = expandedRows.find(r => r.groupId === row.groupId)
    if (!target) return
    if (target._members) return // 已加载过

    target._loading = true
    try {
        const data = await getGrouponGroupDetail(target.groupId)
        target._members = data.members || []
    } catch (e) {
        console.error('加载团成员信息失败', e)
        target._members = []
    } finally {
        target._loading = false
    }
}

onMounted(() => {
    fetchData()
})
</script>

<style scoped>
.groupon-order-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.filter-card {
    border: none;
}

.filter-card :deep(.el-card__body) {
    padding-bottom: 0;
}

.table-card {
    border: none;
}

.pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
}

.price {
    color: #f56c6c;
    font-weight: 600;
}

.time-text {
    font-size: 12px;
    color: #606266;
}

.text-muted {
    font-size: 12px;
    color: #c0c4cc;
}

.progress-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.progress-num {
    font-size: 12px;
    color: #606266;
    font-weight: 500;
}

.expand-content {
    padding: 16px 24px;
    background: #fafafa;
}

.expand-title {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #303133;
}
</style>
