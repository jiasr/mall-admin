<template>
    <div class="user-page">
        <el-card class="content-card" shadow="never">
            <!-- 顶部操作栏 -->
            <div class="content-header">
                <div class="header-left">
                    <span class="page-title">用户管理</span>
                </div>
                <el-form :inline="true" :model="filterForm" class="search-form">
                    <el-form-item label="昵称">
                        <el-input v-model="filterForm.nickname" placeholder="用户昵称" clearable @keyup.enter="handleSearch" />
                    </el-form-item>
                    <el-form-item label="手机号">
                        <el-input v-model="filterForm.phone" placeholder="手机号" clearable @keyup.enter="handleSearch" />
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

            <!-- 用户表格 -->
            <el-table :data="tableData" border size="small" style="width: 100%" v-loading="loading">
                <el-table-column label="头像" width="60" align="center">
                    <template #default="scope">
                        <el-avatar :src="imgUrl(scope.row.avatar)" :size="36" shape="circle">
                            <el-icon><User /></el-icon>
                        </el-avatar>
                    </template>
                </el-table-column>

                <el-table-column prop="nickname" label="昵称" min-width="140" show-overflow-tooltip />

                <el-table-column prop="phone" label="手机号" width="130" align="center" />

                <el-table-column label="性别" width="60" align="center">
                    <template #default="scope">
                        {{ scope.row.sex === 1 ? '男' : scope.row.sex === 2 ? '女' : '-' }}
                    </template>
                </el-table-column>

                <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />

                <el-table-column label="状态" width="80" align="center">
                    <template #default="scope">
                        <el-tag v-if="scope.row.status === 1 || scope.row.status === undefined" type="success" size="small">正常</el-tag>
                        <el-tag v-else type="danger" size="small">禁用</el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="注册时间" width="170" align="center">
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

        <!-- 用户详情抽屉 -->
        <el-drawer v-model="drawerVisible" title="用户详情" size="500px" destroy-on-close>
            <template v-if="currentUser">
                <div class="user-detail-header">
                    <el-avatar :src="imgUrl(currentUser.avatar)" :size="64" shape="circle">
                        <el-icon :size="28"><User /></el-icon>
                    </el-avatar>
                    <div class="user-detail-info">
                        <div class="user-detail-name">{{ currentUser.nickname }}</div>
                        <el-tag v-if="currentUser.status !== 0" type="success" size="small">正常</el-tag>
                        <el-tag v-else type="danger" size="small">禁用</el-tag>
                    </div>
                </div>

                <el-descriptions :column="2" border class="user-detail-body">
                    <el-descriptions-item label="用户ID">{{ currentUser.id }}</el-descriptions-item>
                    <el-descriptions-item label="手机号">{{ currentUser.phone || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="邮箱">{{ currentUser.email || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="性别">
                        {{ currentUser.sex === 1 ? '男' : currentUser.sex === 2 ? '女' : '未设置' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="注册时间">{{ currentUser.createTime || currentUser.createdAt || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="最后登录">{{ currentUser.lastLoginTime || '-' }}</el-descriptions-item>
                </el-descriptions>
            </template>
        </el-drawer>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, User, View, CircleClose, CircleCheck, Delete } from '@element-plus/icons-vue'
import { getUserList, getUserDetail, toggleUserStatus, deleteUser } from '~/api/user'
import { toast, showModal, imgUrl } from '~/composables/util'

const loading = ref(false)
const tableData = ref([])

const filterForm = reactive({
    nickname: '',
    phone: '',
    status: null,
})

const pager = reactive({
    pageNum: 1,
    pageSize: 10,
    total: 0,
})

// 搜索
async function handleSearch() {
    loading.value = true
    try {
        const params = {
            pageNum: pager.pageNum,
            pageSize: pager.pageSize,
        }
        if (filterForm.nickname) params.nickname = filterForm.nickname
        if (filterForm.phone) params.phone = filterForm.phone
        if (filterForm.status !== null && filterForm.status !== '') params.status = filterForm.status

        const data = await getUserList(params)
        const list = data && data.data ? data.data : data
        tableData.value = list.list || list.records || []
        pager.total = list.total || list.totalCount || 0
    } catch (e) {
        console.error('加载用户列表失败', e)
    } finally {
        loading.value = false
    }
}

// 重置
function handleReset() {
    filterForm.nickname = ''
    filterForm.phone = ''
    filterForm.status = null
    pager.pageNum = 1
    handleSearch()
}

// 查看详情
const drawerVisible = ref(false)
const currentUser = ref(null)

async function handleView(row) {
    drawerVisible.value = true
    currentUser.value = null
    try {
        const data = await getUserDetail(row.id)
        currentUser.value = data && data.data ? data.data : data
    } catch (e) {
        console.error('加载用户详情失败', e)
    }
}

// 禁用/启用
async function handleToggleStatus(row) {
    const action = row.status === 0 ? '启用' : '禁用'
    const newStatus = row.status === 0 ? 1 : 0
    try {
        await showModal(`确定要${action}该用户吗？`, 'warning', `${action}确认`)
        await toggleUserStatus(row.id, newStatus)
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
        await showModal('确定要删除该用户吗？此操作不可恢复！', 'error', '删除确认')
        await deleteUser(row.id)
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
.user-page {
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

/* 用户详情 */
.user-detail-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid #ebeef5;
}

.user-detail-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.user-detail-name {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
}
</style>
