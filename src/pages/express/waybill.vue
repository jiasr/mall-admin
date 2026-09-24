<template>
    <div class="waybill-page">
        <el-card class="content-card" shadow="never">
            <div class="content-header">
                <div class="header-left">
                    <span class="page-title">运单管理</span>
                </div>
                <el-form :inline="true" :model="filterForm" class="search-form">
                    <el-form-item label="订单号">
                        <el-input v-model="filterForm.orderNo" placeholder="订单号" clearable @keyup.enter="handleSearch" />
                    </el-form-item>
                    <el-form-item label="运单号">
                        <el-input v-model="filterForm.waybillNo" placeholder="物流单号" clearable @keyup.enter="handleSearch" />
                    </el-form-item>
                    <el-form-item label="物流公司">
                        <el-input v-model="filterForm.company" placeholder="如 SF / 中通快递" clearable @keyup.enter="handleSearch" />
                    </el-form-item>
                    <el-form-item>
                        <el-checkbox v-model="withWxStatus">同步微信运单状态</el-checkbox>
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
                <el-table-column prop="orderNo" label="订单号" min-width="190" show-overflow-tooltip />
                <el-table-column prop="waybillNo" label="运单号" min-width="160" show-overflow-tooltip />
                <el-table-column label="发货渠道" width="130">
                    <template #default="scope">
                        <el-tag size="small" :type="scope.row.channel === '手动发货' ? 'info' : 'success'">
                            {{ scope.row.channel }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="company" label="物流公司" width="120" />
                <el-table-column prop="consignee" label="收件人" width="100" />
                <el-table-column prop="shippedAt" label="发货时间" width="170" />
                <el-table-column label="运单状态" width="130">
                    <template #default="scope">
                        <el-tag v-if="scope.row.waybillStateDesc" size="small" type="primary">
                            {{ scope.row.waybillStateDesc }}
                        </el-tag>
                        <span v-else class="text-muted">-</span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="260" fixed="right" align="center">
                    <template #default="scope">
                        <el-button type="primary" size="small" link @click="openWaybill(scope.row.orderNo)">
                            <el-icon><Document /></el-icon> 面单
                        </el-button>
                        <el-button type="success" size="small" link @click="openTrack(scope.row)">
                            <el-icon><Van /></el-icon> 轨迹
                        </el-button>
                        <el-button type="danger" size="small" link @click="handleCancelWaybill(scope.row)">
                            <el-icon><RefreshLeft /></el-icon> 取消运单
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-wrap">
                <el-pagination
                    v-model:current-page="pager.pageNum"
                    v-model:page-size="pager.pageSize"
                    :page-sizes="[10, 20, 50]"
                    :total="pager.total"
                    layout="total, sizes, prev, pager, next, jumper"
                    background
                    size="small"
                    @size-change="handleSearch"
                    @current-change="loadData"
                />
            </div>
        </el-card>

        <!-- 电子面单预览 -->
        <el-dialog v-model="waybillVisible" title="电子面单" width="500px" align-center destroy-on-close>
            <div v-loading="waybillLoading" class="waybill-wrap">
                <img v-if="waybillImage" :src="waybillImage" class="waybill-img" alt="电子面单" />
                <template v-else-if="waybillHtml">
                    <div class="waybill-toolbar">
                        <el-button size="small" @click="scaleDown">缩小</el-button>
                        <span class="scale-text">{{ Math.round(waybillScale * 100) }}%</span>
                        <el-button size="small" @click="scaleUp">放大</el-button>
                        <el-button size="small" @click="fitWidth">适应宽度</el-button>
                    </div>
                    <div ref="waybillViewport" class="waybill-viewport">
                        <div class="waybill-paper-box" :style="{ height: paperHeight ? paperHeight + 'px' : 'auto' }">
                            <div
                                ref="waybillPaper"
                                class="waybill-paper"
                                :style="{ transform: 'scale(' + waybillScale + ')' }"
                            >
                                <div v-html="waybillHtml"></div>
                            </div>
                        </div>
                    </div>
                </template>
                <div v-else class="preview-empty">
                    <p v-if="waybillBillCode">运单号：{{ waybillBillCode }}</p>
                    <p v-if="waybillMessage">{{ waybillMessage }}</p>
                    <p v-else class="text-muted">暂无面单图片</p>
                </div>
                <el-collapse v-if="waybillRaw" class="raw-collapse">
                    <el-collapse-item title="查看原始返回">
                        <pre class="raw-pre">{{ waybillRawText }}</pre>
                    </el-collapse-item>
                </el-collapse>
            </div>
            <template #footer>
                <el-button @click="waybillVisible = false">关闭</el-button>
                <el-button type="primary" :disabled="!waybillImage && !waybillHtml" @click="printWaybill">打印</el-button>
            </template>
        </el-dialog>

        <!-- 物流轨迹 -->
        <el-dialog v-model="trackVisible" title="物流轨迹" width="560px" align-center destroy-on-close>
            <div v-loading="trackLoading" class="track-wrap">
                <el-timeline v-if="trackList.length">
                    <el-timeline-item
                        v-for="(t, i) in trackList"
                        :key="i"
                        :timestamp="t.time || ''"
                        :type="i === 0 ? 'primary' : 'info'"
                        placement="top"
                    >
                        <div>{{ t.status || '-' }}</div>
                        <div v-if="t.location" class="track-location">{{ t.location }}</div>
                    </el-timeline-item>
                </el-timeline>
                <div v-else class="preview-empty">{{ trackError || '暂无轨迹信息' }}</div>
            </div>
            <template #footer>
                <el-button @click="trackVisible = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { Search, Refresh, Document, Van, RefreshLeft } from '@element-plus/icons-vue'
import { getWaybillList, cancelExpressWaybill, getExpressTrack, getWaybillPrint } from '~/api/express'
import { getWaybill } from '~/api/order'
import { toast, showModal } from '~/composables/util'

const loading = ref(false)
const tableData = ref([])
const pager = reactive({ pageNum: 1, pageSize: 20, total: 0 })
const filterForm = reactive({ orderNo: '', waybillNo: '', company: '' })
const withWxStatus = ref(true)

// 面单预览
const waybillVisible = ref(false)
const waybillLoading = ref(false)
const waybillImage = ref('')
const waybillHtml = ref('')
const waybillBillCode = ref('')
const waybillMessage = ref('')
const waybillRaw = ref(null)

// 轨迹
const trackVisible = ref(false)
const trackLoading = ref(false)
const trackList = ref([])
const trackError = ref('')

async function loadData() {
    loading.value = true
    try {
        const res = await getWaybillList({
            ...filterForm,
            pageNum: pager.pageNum,
            pageSize: pager.pageSize,
            withWxStatus: withWxStatus.value ? 1 : '',
        })
        const outer = res && res.data ? res.data : res
        const inner = outer && outer.data ? outer.data : outer
        tableData.value = (inner && inner.list) || []
        pager.total = (inner && inner.total) || 0
    } catch (e) {
        console.error(e)
        toast('加载运单列表失败', 'error')
    } finally {
        loading.value = false
    }
}

function handleSearch() {
    pager.pageNum = 1
    loadData()
}

function handleReset() {
    filterForm.orderNo = ''
    filterForm.waybillNo = ''
    filterForm.company = ''
    handleSearch()
}

async function openWaybill(orderNo) {
    waybillVisible.value = true
    waybillLoading.value = true
    waybillImage.value = ''
    waybillHtml.value = ''
    waybillBillCode.value = ''
    waybillMessage.value = ''
    waybillRaw.value = null
    // 1) 优先实时向渠道取（微信返回面单 HTML，中通返回面单图片）
    try {
        const res = await getWaybillPrint(orderNo)
        const result = res && res.data ? res.data : res
        if (result && result.success === false) {
            waybillMessage.value = result.message || '未获取到面单'
        } else {
            waybillBillCode.value = result?.waybillNo || ''
            waybillHtml.value = result?.html || ''
            waybillImage.value = result?.printImage || ''
            waybillRaw.value = result?.waybillExtras || null
            if (!waybillHtml.value && !waybillImage.value) {
                waybillMessage.value = '渠道未返回面单内容'
            }
            waybillLoading.value = false
            return
        }
    } catch (e) {
        console.error('实时获取面单失败，回退本地数据', e)
    }
    // 2) 回退：用下单时本地保存的面单数据
    try {
        const res = await getWaybill(orderNo)
        const result = res && res.data ? res.data : res
        if (result && result.success === false) {
            waybillMessage.value = result.message || '该订单未生成电子面单'
            return
        }
        const data = (result && result.waybillData) || result
        waybillBillCode.value = (data && (data.billCode || data.waybillId)) || ''
        waybillImage.value = (data && data.printImage) || ''
        waybillHtml.value = (data && (data.waybillHtml || data.printHtml)) || ''
        waybillRaw.value = data || null
    } catch (e) {
        console.error(e)
        waybillMessage.value = '获取面单失败'
    } finally {
        // 面单 HTML 渲染完成后自动缩放到适应对话框宽度
        if (waybillHtml.value) {
            await fitWidth()
        }
        waybillLoading.value = false
    }
}

// ===== 面单缩放（微信面单 HTML 尺寸固定，需缩放以适应对话框） =====
const waybillViewport = ref(null)
const waybillPaper = ref(null)
const waybillScale = ref(1)
const paperHeight = ref(0)

async function applyPaperHeight() {
    await nextTick()
    const paper = waybillPaper.value
    if (!paper) return
    // offsetHeight 不受 transform 影响，按缩放比例换算外层高度，避免出现大片空白
    paperHeight.value = Math.ceil((paper.offsetHeight || 0) * (waybillScale.value || 1))
}

async function fitWidth() {
    await nextTick()
    const vp = waybillViewport.value
    const paper = waybillPaper.value
    if (!vp || !paper) return
    waybillScale.value = 1
    await nextTick()
    const naturalW = paper.scrollWidth || paper.offsetWidth || 380
    const avail = (vp.clientWidth || naturalW) - 12
    const s = Math.min(1, +(avail / naturalW).toFixed(3))
    waybillScale.value = s > 0 ? s : 1
    await applyPaperHeight()
}

function scaleUp() {
    waybillScale.value = Math.min(2, +((waybillScale.value || 1) + 0.1).toFixed(2))
    applyPaperHeight()
}

function scaleDown() {
    waybillScale.value = Math.max(0.3, +((waybillScale.value || 1) - 0.1).toFixed(2))
    applyPaperHeight()
}

function printWaybill() {
    const w = window.open('', '_blank')
    if (!w) {
        toast('请允许浏览器弹出窗口后重试', 'error')
        return
    }
    if (waybillImage.value) {
        w.document.write(
            '<html><head><title>电子面单</title></head><body style="margin:0;text-align:center">' +
            '<img src="' + waybillImage.value + '" style="width:100mm" /></body></html>'
        )
    } else {
        w.document.write(waybillHtml.value || '')
    }
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 300)
}

