<template>
    <div class="order-page">
        <!-- 左侧：订单状态平铺 + 搜索栏 -->
        <div class="side-panel">
            <div class="side-section">
                <div class="side-title">订单状态</div>
                <div
                    v-for="s in statusList"
                    :key="String(s.value)"
                    class="status-item"
                    :class="{ active: activeStatus === s.value }"
                    @click="handleStatusClick(s.value)"
                >
                    {{ s.label }}
                </div>
            </div>
            <div class="side-section">
                <div class="side-title">搜索</div>
                <el-input v-model="filterForm.orderNo" placeholder="订单号" clearable @keyup.enter="handleSearch" />
                <el-input v-model="filterForm.consignee" placeholder="收货人姓名" clearable @keyup.enter="handleSearch" />
                <el-input v-model="filterForm.phone" placeholder="收货人手机号" clearable @keyup.enter="handleSearch" />
                <el-button type="primary" class="side-btn" @click="handleSearch">
                    <el-icon><Search /></el-icon> 搜索
                </el-button>
                <el-button class="side-btn" @click="handleReset">
                    <el-icon><Refresh /></el-icon> 重置
                </el-button>
            </div>
        </div>

        <!-- 右侧：订单表格 -->
        <el-card class="content-card" shadow="never">
            <!-- 顶部标题 -->
            <div class="content-header">
                <div class="header-left">
                    <span class="page-title">订单管理</span>
                </div>
            </div>

            <!-- 订单表格 -->
            <el-table :data="tableData" border size="small" style="width: 100%" v-loading="loading">
                <el-table-column label="订单号" prop="orderNo" width="180" align="center" show-overflow-tooltip />

                <el-table-column label="商品信息" width="180">
                    <template #default="scope">
                        <div class="goods-info" v-for="(item, i) in goodsList(scope.row)" :key="i">
                            <el-image
                                :src="item.image || item.thumb"
                                style="width: 32px; height: 32px; border-radius: 4px; flex-shrink: 0"
                                fit="cover"
                            >
                                <template #error>
                                    <div class="image-slot"><el-icon><Picture /></el-icon></div>
                                </template>
                            </el-image>
                            <div class="goods-detail">
                                <div class="goods-title">{{ item.title || item.goodsTitle }}</div>
                                <div class="goods-spec" v-if="item.specInfo">
                                    <el-tag size="small" v-for="(spec, si) in item.specInfo" :key="si">{{ spec.specValue }}</el-tag>
                                </div>
                                <div class="goods-amount"><span class="price">¥{{ goodsPrice(item) }}</span></div>
                            </div>
                            <div class="goods-qty">x{{ item.num || item.quantity }}</div>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="收货人" width="140" align="center">
                    <template #default="scope">
                        <div>{{ scope.row.consignee || scope.row.name }}</div>
                        <div class="phone-text">{{ scope.row.phone || scope.row.mobile }}</div>
                    </template>
                </el-table-column>

                <el-table-column label="订单金额" width="120" align="center">
                    <template #default="scope">
                        <span class="price">¥{{ ((scope.row.totalAmount || scope.row.payAmount || 0) / 100).toFixed(2) }}</span>
                    </template>
                </el-table-column>

                <el-table-column label="小票" width="110" align="center">
                    <template #default="scope">
                        <!-- 未开启打印（飞鹅未配置/未启用）：灰色标签，不可点 -->
                        <el-tag
                            v-if="scope.row.ticketStatus === -2"
                            type="info"
                            size="small"
                            class="ticket-status"
                        >
                            {{ ticketStatusText(scope.row.ticketStatus) }}
                        </el-tag>
                        <!-- 已开启但未打印：显示 - -->
                        <span
                            v-else-if="scope.row.ticketStatus === undefined || scope.row.ticketStatus === -1"
                            class="phone-text"
                        >-</span>
                        <!-- 有打印记录：可点击查看打印记录 -->
                        <el-tooltip
                            v-else
                            :content="'点击查看打印记录' + (scope.row.ticketTime ? '（' + scope.row.ticketTime + '）' : '')"
                        >
                            <el-tag
                                :type="ticketTagType(scope.row.ticketStatus)"
                                size="small"
                                class="ticket-status"
                                @click="handleViewTicketLogs(scope.row)"
                            >
                                {{ ticketStatusText(scope.row.ticketStatus) }}
                            </el-tag>
                        </el-tooltip>
                        <!-- 小票操作：补打 / 预览 -->
                        <div class="ticket-actions">
                            <el-button
                                type="success"
                                size="small"
                                link
                                :loading="printingNo === scope.row.orderNo"
                                @click="handleTicketPrint(scope.row)"
                            >
                                <el-icon><Printer /></el-icon> 补打小票
                            </el-button>
                            <el-button type="warning" size="small" link @click="handlePrint(scope.row)">
                                <el-icon><Tickets /></el-icon> 小票预览
                            </el-button>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="订单状态" width="90" align="center">
                    <template #default="scope">
                        <el-tag :type="statusTagType(scope.row.status)" size="small">
                            {{ statusText(scope.row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="下单时间" width="160" align="center">
                    <template #default="scope">
                        {{ scope.row.createTime || scope.row.createdAt }}
                    </template>
                </el-table-column>

                <el-table-column label="操作" min-width="220" align="center">
                    <template #default="scope">
                        <el-button type="primary" size="small" link @click="handleView(scope.row)">
                            <el-icon><View /></el-icon> 查看
                        </el-button>
                        <el-button
                            v-if="scope.row.status === 1"
                            type="success"
                            size="small"
                            link
                            @click="handleShip(scope.row)"
                        >
                            <el-icon><Top /></el-icon> 发货
                        </el-button>
                        <el-button
                            v-if="scope.row.status === 0"
                            type="warning"
                            size="small"
                            link
                            @click="handleCancel(scope.row)"
                        >
                            <el-icon><Close /></el-icon> 取消
                        </el-button>
                        <el-button
                            v-if="scope.row.status === 1"
                            type="danger"
                            size="small"
                            link
                            @click="handleRefund(scope.row)"
                        >
                            <el-icon><Warning /></el-icon> 退款
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

        <!-- 订单详情抽屉 -->
        <el-drawer v-model="drawerVisible" title="订单详情" size="600px" destroy-on-close>
            <template v-if="currentOrder">
                <el-descriptions :column="2" border>
                    <el-descriptions-item label="订单号" :span="2">{{ currentOrder.orderNo }}</el-descriptions-item>
                    <el-descriptions-item label="订单状态">
                        <el-tag :type="statusTagType(currentOrder.status)" size="small">
                            {{ statusText(currentOrder.status) }}
                        </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="下单时间">{{ currentOrder.createTime || currentOrder.createdAt }}</el-descriptions-item>
                    <el-descriptions-item label="支付时间">{{ currentOrder.payTime || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="商品总额">¥{{ ((currentOrder.totalAmount || 0) / 100).toFixed(2) }}</el-descriptions-item>
                    <el-descriptions-item label="运费">¥{{ ((currentOrder.freightAmount || currentOrder.shippingFee || 0) / 100).toFixed(2) }}</el-descriptions-item>
                    <el-descriptions-item label="实付金额" :span="2">
                        <span class="price">¥{{ ((currentOrder.payAmount || currentOrder.actualAmount || 0) / 100).toFixed(2) }}</span>
                    </el-descriptions-item>
                </el-descriptions>

                <h4 class="section-title">收货信息</h4>
                <el-descriptions :column="2" border>
                    <el-descriptions-item label="收货人">{{ currentOrder.consignee || currentOrder.name }}</el-descriptions-item>
                    <el-descriptions-item label="手机号">{{ currentOrder.phone || currentOrder.mobile }}</el-descriptions-item>
                    <el-descriptions-item label="收货地址" :span="2">{{ currentOrder.address || currentOrder.fullAddress }}</el-descriptions-item>
                </el-descriptions>

                <h4 class="section-title">商品列表</h4>
                <el-table :data="currentOrder.orderItemList || currentOrder.items || []" border size="small">
                    <el-table-column label="商品" min-width="180">
                        <template #default="scope">
                            <div class="goods-info">
                                <el-image
                                    :src="scope.row.image || scope.row.thumb"
                                    style="width: 40px; height: 40px; border-radius: 4px"
                                    fit="cover"
                                >
                                    <template #error>
                                        <div class="image-slot"><el-icon><Picture /></el-icon></div>
                                    </template>
                                </el-image>
                                <div class="goods-title">{{ scope.row.title || scope.row.goodsTitle }}</div>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column label="规格" width="120">
                        <template #default="scope">
                            <el-tag v-for="(spec, si) in (scope.row.specInfo || [])" :key="si" size="small" class="mr-1">
                                {{ spec.specValue }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="单价" width="80" align="center">
                        <template #default="scope">
                            ¥{{ ((scope.row.price || scope.row.salePrice || 0) / 100).toFixed(2) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="数量" width="60" align="center" prop="num" />
                    <el-table-column label="小计" width="80" align="center">
                        <template #default="scope">
                            <span class="price">¥{{ (((scope.row.price || scope.row.salePrice || 0) * (scope.row.num || scope.row.quantity)) / 100).toFixed(2) }}</span>
                        </template>
                    </el-table-column>
                </el-table>

                <!-- 物流信息 -->
                <template v-if="currentOrder.status >= 2">
                    <h4 class="section-title">物流信息</h4>
                    <el-descriptions :column="2" border>
                        <el-descriptions-item label="物流公司">{{ currentOrder.shippingCompany || currentOrder.deliveryCompany || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="物流单号">{{ currentOrder.shippingNo || currentOrder.deliveryNo || '-' }}</el-descriptions-item>
                    </el-descriptions>
                </template>
            </template>
        </el-drawer>

        <!-- 打印记录对话框 -->
        <el-dialog v-model="ticketLogsVisible" :title="'打印记录 - ' + ticketLogsOrderNo" width="1000px" destroy-on-close>
            <el-table :data="ticketLogs" border size="small" v-loading="ticketLogsLoading" empty-text="该订单暂无打印记录">
                <el-table-column label="触发方式" width="100" align="center">
                    <template #default="scope">
                        <el-tag :type="ticketTriggerTagType(scope.row.triggerType)" size="small">
                            {{ ticketTriggerText(scope.row.triggerType) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="设备SN" prop="printerSn" width="150" />
                <el-table-column label="状态" width="90" align="center">
                    <template #default="scope">
                        <el-tag :type="ticketTagType(scope.row.status)" size="small">
                            {{ ticketStatusText(scope.row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="飞鹅订单ID" prop="feieOrderId" min-width="240" show-overflow-tooltip />
                <el-table-column label="打印时间" prop="createTime" width="160" align="center" />
                <el-table-column label="备注" prop="message" min-width="150" show-overflow-tooltip />
            </el-table>
        </el-dialog>

        <!-- 重复打印确认对话框：展示打印记录 + 继续/取消 -->
        <el-dialog v-model="reprintDialogVisible" title="打印提示" width="1000px" :close-on-click-modal="false" destroy-on-close>
            <el-alert
                type="warning"
                :closable="false"
                show-icon
                title="该订单已打印过小票，是否继续打印？"
                style="margin-bottom: 12px"
            />
            <el-table :data="reprintLogs" border size="small" max-height="300" empty-text="该订单暂无打印记录">
                <el-table-column label="触发方式" width="100" align="center">
                    <template #default="scope">
                        <el-tag :type="ticketTriggerTagType(scope.row.triggerType)" size="small">
                            {{ ticketTriggerText(scope.row.triggerType) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="设备SN" prop="printerSn" width="150" />
                <el-table-column label="状态" width="90" align="center">
                    <template #default="scope">
                        <el-tag :type="ticketTagType(scope.row.status)" size="small">
                            {{ ticketStatusText(scope.row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="飞鹅订单ID" prop="feieOrderId" min-width="240" show-overflow-tooltip />
                <el-table-column label="打印时间" prop="createTime" width="160" align="center" />
                <el-table-column label="备注" prop="message" min-width="150" show-overflow-tooltip />
            </el-table>
            <template #footer>
                <el-button autofocus @click="reprintDialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="printingNo === reprintOrderNo" @click="handleReprintConfirm">
                    继续打印
                </el-button>
            </template>
        </el-dialog>

        <!-- 发货对话框 -->
        <el-dialog v-model="shipDialogVisible" title="订单发货" width="450px" destroy-on-close>
            <el-form ref="shipFormRef" :model="shipForm" :rules="shipFormRules" label-width="80px">
                <el-form-item label="物流公司" prop="shippingCompany">
                    <el-select v-model="shipForm.shippingCompany" placeholder="选择物流公司" style="width: 100%">
                        <el-option label="顺丰速运" value="顺丰速运" />
                        <el-option label="中通快递" value="中通快递" />
                        <el-option label="圆通速递" value="圆通速递" />
                        <el-option label="韵达快递" value="韵达快递" />
                        <el-option label="申通快递" value="申通快递" />
                        <el-option label="邮政EMS" value="邮政EMS" />
                        <el-option label="极兔速递" value="极兔速递" />
                    </el-select>
                </el-form-item>
                <el-form-item label="物流单号" prop="shippingNo">
                    <el-input v-model="shipForm.shippingNo" placeholder="请输入物流单号" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="shipDialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="shipLoading" @click="handleShipConfirm">确认发货</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh, Picture, View, Top, Close, Delete, Warning, Printer, Tickets } from '@element-plus/icons-vue'
import { getOrderList, getOrderDetail, processOrder, deleteOrder, refundOrder } from '~/api/order'
import { printTicket, getPrintLogs } from '~/api/printer'
import { toast, showModal } from '~/composables/util'

const loading = ref(false)
const tableData = ref([])
const router = useRouter()

const filterForm = reactive({
    orderNo: '',
    consignee: '',
    phone: '',
    status: null,
})

// 订单状态平铺列表（value 为 null 表示全部）
const statusList = [
    { label: '全部', value: null },
    { label: '待付款', value: 0 },
    { label: '待发货', value: 1 },
    { label: '已发货', value: 2 },
    { label: '已签收', value: 3 },
    { label: '已完成', value: 4 },
    { label: '已取消', value: -1 },
]
const activeStatus = ref(null)

// 点击左侧状态：右侧按状态加载
function handleStatusClick(status) {
    activeStatus.value = status
    filterForm.status = status
    pager.pageNum = 1
    handleSearch()
}

const pager = reactive({
    pageNum: 1,
    pageSize: 10,
    total: 0,
})

// 订单状态映射
function statusText(status) {
    const map = { '-1': '已取消', 0: '待付款', 1: '待发货', 2: '已发货', 3: '已签收', 4: '已完成' }
    return map[status] ?? '未知'
}

function statusTagType(status) {
    const map = { '-1': 'info', 0: 'warning', 1: 'danger', 2: 'primary', 3: 'success', 4: 'success' }
    return map[status] ?? 'info'
}

// 搜索
async function handleSearch() {
    loading.value = true
    try {
        const params = {
            pageNum: pager.pageNum,
            pageSize: pager.pageSize,
        }
        if (filterForm.orderNo) params.orderNo = filterForm.orderNo
        if (filterForm.consignee) params.consignee = filterForm.consignee
        if (filterForm.phone) params.phone = filterForm.phone
        if (filterForm.status !== null && filterForm.status !== '') params.status = filterForm.status

        const data = await getOrderList(params)
        const list = data && data.data ? data.data : data
        tableData.value = list.list || list.records || []
        pager.total = list.total || list.totalCount || 0
    } catch (e) {
        console.error('加载订单列表失败', e)
    } finally {
        loading.value = false
    }
}

// 重置
function handleReset() {
    filterForm.orderNo = ''
    filterForm.consignee = ''
    filterForm.phone = ''
    filterForm.status = null
    activeStatus.value = null
    pager.pageNum = 1
    handleSearch()
}

// 查看详情
const drawerVisible = ref(false)
const currentOrder = ref(null)

// 订单商品列表（兼容不同字段名）
function goodsList(row) {
    return row.orderItemList || row.items || []
}

// 商品单价（分→元）
function goodsPrice(item) {
    return (Number(item.price || 0) / 100).toFixed(2)
}

// 小票打印状态映射（-2=未开启 -1=未打印 0=已提交 1=打印成功 2=打印失败）
function ticketStatusText(status) {
    const map = { '-2': '未开启', '-1': '未打印', 0: '已提交', 1: '成功', 2: '失败' }
    return map[status] ?? '未打印'
}

function ticketTagType(status) {
    const map = { '-2': 'info', '-1': 'info', 0: 'warning', 1: 'success', 2: 'danger' }
    return map[status] ?? 'info'
}

// 打印触发方式映射（auto=支付回调自动 manual=手工点击 test=测试打印）
function ticketTriggerText(type) {
    const map = { auto: '自动', manual: '手动', test: '测试' }
    return map[type] || (type ? type : '未知')
}

function ticketTriggerTagType(type) {
    const map = { auto: 'success', manual: 'primary', test: 'info' }
    return map[type] || 'info'
}

// 查看订单打印记录
const ticketLogsVisible = ref(false)
const ticketLogsLoading = ref(false)
const ticketLogsOrderNo = ref('')
const ticketLogs = ref([])
async function handleViewTicketLogs(row) {
    ticketLogsOrderNo.value = row.orderNo
    ticketLogsVisible.value = true
    ticketLogsLoading.value = true
    ticketLogs.value = []
    try {
        const data = await getPrintLogs({ orderNo: row.orderNo, pageSize: 50 })
        const result = data && data.data ? data.data : data
        ticketLogs.value = (result && result.list) || []
    } catch (e) {
        console.error('加载打印记录失败', e)
        toast('加载打印记录失败', 'error')
    } finally {
        ticketLogsLoading.value = false
    }
}

// 云打印小票（飞鹅设备出票，自动/手动入口）
const printingNo = ref('')
async function handleTicketPrint(row) {
    if (printingNo.value) return
    // 先查后台打印记录，若已打印过（已提交/打印成功）则弹窗展示记录并确认
    let logs = []
    try {
        const data = await getPrintLogs({ orderNo: row.orderNo, pageSize: 50 })
        const result = data && data.data ? data.data : data
        logs = (result && result.list) || []
    } catch (e) {
        // 查询记录失败不阻断打印
        console.error('查询打印记录失败', e)
    }
    if (logs.some(l => l.status === 0 || l.status === 1)) {
        reprintOrderNo.value = row.orderNo
        reprintLogs.value = logs
        reprintDialogVisible.value = true
        return
    }
    doPrintTicket(row.orderNo)
}

// 重复打印确认框（展示打印记录，点「继续打印」才提交）
const reprintDialogVisible = ref(false)
const reprintOrderNo = ref('')
const reprintLogs = ref([])
async function handleReprintConfirm() {
    reprintDialogVisible.value = false
    await doPrintTicket(reprintOrderNo.value)
}

async function doPrintTicket(orderNo) {
    printingNo.value = orderNo
    try {
        const data = await printTicket(orderNo)
        const result = data && data.data ? data.data : data
        if (result && result.success === false) {
            toast(result.message || '打印失败', 'error')
        } else {
            toast(result?.message || '打印指令已发送', 'success')
        }
    } catch (e) {
        console.error('云打印小票失败', e)
        toast('打印失败，请检查飞鹅配置', 'error')
    } finally {
        printingNo.value = ''
    }
}

// 打印小票
function handlePrint(row) {
    // Hash 模式路由，需用 router.resolve 生成带 # 的 URL
    const url = router.resolve(`/order/print?orderNo=${row.orderNo}`).href
    window.open(url)
}

async function handleView(row) {
    drawerVisible.value = true
    currentOrder.value = null
    try {
        const data = await getOrderDetail(row.orderNo)
        currentOrder.value = data && data.data ? data.data : data
    } catch (e) {
        console.error('加载订单详情失败', e)
    }
}

// 发货
const shipDialogVisible = ref(false)
const shipLoading = ref(false)
const shipFormRef = ref(null)
const shipOrderNo = ref('')

const shipForm = reactive({
    shippingCompany: '',
    shippingNo: '',
})

const shipFormRules = {
    shippingCompany: [{ required: true, message: '请选择物流公司', trigger: 'change' }],
    shippingNo: [{ required: true, message: '请输入物流单号', trigger: 'blur' }],
}

function handleShip(row) {
    shipOrderNo.value = row.orderNo
    shipForm.shippingCompany = ''
    shipForm.shippingNo = ''
    shipDialogVisible.value = true
}

async function handleShipConfirm() {
    if (!shipFormRef.value) return
    try {
        await shipFormRef.value.validate()
    } catch {
        return
    }

    shipLoading.value = true
    try {
        await processOrder(shipOrderNo.value, {
            shippingCompany: shipForm.shippingCompany,
            shippingNo: shipForm.shippingNo,
        })
        toast('发货成功', 'success')
        shipDialogVisible.value = false
        handleSearch()
    } catch (e) {
        console.error('发货失败', e)
    } finally {
        shipLoading.value = false
    }
}

// 取消订单
async function handleCancel(row) {
    const confirmed = await showModal('确定要取消该订单吗？', 'warning', '取消确认').then(() => true).catch(() => false)
    if (!confirmed) return
    try {
        await processOrder(row.orderNo, { status: -1 })
        toast('订单已取消', 'success')
        handleSearch()
    } catch (e) {
        console.error('取消订单失败', e)
    }
}

// 退款
async function handleRefund(row) {
    const confirmed = await showModal('确认退款？退款金额 ' + ((row.payAmount || 0) / 100).toFixed(2) + ' 元将原路返还用户', 'warning', '退款确认').then(() => true).catch(() => false)
    if (!confirmed) return
    try {
        await refundOrder({ orderNo: row.orderNo, reason: '' })
        toast('退款成功', 'success')
        handleSearch()
    } catch (e) {
        console.error('退款失败', e)
    }
}

// 删除订单
async function handleDelete(row) {
    const confirmed = await showModal('确定要删除该订单吗？此操作不可恢复！', 'error', '删除确认').then(() => true).catch(() => false)
    if (!confirmed) return
    try {
        await deleteOrder(row.orderNo)
        toast('删除成功', 'success')
        handleSearch()
    } catch (e) {
        console.error('删除失败', e)
    }
}

onMounted(() => {
    handleSearch()
})
</script>

<style scoped>
.order-page {
    height: calc(100vh - 100px);
    overflow: hidden;
    display: flex;
    gap: 12px;
}

.side-panel {
    width: 200px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
}

.side-section {
    background: #fff;
    border-radius: 4px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.side-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 2px;
}

.status-item {
    padding: 7px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    color: #606266;
    transition: all 0.2s;
    user-select: none;
}

.status-item:hover {
    background: #ecf5ff;
    color: #409eff;
}

.status-item.active {
    background: #409eff;
    color: #fff;
    font-weight: 500;
}

.side-btn {
    width: 100%;
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
}

.page-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
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

.phone-text {
    font-size: 12px;
    color: #909399;
}

.ticket-status {
    cursor: pointer;
}

.ticket-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    margin-top: 4px;
}

.ticket-actions :deep(.el-button) {
    margin-left: 0;
    padding: 0;
    height: auto;
}

.goods-info {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
}

.goods-info + .goods-info {
    border-top: 1px dashed #ebeef5;
}

.goods-detail {
    flex: 1;
    min-width: 0;
}

.goods-title {
    font-size: 13px;
    color: #303133;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.goods-spec {
    margin-top: 4px;
}

.goods-qty {
    font-size: 13px;
    color: #909399;
    flex-shrink: 0;
}

.goods-amount {
    margin-top: 2px;
    font-size: 13px;
}

.section-title {
    margin: 20px 0 12px;
    font-size: 15px;
    color: #303133;
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

.mr-1 {
    margin-right: 4px;
}
</style>
