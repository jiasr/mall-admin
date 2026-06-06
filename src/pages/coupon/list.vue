<template>
    <div class="coupon-page">
        <!-- 顶部操作栏 -->
        <div class="toolbar">
            <el-button type="primary" @click="handleAdd">
                <el-icon><Plus /></el-icon> 新增优惠券
            </el-button>
            <el-button @click="fetchData">
                <el-icon><Refresh /></el-icon> 刷新
            </el-button>
        </div>

        <!-- 筛选栏 -->
        <el-card class="filter-card" shadow="never">
            <el-form :inline="true" :model="filterForm">
                <el-form-item label="优惠券名称">
                    <el-input v-model="filterForm.name" placeholder="输入名称搜索" clearable @keyup.enter="handleSearch" />
                </el-form-item>
                <el-form-item label="类型">
                    <el-select v-model="filterForm.type" placeholder="全部类型" clearable style="width: 140px">
                        <el-option label="满减券" :value="1" />
                        <el-option label="折扣券" :value="2" />
                        <el-option label="代金券" :value="3" />
                    </el-select>
                </el-form-item>
                <el-form-item label="状态">
                    <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 120px">
                        <el-option label="生效中" :value="1" />
                        <el-option label="已失效" :value="0" />
                        <el-option label="未开始" :value="2" />
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

        <!-- 优惠券表格 -->
        <el-card class="table-card" shadow="never">
            <el-table :data="tableData" border style="width: 100%" v-loading="loading">
                <el-table-column prop="id" label="ID" width="70" align="center" />
                <el-table-column prop="name" label="优惠券名称" min-width="180" show-overflow-tooltip />
                <el-table-column label="类型" width="100" align="center">
                    <template #default="scope">
                        <el-tag v-if="scope.row.type === 1" type="primary" size="small">满减券</el-tag>
                        <el-tag v-else-if="scope.row.type === 2" type="success" size="small">折扣券</el-tag>
                        <el-tag v-else type="warning" size="small">代金券</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="面额" width="120" align="center">
                    <template #default="scope">
                        <template v-if="scope.row.type === 2">
                            <span class="amount">{{ scope.row.discount }}折</span>
                        </template>
                        <template v-else>
                            <span class="amount">¥{{ ((scope.row.amount || 0) / 100).toFixed(2) }}</span>
                        </template>
                    </template>
                </el-table-column>
                <el-table-column label="使用门槛" width="140" align="center">
                    <template #default="scope">
                        <span v-if="scope.row.minAmount > 0">满¥{{ ((scope.row.minAmount || 0) / 100).toFixed(2) }}</span>
                        <span v-else>无门槛</span>
                    </template>
                </el-table-column>
                <el-table-column label="库存" width="140" align="center">
                    <template #default="scope">
                        <span>{{ scope.row.receivedCount || 0 }} / {{ scope.row.totalCount || 0 }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="有效期" min-width="200">
                    <template #default="scope">
                        <span>{{ scope.row.startTime }} ~ {{ scope.row.endTime }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="状态" width="100" align="center">
                    <template #default="scope">
                        <el-tag v-if="scope.row.status === 1" type="success" size="small">生效中</el-tag>
                        <el-tag v-else-if="scope.row.status === 2" type="info" size="small">未开始</el-tag>
                        <el-tag v-else type="danger" size="small">已失效</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="160" fixed="right" align="center">
                    <template #default="scope">
                        <el-button type="primary" size="small" link @click="handleEdit(scope.row)">
                            <el-icon><Edit /></el-icon> 编辑
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

        <!-- 新增/编辑弹窗 -->
        <el-dialog
            v-model="dialogVisible"
            :title="dialogTitle"
            width="650px"
            :close-on-click-modal="false"
        >
            <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
                <el-form-item label="优惠券名称" prop="name">
                    <el-input v-model="form.name" placeholder="请输入优惠券名称" maxlength="50" show-word-limit />
                </el-form-item>
                <el-form-item label="优惠券类型" prop="type">
                    <el-radio-group v-model="form.type">
                        <el-radio :value="1">满减券</el-radio>
                        <el-radio :value="2">折扣券</el-radio>
                        <el-radio :value="3">代金券</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item v-if="form.type === 2" label="折扣力度" prop="discount">
                    <el-input-number v-model="form.discount" :min="1" :max="99" :step="1" /> <span class="unit">折（1-99折）</span>
                </el-form-item>
                <el-form-item v-else label="面额" prop="amount">
                    <el-input-number v-model="form.amount" :min="1" :step="100" /> <span class="unit">分</span>
                </el-form-item>
                <el-form-item label="使用门槛">
                    <el-input-number v-model="form.minAmount" :min="0" :step="100" /> <span class="unit">分（0表示无门槛）</span>
                </el-form-item>
                <el-form-item label="发放总量" prop="totalCount">
                    <el-input-number v-model="form.totalCount" :min="1" :max="999999" />
                </el-form-item>
                <el-form-item label="有效期" prop="dateRange">
                    <el-date-picker
                        v-model="form.dateRange"
                        type="datetimerange"
                        range-separator="至"
                        start-placeholder="开始时间"
                        end-placeholder="结束时间"
                        format="YYYY-MM-DD HH:mm:ss"
                        value-format="YYYY-MM-DD HH:mm:ss"
                        style="width: 100%"
                    />
                </el-form-item>
                <el-form-item label="适用商品">
                    <el-input v-model="form.goodsRange" placeholder="留空表示全场通用，或输入商品SPU编码（逗号分隔）" />
                </el-form-item>
                <el-form-item label="备注">
                    <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注信息（选填）" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
                    {{ isEdit ? '保存' : '新增' }}
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus, Refresh, Edit, Delete, Search } from '@element-plus/icons-vue'
import { getCouponList, addCoupon, updateCoupon, deleteCoupon } from '~/api/coupon'
import { toast, showModal } from '~/composables/util'

const tableData = ref([])
const loading = ref(false)

const filterForm = reactive({
    name: '',
    type: null,
    status: null,
})

const pager = reactive({
    pageNum: 1,
    pageSize: 10,
    total: 0,
})

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增优惠券')
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)

