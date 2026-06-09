<template>
    <div class="agent-page">
        <el-card class="content-card" shadow="never">
            <!-- 顶部操作栏 -->
            <div class="content-header">
                <div class="header-left">
                    <span class="page-title">分销员管理</span>
                </div>
                <el-form :inline="true" :model="filterForm" class="search-form">
                    <el-form-item label="昵称">
                        <el-input v-model="filterForm.nickname" placeholder="用户昵称" clearable @keyup.enter="handleSearch" />
                    </el-form-item>
                    <el-form-item label="状态">
                        <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 100px">
                            <el-option label="正常" :value="1" />
                            <el-option label="禁用" :value="0" />
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
            </div>

            <!-- 分销员表格 -->
            <el-table :data="tableData" border size="small" style="width: 100%" v-loading="loading">
                <el-table-column label="头像" width="60" align="center">
                    <template #default="scope">
                        <el-avatar :src="scope.row.avatar" :size="36" shape="circle">
                            <el-icon><User /></el-icon>
                        </el-avatar>
                    </template>
                </el-table-column>

                <el-table-column prop="nickname" label="昵称" min-width="120" show-overflow-tooltip />

                <el-table-column label="手机号" prop="phone" width="130" align="center" />

                <el-table-column label="下线人数" width="90" align="center">
                    <template #default="scope">
                        {{ scope.row.subCount || 0 }}
                    </template>
                </el-table-column>

                <el-table-column label="累计佣金" width="120" align="center">
                    <template #default="scope">
                        <span class="price">¥{{ ((scope.row.totalCommission || 0) / 100).toFixed(2) }}</span>
                    </template>
                </el-table-column>

                <el-table-column label="可提现佣金" width="120" align="center">
                    <template #default="scope">
                        <span class="price">¥{{ ((scope.row.availableCommission || 0) / 100).toFixed(2) }}</span>
                    </template>
                </el-table-column>

                <el-table-column label="状态" width="80" align="center">
                    <template #default="scope">
                        <el-tag v-if="scope.row.status !== 0" type="success" size="small">正常</el-tag>
                        <el-tag v-else type="danger" size="small">禁用</el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="加入时间" width="170" align="center">
                    <template #default="scope">
                        {{ scope.row.createTime || scope.row.createdAt || '-' }}
                    </template>
                </el-table-column>

                <el-table-column label="操作" width="200" fixed="right" align="center">
                    <template #default="scope">
                        <el-button type="primary" size="small" link @click="handleView(scope.row)">
                            <el-icon><View /></el-icon> 查看
                        </el-button>
                        <el-button
                            v-if="scope.row.status !== 0"
                            type="warning"
                            size="small"
                            link
                            @click="handleToggleStatus(scope.row)"
                        >
                            <el-icon><CircleClose /></el-icon> 禁用
                        </el-button>
                        <el-button
                            v-else
                            type="success"
                            size="small"
                            link
                            @click="handleToggleStatus(scope.row)"
                        >
                            <el-icon><CircleCheck /></el-icon> 启用
                        </el-button>
                        <el-button type="danger" size="small" link @click="handleDelete(scope.row)">
                            <el-icon><Delete /></el-icon> 删除
                        </el-button>
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
                    size="small"
                    @size-change="handleSearch"
                    @current-change="handleSearch"
                />
            </div>
        </el-card>

        <!-- 分销员详情抽屉 -->
        <el-drawer v-model="drawerVisible" title="分销员详情" size="550px" destroy-on-close>
            <template v-if="currentAgent">
                <div class="agent-detail-header">
                    <el-avatar :src="currentAgent.avatar" :size="64" shape="circle">
                        <el-icon :size="28"><User /></el-icon>
                    </el-avatar>
                    <div class="agent-detail-info">
                        <div class="agent-detail-name">{{ currentAgent.nickname }}</div>
                        <el-tag v-if="currentAgent.status !== 0" type="success" size="small">正常</el-tag>
                        <el-tag v-else type="danger" size="small">禁用</el-tag>
                    </div>
                </div>

                <el-descriptions :column="2" border class="agent-detail-body">
                    <el-descriptions-item label="ID">{{ currentAgent.id }}</el-descriptions-item>
                    <el-descriptions-item label="手机号">{{ currentAgent.phone || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="下线人数">{{ currentAgent.subCount || 0 }}</el-descriptions-item>
                    <el-descriptions-item label="累计佣金">
                        ¥{{ ((currentAgent.totalCommission || 0) / 100).toFixed(2) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="可提现">
                        ¥{{ ((currentAgent.availableCommission || 0) / 100).toFixed(2) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="已提现">
                        ¥{{ ((currentAgent.withdrawnCommission || 0) / 100).toFixed(2) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="加入时间" :span="2">
                        {{ currentAgent.createTime || currentAgent.createdAt || '-' }}
                    </el-descriptions-item>
                </el-descriptions>
            </template>
        </el-drawer>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, User, View, CircleClose, CircleCheck, Delete } from '@element-plus/icons-vue'
import { getAgentList, getAgentDetail, toggleAgentStatus, deleteAgent } from '~/api/agent'
import { toast, showModal } from '~/composables/util'

const loading = ref(false)
const tableData = ref([])

const filterForm = reactive({
    nickname: '',
    status: null,
})

const pager = reactive({
    pageNum: 1,
    pageSize: 10,
    total: 0,
})

async function handleSearch() {
    loading.value = true
    try {
        const params = {
            pageNum: pager.pageNum,
            pageSize: pager.pageSize,
        }
        if (filterForm.nickname) params.nickname = filterForm.nickname
        if (filterForm.status !== null && filterForm.status !== '') params.status = filterForm.status

        const data = await getAgentList(params)
        tableData.value = data.list || data.records || []
        pager.total = data.totalCount || data.total || 0
    } catch (e) {
        console.error('加载分销员列表失败', e)
    } finally {
        loading.value = false
    }
}

function handleReset() {
    filterForm.nickname = ''
    filterForm.status = null
    pager.pageNum = 1
    handleSearch()
}

// 查看详情
const drawerVisible = ref(false)
const currentAgent = ref(null)

async function handleView(row) {
    drawerVisible.value = true
    currentAgent.value = null
    try {
        const data = await getAgentDetail(row.id)
        currentAgent.value = data
    } catch (e) {
        console.error('加载分销员详情失败', e)
    }
}

// 禁用/启用
async function handleToggleStatus(row) {
    const action = row.status === 0 ? '启用' : '禁用'
    const newStatus = row.status === 0 ? 1 : 0
    try {
        await showModal(`确定要${action}该分销员吗？`, 'warning', `${action}确认`)
        await toggleAgentStatus(row.id, newStatus)
        toast(`${action}成功`, 'success')
        handleSearch()
    } catch (e) {
        if (e !== 'cancel') {
            console.error(`${action}失败`, e)
        }
    }
}

// 删除
async function handleDelete(row) {
    try {
        await showModal('确定要删除该分销员吗？此操作不可恢复！', 'error', '删除确认')
        await deleteAgent(row.id)
        toast('删除成功', 'success')
        handleSearch()
    } catch (e) {
        if (e !== 'cancel') {
            console.error('删除失败', e)
        }
    }
}

onMounted(() => {
    handleSearch()
})
</script>

<style scoped>
.agent-page {
    height: calc(100vh - 100px);
    overflow: hidden;
}

.content-card {
    height: 100%;
    border: none;
    display: flex;
    flex-direction: column;
}

.content-card :deep(.el-card__body) {
    padding: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.content-header {
    padding: 12px 16px;
    border-bottom: 1px solid #ebeef5;
    flex-shrink: 0;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
}

.page-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
}

.search-form {
    margin: 0;
}

.search-form :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: 12px;
}

.search-form :deep(.el-form-item:last-child) {
    margin-right: 0;
}

.content-card :deep(.el-table) {
    flex: 1;
}

.content-card :deep(.el-table__body-wrapper) {
    overflow-y: auto;
}

.pagination {
    display: flex;
    justify-content: flex-end;
    padding: 10px 16px;
    border-top: 1px solid #ebeef5;
    flex-shrink: 0;
}

.price {
    color: #f56c6c;
    font-weight: 600;
}

/* 分销员详情 */
.agent-detail-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid #ebeef5;
}

.agent-detail-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.agent-detail-name {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
}
</style>
