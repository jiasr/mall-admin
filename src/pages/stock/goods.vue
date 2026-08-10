<template>
    <el-card shadow="never">
        <el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange">
            <!-- ==================== 商品列表 ==================== -->
            <el-tab-pane label="库存商品" name="goods">
                <div class="content-header">
                    <el-form :inline="true" :model="filterForm" class="search-form">
                        <el-form-item label="关键词">
                            <el-input v-model="filterForm.keyword" placeholder="商品名称/条码" clearable @keyup.enter="handleSearch" />
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

                <el-table :data="tableData" border size="small" style="width: 100%" v-loading="loading">
                    <el-table-column label="图片" width="70" align="center">
                        <template #default="scope">
                            <el-image
                                v-if="scope.row.imageUrl"
                                :src="scope.row.imageUrl"
                                style="width: 48px; height: 48px; border-radius: 4px"
                                fit="cover"
                            >
                                <template #error>
                                    <div class="img-slot"><el-icon><Picture /></el-icon></div>
                                </template>
                            </el-image>
                            <div v-else class="img-slot"><el-icon><Picture /></el-icon></div>
                        </template>
                    </el-table-column>
                    <el-table-column prop="name" label="商品名称" width="180" show-overflow-tooltip />
                    <el-table-column prop="barcode" label="条码" width="160" align="center" />
                    <el-table-column prop="brand" label="品牌" width="110" align="center" />
                    <el-table-column prop="spec" label="规格" width="110" align="center" />
                    <el-table-column prop="unit" label="单位" width="80" align="center" />
                    <el-table-column prop="category" label="分类" width="110" align="center" />
                    <el-table-column label="成本价" width="100" align="center">
                        <template #default="scope">¥{{ Number(scope.row.costPrice || 0).toFixed(2) }}</template>
                    </el-table-column>
                    <el-table-column label="库存" width="90" align="center">
                        <template #default="scope">
                            <el-tag :type="scope.row.stockQuantity <= scope.row.warnThreshold ? 'danger' : 'success'" size="small">
                                {{ scope.row.stockQuantity }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="140" fixed="right" align="center">
                        <template #default="scope">
                            <el-button type="primary" size="small" link @click="handleView(scope.row)">
                                <el-icon><View /></el-icon> 查看
                            </el-button>
                            <el-button type="danger" size="small" link @click="handleDelete(scope.row)">
                                <el-icon><Delete /></el-icon> 删除
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>

                <div class="pagination">
                    <el-pagination
                        v-model:current-page="pager.pageIndex"
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

                <!-- 商品详情抽屉 -->
                <el-drawer v-model="drawerVisible" title="库存商品详情" size="1240px" destroy-on-close>
                    <template v-if="currentGoods">
                        <el-descriptions :column="1" border>
                            <el-descriptions-item label="商品名称">{{ currentGoods.name }}</el-descriptions-item>
                            <el-descriptions-item label="条码">
                                <template v-if="currentGoods.barcode">
                                    <div class="barcode-wrap">
                                        <canvas id="stock-barcode-canvas" class="barcode-canvas"></canvas>
                                        <div class="barcode-text">{{ currentGoods.barcode }}</div>
                                    </div>
                                </template>
                                <span v-else>-</span>
                            </el-descriptions-item>
                            <el-descriptions-item label="品牌">{{ currentGoods.brand || '-' }}</el-descriptions-item>
                            <el-descriptions-item label="规格">{{ currentGoods.spec || '-' }}</el-descriptions-item>
                            <el-descriptions-item label="单位">{{ currentGoods.unit || '-' }}</el-descriptions-item>
                            <el-descriptions-item label="分类">{{ currentGoods.category || '-' }}</el-descriptions-item>
                            <el-descriptions-item label="成本价">¥{{ Number(currentGoods.costPrice || 0).toFixed(2) }}</el-descriptions-item>
                            <el-descriptions-item label="参考售价">¥{{ Number(currentGoods.salePrice || 0).toFixed(2) }}</el-descriptions-item>
                            <el-descriptions-item label="库存数量">{{ currentGoods.stockQuantity }}</el-descriptions-item>
                            <el-descriptions-item label="预警阈值">{{ currentGoods.warnThreshold }}</el-descriptions-item>
                            <el-descriptions-item label="供应商">{{ currentGoods.supplier || '-' }}</el-descriptions-item>
                            <el-descriptions-item label="创建时间">{{ currentGoods.createTime || '-' }}</el-descriptions-item>
                        </el-descriptions>

                        <h4 class="block-title">入库记录 / 库存流水</h4>
                        <el-table :data="stockLogs" border size="small" v-loading="logLoading">
                            <el-table-column label="变动数量" width="90" align="center">
                                <template #default="scope">
                                    <span :style="{ color: scope.row.change_qty > 0 ? '#67c23a' : scope.row.change_qty < 0 ? '#f56c6c' : '#333' }">
                                        {{ scope.row.change_qty > 0 ? '+' : '' }}{{ scope.row.change_qty }}
                                    </span>
                                </template>
                            </el-table-column>
                            <el-table-column prop="balance_after" label="结存" width="70" align="center" />
                            <el-table-column label="业务类型" width="80" align="center">
                                <template #default="scope">
                                    <el-tag size="small">{{ bizTypeText(scope.row.biz_type) }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column prop="biz_no" label="单号" min-width="130" align="center" />
                            <el-table-column prop="operator_name" label="操作人" width="80" align="center" />
                            <el-table-column prop="create_time" label="时间" width="150" align="center" />
                        </el-table>
                        <el-empty v-if="!logLoading && stockLogs.length === 0" description="暂无出入库记录" :image-size="60" />

                        <h4 class="block-title">GDS 原始数据</h4>
                        <pre class="gds-pre">{{ formatGds(currentGoods.text) }}</pre>
                    </template>
                </el-drawer>
            </el-tab-pane>

            <!-- ==================== 入库单 ==================== -->
            <el-tab-pane label="入库单" name="in">
                <div class="content-header">
                    <el-form :inline="true" :model="inFilter" class="search-form">
                        <el-form-item label="状态">
                            <el-select v-model="inFilter.status" placeholder="全部状态" clearable style="width: 130px">
                                <el-option label="草稿" :value="0" />
                                <el-option label="已提交" :value="1" />
                                <el-option label="已取消" :value="2" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="关键词">
                            <el-input v-model="inFilter.keyword" placeholder="入库单号" clearable @keyup.enter="loadInList" />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="loadInList">
                                <el-icon><Search /></el-icon> 搜索
                            </el-button>
                            <el-button @click="resetIn">
                                <el-icon><Refresh /></el-icon> 重置
                            </el-button>
                        </el-form-item>
                    </el-form>
                </div>

                <el-table :data="inTable" border size="small" style="width: 100%" v-loading="inLoading">
                    <el-table-column prop="order_no" label="入库单号" width="180" align="center" />
                    <el-table-column label="类型" width="110" align="center">
                        <template #default="scope">{{ typeText(scope.row.type) }}</template>
                    </el-table-column>
                    <el-table-column prop="total_quantity" label="数量" width="90" align="center" />
                    <el-table-column label="总金额" width="110" align="center">
                        <template #default="scope">¥{{ Number(scope.row.total_amount || 0).toFixed(2) }}</template>
                    </el-table-column>
                    <el-table-column label="状态" width="90" align="center">
                        <template #default="scope">
                            <el-tag :type="statusType(scope.row.status)" size="small">{{ statusText(scope.row.status) }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="operator_name" label="操作人" width="110" align="center" />
                    <el-table-column prop="create_time" label="创建时间" width="160" align="center" />
                    <el-table-column label="操作" width="100" fixed="right" align="center">
                        <template #default="scope">
                            <el-button type="primary" size="small" link @click="viewInDetail(scope.row)">
                                <el-icon><View /></el-icon> 查看
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>

                <div class="pagination">
                    <el-pagination
                        v-model:current-page="inPager.pageIndex"
                        v-model:page-size="inPager.pageSize"
                        :page-sizes="[10, 20, 50]"
                        :total="inPager.total"
                        layout="total, sizes, prev, pager, next, jumper"
                        background
                        size="small"
                        @size-change="loadInList"
                        @current-change="loadInList"
                    />
                </div>

                <el-drawer v-model="inDrawer" title="入库单详情" size="560px" destroy-on-close>
                    <template v-if="currentOrder">
                        <el-descriptions :column="2" border>
                            <el-descriptions-item label="入库单号">{{ currentOrder.order_no }}</el-descriptions-item>
                            <el-descriptions-item label="类型">{{ typeText(currentOrder.type) }}</el-descriptions-item>
                            <el-descriptions-item label="状态">
                                <el-tag :type="statusType(currentOrder.status)" size="small">{{ statusText(currentOrder.status) }}</el-tag>
                            </el-descriptions-item>
                            <el-descriptions-item label="操作人">{{ currentOrder.operator_name || '-' }}</el-descriptions-item>
                            <el-descriptions-item label="创建时间">{{ currentOrder.create_time || '-' }}</el-descriptions-item>
                            <el-descriptions-item label="商品种类">{{ (currentOrder.items || []).length }}</el-descriptions-item>
                        </el-descriptions>

                        <h4 class="block-title">入库明细</h4>
                        <el-table :data="currentOrder.items || []" border size="small">
                            <el-table-column prop="goods_name" label="商品名称" min-width="150" />
                            <el-table-column prop="goods_barcode" label="条码" width="150" align="center" />
                            <el-table-column prop="quantity" label="数量" width="80" align="center" />
                            <el-table-column label="成本价" width="100" align="center">
                                <template #default="scope">¥{{ Number(scope.row.cost_price || 0).toFixed(2) }}</template>
                            </el-table-column>
                        </el-table>
                    </template>
                </el-drawer>
            </el-tab-pane>

            <!-- ==================== 库存流水 ==================== -->
            <el-tab-pane label="库存流水" name="log">
                <div class="content-header">
                    <el-form :inline="true" :model="logFilter" class="search-form">
                        <el-form-item label="商品ID">
                            <el-input v-model="logFilter.goods_id" placeholder="按商品ID筛选(可留空)" clearable style="width: 180px" />
                        </el-form-item>
                        <el-form-item label="业务类型">
                            <el-select v-model="logFilter.biz_type" placeholder="全部类型" clearable style="width: 130px">
                                <el-option label="入库" value="stock_in" />
                                <el-option label="出库" value="stock_out" />
                                <el-option label="盘点" value="stock_check" />
                            </el-select>
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="loadLogList">
                                <el-icon><Search /></el-icon> 搜索
                            </el-button>
                            <el-button @click="resetLog">
                                <el-icon><Refresh /></el-icon> 重置
                            </el-button>
                        </el-form-item>
                    </el-form>
                </div>

                <el-table :data="logTable" border size="small" style="width: 100%" v-loading="logLoading">
                    <el-table-column prop="goods_name" label="商品名称" min-width="160" show-overflow-tooltip />
                    <el-table-column prop="goods_barcode" label="条码" width="160" align="center" />
                    <el-table-column label="变动数量" width="100" align="center">
                        <template #default="scope">
                            <span :style="{ color: scope.row.change_qty > 0 ? '#67c23a' : scope.row.change_qty < 0 ? '#f56c6c' : '#333' }">
                                {{ scope.row.change_qty > 0 ? '+' : '' }}{{ scope.row.change_qty }}
                            </span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="balance_after" label="变动后结存" width="100" align="center" />
                    <el-table-column label="业务类型" width="90" align="center">
                        <template #default="scope">
                            <el-tag size="small">{{ bizTypeText(scope.row.biz_type) }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="biz_no" label="业务单号" width="170" align="center" />
                    <el-table-column prop="operator_name" label="操作人" width="100" align="center" />
                    <el-table-column prop="create_time" label="时间" width="160" align="center" />
                </el-table>

                <div class="pagination">
                    <el-pagination
                        v-model:current-page="logPager.pageIndex"
                        v-model:page-size="logPager.pageSize"
                        :page-sizes="[10, 20, 50]"
                        :total="logPager.total"
                        layout="total, sizes, prev, pager, next, jumper"
                        background
                        size="small"
                        @size-change="loadLogList"
                        @current-change="loadLogList"
                    />
                </div>
            </el-tab-pane>
        </el-tabs>
    </el-card>
</template>

<script setup>
import { ref, reactive, onMounted, onActivated, nextTick } from 'vue'
import { Search, Refresh, Picture, View, Delete } from '@element-plus/icons-vue'
import JsBarcode from 'jsbarcode'
import { getStockGoodsList, getStockGoodsDetail, deleteStockGoods, getStockLogList, getStockInList, getStockInDetail } from '~/api/stock'
import { toast, showModal } from '~/composables/util'

const activeTab = ref('goods')

// ========== 商品列表 ==========
const loading = ref(false)
const tableData = ref([])
const drawerVisible = ref(false)
const currentGoods = ref(null)
const stockLogs = ref([])

const filterForm = reactive({ keyword: '' })
const pager = reactive({ pageIndex: 1, pageSize: 10, total: 0 })

async function handleSearch() {
    loading.value = true
    try {
        const params = { pageIndex: pager.pageIndex, pageSize: pager.pageSize }
        if (filterForm.keyword) params.keyword = filterForm.keyword
        const data = await getStockGoodsList(params)
        if (data) {
            tableData.value = data.list || []
            pager.total = data.totalCount || 0
        }
    } catch (e) {
        console.error('加载库存商品失败', e)
    } finally {
        loading.value = false
    }
}

function handleReset() {
    filterForm.keyword = ''
    pager.pageIndex = 1
    handleSearch()
}

async function handleView(row) {
    drawerVisible.value = true
    currentGoods.value = null
    stockLogs.value = []
    try {
        currentGoods.value = await getStockGoodsDetail(row.id)
        await nextTick()
        renderBarcode()
    } catch (e) {
        console.error('加载详情失败', e)
    }
    try {
        const data = await getStockLogList({ goods_id: row.id, pageIndex: 1, pageSize: 100 })
        stockLogs.value = (data && data.list) || []
    } catch (e) {
        console.error('加载库存流水失败', e)
    }
}

// 用 JsBarcode 渲染 EAN-13 条码图片
function renderBarcode() {
    const goods = currentGoods.value
    const el = document.getElementById('stock-barcode-canvas')
    if (!goods || !el) return
    const barcode = goods.barcode || ''
    if (!barcode) {
        const ctx = el.getContext('2d')
        ctx.clearRect(0, 0, el.width, el.height)
        return
    }
    try {
        JsBarcode(el, barcode, {
            format: 'EAN13',
            displayValue: true,
            width: 2,
            height: 80,
            margin: 5,
            fontSize: 14,
        })
    } catch (e) {
        // 非 13 位或非数字时，降级为 Code128 展示，保证仍可打印
        try {
            JsBarcode(el, barcode, {
                format: 'CODE128',
                displayValue: true,
                width: 2,
                height: 80,
                margin: 5,
                fontSize: 14,
            })
        } catch (err) {
            console.error('条码渲染失败', err)
        }
    }
}

async function handleDelete(row) {
    try {
        await showModal('确定要删除该商品吗？将连带删除其入库明细、库存流水及空入库单！', 'error', '删除确认')
        const res = await deleteStockGoods(row.id)
        if (res && res.hasStockRecord) {
            toast('该商品已有入库记录，已强制删除', 'warning')
        } else {
            toast('删除成功', 'success')
        }
        handleSearch()
    } catch (e) {
        if (e !== 'cancel') {
            console.error('删除失败', e)
        }
    }
}

// ========== 入库单 ==========
const inLoading = ref(false)
const inTable = ref([])
const inDrawer = ref(false)
const currentOrder = ref(null)
const inFilter = reactive({ status: null, keyword: '' })
const inPager = reactive({ pageIndex: 1, pageSize: 10, total: 0 })

async function loadInList() {
    inLoading.value = true
    try {
        const params = { pageIndex: inPager.pageIndex, pageSize: inPager.pageSize }
        if (inFilter.status !== null && inFilter.status !== '') params.status = inFilter.status
        if (inFilter.keyword) params.keyword = inFilter.keyword
        const data = await getStockInList(params)
        if (data) {
            inTable.value = data.list || []
            inPager.total = data.totalCount || 0
        }
    } catch (e) {
        console.error('加载入库单失败', e)
    } finally {
        inLoading.value = false
    }
}

function resetIn() {
    inFilter.status = null
    inFilter.keyword = ''
    inPager.pageIndex = 1
    loadInList()
}

async function viewInDetail(row) {
    inDrawer.value = true
    currentOrder.value = null
    try {
        currentOrder.value = await getStockInDetail(row.id)
    } catch (e) {
        console.error('加载入库单详情失败', e)
    }
}

// ========== 库存流水 ==========
const logTable = ref([])
const logFilter = reactive({ goods_id: '', biz_type: null })
const logPager = reactive({ pageIndex: 1, pageSize: 10, total: 0 })

async function loadLogList() {
    logLoading.value = true
    try {
        const params = { pageIndex: logPager.pageIndex, pageSize: logPager.pageSize }
        if (logFilter.goods_id) params.goods_id = logFilter.goods_id
        if (logFilter.biz_type) params.biz_type = logFilter.biz_type
        const data = await getStockLogList(params)
        if (data) {
            logTable.value = data.list || []
            logPager.total = data.totalCount || 0
        }
    } catch (e) {
        console.error('加载库存流水失败', e)
    } finally {
        logLoading.value = false
    }
}

function resetLog() {
    logFilter.goods_id = ''
    logFilter.biz_type = null
    logPager.pageIndex = 1
    loadLogList()
}

// ========== 工具 ==========
function bizTypeText(t) {
    const map = { stock_in: '入库', stock_out: '出库', stock_check: '盘点' }
    return map[t] || t || '-'
}

function typeText(t) {
    const map = { 1: '采购入库', 2: '退货入库', 3: '调拨入库', 4: '盘盈入库' }
    return map[t] !== undefined ? map[t] : (t ? '入库' : '-')
}

function statusText(s) {
    const map = { 0: '草稿', 1: '已提交', 2: '已取消' }
    return map[s] !== undefined ? map[s] : '未知'
}

function statusType(s) {
    const map = { 0: 'info', 1: 'success', 2: 'warning' }
    return map[s] || 'info'
}

function formatGds(text) {
    if (!text) return '无'
    try {
        const obj = JSON.parse(text)
        return JSON.stringify(obj, null, 2)
    } catch (e) {
        return text
    }
}

function handleTabChange(name) {
    if (name === 'in') loadInList()
    else if (name === 'log') loadLogList()
}

onMounted(handleSearch)
onActivated(handleSearch)
</script>

<style scoped>
.content-header {
    padding-bottom: 12px;
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
.pagination {
    display: flex;
    justify-content: flex-end;
    padding-top: 12px;
}
.img-slot {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f7fa;
    color: #c0c4cc;
    border-radius: 4px;
}

.barcode-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.barcode-canvas {
    max-width: 100%;
    height: auto;
    background: #fff;
}

.barcode-text {
    margin-top: 4px;
    font-size: 13px;
    color: #606266;
    letter-spacing: 1px;
}
.block-title {
    margin: 18px 0 10px;
    font-size: 14px;
    color: #303133;
}
.gds-pre {
    background: #fafafa;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    padding: 12px;
    max-height: 320px;
    overflow: auto;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
}
</style>
