<template>
    <div class="groupon-page">
        <!-- 顶部操作栏 -->
        <div class="toolbar">
            <el-button type="primary" @click="$router.push('/groupon/add')">
                <el-icon><Plus /></el-icon> 新增团购活动
            </el-button>
            <el-button @click="fetchData">
                <el-icon><Refresh /></el-icon> 刷新
            </el-button>
        </div>

        <!-- 筛选栏 -->
        <el-card class="filter-card" shadow="never">
            <el-form :inline="true" :model="filterForm">
                <el-form-item label="活动名称">
                    <el-input v-model="filterForm.name" placeholder="输入名称搜索" clearable @keyup.enter="handleSearch" />
                </el-form-item>
                <el-form-item label="状态">
                    <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 130px">
                        <el-option label="未开始" :value="0" />
                        <el-option label="进行中" :value="1" />
                        <el-option label="已结束" :value="2" />
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

        <!-- 团购活动表格 -->
        <el-card class="table-card" shadow="never">
            <el-table :data="tableData" border style="width: 100%" v-loading="loading">
                <el-table-column prop="id" label="ID" width="70" align="center" />
                <el-table-column prop="name" label="活动名称" min-width="180" show-overflow-tooltip />
                <el-table-column label="团购商品" min-width="200">
                    <template #default="scope">
                        <div class="goods-info">
                            <el-image
                                :src="scope.row.goodsThumb || scope.row.goodsImage"
                                style="width: 40px; height: 40px; border-radius: 4px; flex-shrink: 0"
                                fit="cover"
                            >
                                <template #error>
                                    <div class="image-slot">
                                        <el-icon><Picture /></el-icon>
                                    </div>
                                </template>
                            </el-image>
                            <span class="goods-title">{{ scope.row.goodsTitle }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="原价" width="100" align="center">
                    <template #default="scope">
                        <span class="origin-price">¥{{ ((scope.row.originPrice || 0) / 100).toFixed(2) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="团购价" width="100" align="center">
                    <template #default="scope">
                        <span class="groupon-price">¥{{ ((scope.row.grouponPrice || 0) / 100).toFixed(2) }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="成团人数" width="90" align="center">
                    <template #default="scope">
                        <el-tag type="info" size="small">{{ scope.row.minGroupSize }}人成团</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="已售/库存" width="120" align="center">
                    <template #default="scope">
                        <span>{{ scope.row.soldCount || 0 }} / {{ scope.row.stockCount || 0 }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="有效期" min-width="230">
                    <template #default="scope">
                        <span class="time-text">{{ scope.row.startTime }}</span>
                        <br />
                        <span class="time-text">{{ scope.row.endTime }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="状态" width="90" align="center">
                    <template #default="scope">
                        <el-tag v-if="scope.row.status === 1" type="success" size="small">进行中</el-tag>
                        <el-tag v-else-if="scope.row.status === 0" type="info" size="small">未开始</el-tag>
                        <el-tag v-else type="danger" size="small">已结束</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200" fixed="right" align="center">
                    <template #default="scope">
                        <el-button type="primary" size="small" link @click="handleEdit(scope.row)">
                            <el-icon><Edit /></el-icon> 编辑
                        </el-button>
                        <el-button
                            v-if="scope.row.status === 1"
                            type="warning"
                            size="small"
                            link
                            @click="handleStop(scope.row)"
                        >
                            <el-icon><VideoPause /></el-icon> 结束
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
                    @size-change="handleSearch"
                    @current-change="handleSearch"
                />
            </div>
        </el-card>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Refresh, Edit, Delete, Search, Picture, VideoPause } from '@element-plus/icons-vue'
import { getGrouponList, deleteGroupon, stopGroupon } from '~/api/groupon'
import { toast, showModal } from '~/composables/util'

const router = useRouter()
const tableData = ref([])
const loading = ref(false)

const filterForm = reactive({
    name: '',
    status: null,
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
        if (filterForm.name) params.name = filterForm.name
        if (filterForm.status !== null && filterForm.status !== '') params.status = filterForm.status

        const data = await getGrouponList(params)
        tableData.value = data.list || []
        pager.total = data.totalCount || 0
    } catch (e) {
        console.error('获取团购活动列表失败', e)
    } finally {
        loading.value = false
    }
}

function handleSearch() {
    pager.pageNum = 1
    fetchData()
}

function handleReset() {
    filterForm.name = ''
    filterForm.status = null
    pager.pageNum = 1
    fetchData()
}

// 编辑
function handleEdit(row) {
    router.push(`/groupon/add?id=${row.id}`)
}

// 结束活动
function handleStop(row) {
    showModal(`确定要提前结束活动「${row.name}」吗？结束后未成团的订单将自动退款。`, 'warning', '结束确认')
        .then(async () => {
            try {
                await stopGroupon(row.id)
                toast('活动已结束')
                fetchData()
            } catch (e) {
                console.error('结束活动失败', e)
            }
        })
        .catch(() => {})
}

// 删除
function handleDelete(row) {
    showModal(`确定要删除活动「${row.name}」吗？此操作不可恢复！`, 'error', '删除确认')
        .then(async () => {
            try {
                await deleteGroupon(row.id)
                toast('删除成功')
                fetchData()
            } catch (e) {
                console.error('删除失败', e)
            }
        })
        .catch(() => {})
}

onMounted(() => {
    fetchData()
})
</script>

<style scoped>
.groupon-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.toolbar {
    display: flex;
    gap: 8px;
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

.goods-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.goods-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
}

.origin-price {
    color: #909399;
    text-decoration: line-through;
    font-size: 13px;
}

.groupon-price {
    color: #f56c6c;
    font-weight: 600;
    font-size: 15px;
}

.time-text {
    font-size: 12px;
    color: #606266;
}

.image-slot {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f7fa;
    color: #c0c4cc;
    border-radius: 4px;
}
</style>
