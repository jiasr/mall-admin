<template>
    <div class="refund-page">
        <el-card class="content-card" shadow="never">
            <template #header>
                <div class="content-header">
                    <span class="page-title"><el-icon><Warning /></el-icon> 退款管理</span>
                    <div class="search-area">
                        <el-input v-model="filterForm.orderNo" placeholder="订单号" clearable style="width: 200px" @keyup.enter="handleSearch" />
                        <el-select v-model="filterForm.refundStatus" placeholder="退款状态" clearable style="width: 170px">
                            <el-option label="全部(已支付/已退款)" value="" />
                            <el-option label="已支付(可退款)" :value="1" />
                            <el-option label="已退款" :value="2" />
                        </el-select>
                        <el-button type="primary" @click="handleSearch">搜索</el-button>
                    </div>
                </div>
            </template>

            <el-table :data="tableData" border size="small" style="width: 100%" v-loading="loading">
                <el-table-column label="订单号" prop="orderNo" width="180" align="center" show-overflow-tooltip />

                <el-table-column label="商品信息" min-width="200">
                    <template #default="scope">
                        <div class="goods-info" v-for="(item, i) in (scope.row.orderItemList || scope.row.items || [])" :key="i">
                            <span>{{ item.title || item.goodsTitle }}</span>
                            <span class="text-muted">x{{ item.num || item.quantity }}</span>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="收货人" width="120" align="center">
                    <template #default="scope">
                        <div>{{ scope.row.consignee || scope.row.name }}</div>
                    </template>
                </el-table-column>

                <el-table-column label="支付金额" width="120" align="center">
                    <template #default="scope">
                        <span class="price">&yen;{{ ((scope.row.payAmount || 0) / 100).toFixed(2) }}</span>
                    </template>
                </el-table-column>

                <el-table-column label="退款状态" width="110" align="center">
                    <template #default="scope">
                        <el-tag :type="scope.row.payStatus === 2 ? 'info' : 'success'" size="small">
                            {{ scope.row.payStatus === 1 ? '已支付' : '已退款' }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="下单时间" width="160" align="center">
                    <template #default="scope">
                        {{ scope.row.createTime || scope.row.createdAt }}
                    </template>
                </el-table-column>

                <el-table-column label="操作" width="180" fixed="right" align="center">
                    <template #default="scope">
                        <el-button type="primary" size="small" link @click="handleView(scope.row)">
                            <el-icon><View /></el-icon> 查看
                        </el-button>
                        <el-button
                            v-if="scope.row.payStatus === 1"
                            type="danger"
                            size="small"
                            link
                            @click="handleRefund(scope.row)"
                        >
                            <el-icon><Warning /></el-icon> 退款
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

        <!-- 退款确认对话框 -->
        <el-dialog v-model="refundDialogVisible" title="确认退款" width="480px">
            <template v-if="currentOrder">
                <el-descriptions :column="2" border size="small">
                    <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
                    <el-descriptions-item label="支付金额">
                        <span class="price">&yen;{{ ((currentOrder.payAmount || 0) / 100).toFixed(2) }}</span>
                    </el-descriptions-item>
                </el-descriptions>
                <el-form :model="refundForm" class="mt-4">
                    <el-form-item label="退款原因">
                        <el-input v-model="refundForm.reason" type="textarea" :rows="2" placeholder="可选" maxlength="200" />
                    </el-form-item>
                </el-form>
            </template>
            <template #footer>
                <el-button @click="refundDialogVisible = false">取消</el-button>
                <el-button type="danger" :loading="refunding" @click="handleRefundConfirm">
                    <el-icon><Warning /></el-icon> 确认退款
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Warning, View } from '@element-plus/icons-vue'
import { getOrderList, getOrderDetail, refundOrder } from '~/api/order'
import { toast, showModal } from '~/composables/util'

const loading = ref(false)
const tableData = ref([])
const refundDialogVisible = ref(false)
const refunding = ref(false)
const currentOrder = ref(null)

const filterForm = reactive({
    orderNo: '',
    refundStatus: null,
})

const refundForm = reactive({
    reason: '',
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
        if (filterForm.orderNo) params.orderNo = filterForm.orderNo
        // 按支付状态筛选（1=已支付 2=已退款），默认只看已支付/已退款订单
        const payStatus = (filterForm.refundStatus === null || filterForm.refundStatus === '')
            ? '1,2' : filterForm.refundStatus
        params.payStatus = payStatus
        const data = await getOrderList(params)
        const list = data && data.data ? data.data : data
        tableData.value = list.list || list.records || []
        pager.total = list.total || list.totalCount || 0
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

async function handleView(row) {
    try {
        const data = await getOrderDetail(row.orderNo)
        currentOrder.value = data && data.data ? data.data : data
        // 打开详情抽屉或弹窗
        showModal('订单详情\n订单号: ' + row.orderNo + '\n金额: ¥' + ((row.payAmount || 0) / 100).toFixed(2) + '\n状态: ' + (row.payStatus === 1 ? '已支付' : '已退款'), 'info')
    } catch (e) {
        console.error(e)
    }
}

async function handleRefund(row) {
    currentOrder.value = row
    refundForm.reason = ''
    refundDialogVisible.value = true
}

async function handleRefundConfirm() {
    refunding.value = true
    try {
        await refundOrder({
            orderNo: currentOrder.value.orderNo,
            reason: refundForm.reason,
        })
        toast('退款成功', 'success')
        refundDialogVisible.value = false
        handleSearch()
    } catch (e) {
        // 错误已在拦截器中展示
    } finally {
        refunding.value = false
    }
}

onMounted(handleSearch)
</script>

<style scoped>
.content-card { border: none; }
.content-header { display: flex; justify-content: space-between; align-items: center; }
.search-area { display: flex; gap: 8px; align-items: center; }
.page-title { font-size: 15px; font-weight: 600; }
.pagination { display: flex; justify-content: flex-end; padding: 10px 16px; border-top: 1px solid #ebeef5; }
.price { color: #f56c6c; font-weight: 600; }
.text-muted { color: #999; font-size: 12px; }
.goods-info { display: flex; gap: 4px; padding: 2px 0; }
.mt-4 { margin-top: 16px; }
</style>