const form = reactive({
    id: null,
    name: '',
    type: 1,
    amount: 0,
    discount: 10,
    minAmount: 0,
    totalCount: 100,
    dateRange: [],
    goodsRange: '',
    remark: '',
})

const rules = {
    name: [{ required: true, message: '请输入优惠券名称', trigger: 'blur' }],
    type: [{ required: true, message: '请选择优惠券类型', trigger: 'change' }],
    totalCount: [{ required: true, message: '请输入发放总量', trigger: 'blur' }],
    dateRange: [{ required: true, message: '请选择有效期', trigger: 'change' }],
}

// 加载数据
async function fetchData() {
    loading.value = true
    try {
        const params = { pageNum: pager.pageNum, pageSize: pager.pageSize }
        if (filterForm.name) params.name = filterForm.name
        if (filterForm.type) params.type = filterForm.type
        if (filterForm.status !== null && filterForm.status !== '') params.status = filterForm.status

        const data = await getCouponList(params)
        tableData.value = data.list || []
        pager.total = data.totalCount || 0
    } catch (e) {
        console.error('获取优惠券列表失败', e)
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
    filterForm.type = null
    filterForm.status = null
    pager.pageNum = 1
    fetchData()
}

// 新增
function handleAdd() {
    isEdit.value = false
    dialogTitle.value = '新增优惠券'
    form.id = null
    form.name = ''
    form.type = 1
    form.amount = 0
    form.discount = 10
    form.minAmount = 0
    form.totalCount = 100
    form.dateRange = []
    form.goodsRange = ''
    form.remark = ''
    dialogVisible.value = true
}

// 编辑
function handleEdit(row) {
    isEdit.value = true
    dialogTitle.value = '编辑优惠券'
    form.id = row.id
    form.name = row.name
    form.type = row.type
    form.amount = row.amount || 0
    form.discount = row.discount || 10
    form.minAmount = row.minAmount || 0
    form.totalCount = row.totalCount
    form.dateRange = [row.startTime, row.endTime]
    form.goodsRange = row.goodsRange || ''
    form.remark = row.remark || ''
    dialogVisible.value = true
}

// 提交
async function handleSubmit() {
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return

    submitLoading.value = true
    try {
        const payload = {
            name: form.name,
            type: form.type,
            minAmount: form.minAmount,
            totalCount: form.totalCount,
            startTime: form.dateRange[0],
            endTime: form.dateRange[1],
            goodsRange: form.goodsRange,
            remark: form.remark,
        }
        if (form.type === 2) {
            payload.discount = form.discount
        } else {
            payload.amount = form.amount
        }

        if (isEdit.value) {
            await updateCoupon(form.id, payload)
            toast('修改成功')
        } else {
            await addCoupon(payload)
            toast('新增成功')
        }
        dialogVisible.value = false
        fetchData()
    } catch (e) {
        console.error('操作失败', e)
    } finally {
        submitLoading.value = false
    }
}

// 删除
function handleDelete(row) {
    showModal(`确定要删除优惠券「${row.name}」吗？`, 'warning', '删除确认')
        .then(async () => {
            try {
                await deleteCoupon(row.id)
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
.coupon-page {
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

.amount {
    color: #f56c6c;
    font-weight: 600;
}

.unit {
    margin-left: 8px;
    color: #909399;
    font-size: 13px;
}
</style>