async function openTrack(row) {
    trackVisible.value = true
    trackLoading.value = true
    trackList.value = []
    trackError.value = ''
    try {
        const res = await getExpressTrack({ deliveryId: row.company, waybillId: row.waybillNo })
        const result = res && res.data ? res.data : res
        const list = Array.isArray(result) ? result : ((result && (result.list || result.data)) || [])
        trackList.value = list
        if (!list.length) trackError.value = (result && result.message) || '暂无轨迹信息'
    } catch (e) {
        console.error(e)
        trackError.value = '查询轨迹失败'
    } finally {
        trackLoading.value = false
    }
}

async function handleCancelWaybill(row, force = false) {
    const confirmed = await showModal(
        '将向物流侧撤销运单 ' + row.waybillNo + '，并把订单恢复为「待发货」。确定继续吗？',
        'warning',
        '取消运单确认'
    ).then(() => true).catch(() => false)
    if (!confirmed) return
    try {
        const res = await cancelExpressWaybill(row.orderNo, force ? 1 : 0)
        const result = res && res.data ? res.data : res
        if (result && result.success === false) {
            toast(result.message || '取消运单失败', 'error')
            return
        }
        toast(result?.message || '运单已撤销，订单恢复为待发货', 'success')
        loadData()
    } catch (e) {
        console.error(e)
        const payload = e?.response?.data || {}
        const code = payload.errCode || ''
        const msg = payload.exceptionMsg || payload.errMessage || '取消运单失败'
        // 渠道撤销失败时，询问是否仅本地回滚
        if (!force && (code === 'WX_CANCEL_FAILED' || code === 'ZTO_CANCEL_FAILED')) {
            const ok = await showModal(
                '物流侧撤销失败：' + msg + '\n是否仅做本地撤销？（订单恢复待发货，但快递侧运单可能仍在）',
                'warning',
                '渠道撤销失败'
            ).then(() => true).catch(() => false)
            if (ok) await handleCancelWaybill(row, true)
            return
        }
        toast(msg, 'error')
    }
}

onMounted(() => { loadData() })
</script>

<script>
export default { name: 'ExpressWaybill' }
</script>

<style scoped>
.content-card {
    border: none;
}

.content-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 16px;
}

.page-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
}

.search-form {
    margin: 0;
}

.pagination-wrap {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
}

.waybill-wrap,
.track-wrap {
    max-height: 460px;
    overflow-y: auto;
}

.waybill-img {
    width: 100%;
    display: block;
}

.track-location {
    color: #999;
    font-size: 12px;
}

.preview-empty {
    padding: 24px 0;
    text-align: center;
    color: #606266;
}

.raw-collapse {
    margin-top: 12px;
}

.raw-pre {
    font-size: 12px;
    white-space: pre-wrap;
    word-break: break-all;
}

.text-muted {
    color: #c0c4cc;
}

.waybill-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.scale-text {
    font-size: 12px;
    color: #606266;
    min-width: 46px;
    text-align: center;
}

.waybill-viewport {
    overflow: auto;
    max-height: 440px;
    background: #fafafa;
    border: 1px solid #ebeef5;
    padding: 6px;
}

.waybill-paper-box {
    overflow: hidden;
}

.waybill-paper {
    transform-origin: top left;
    width: 380px;
    background: #fff;
}
</style>
