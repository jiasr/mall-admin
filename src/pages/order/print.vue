<template>
    <div class="print-page">
        <!-- 工具栏（打印时隐藏） -->
        <div class="toolbar no-print">
            <el-button type="primary" @click="handlePrint" :loading="loading">
                <el-icon><Printer /></el-icon> 打印小票
            </el-button>
            <el-button @click="goBack">
                <el-icon><Back /></el-icon> 返回
            </el-button>
        </div>

        <!-- 小票内容（57mm 热敏小票） -->
        <div class="ticket-wrap">
            <div v-if="loading" class="ticket-loading">加载中...</div>
            <div v-else-if="error" class="ticket-loading">{{ error }}</div>
            <div v-else class="ticket">
                <!-- 店铺头部 -->
                <div class="ticket-header">
                    <div class="shop-name">{{ shop.name || '商城' }}</div>
                    <div v-if="shop.phone" class="shop-line">电话：{{ shop.phone }}</div>
                </div>

                <div class="divider">- - - - - - - - - - - - - -</div>

                <!-- 订单信息 -->
                <div class="info-row"><span>订单号：</span><span>{{ order.orderNo }}</span></div>
                <div class="info-row"><span>下单时间：</span><span>{{ order.createTime }}</span></div>
                <div class="info-row"><span>支付时间：</span><span>{{ order.paidAt || '-' }}</span></div>
                <div class="info-row">
                    <span>订单状态：</span><span>{{ statusName }}</span>
                </div>
                <div class="info-row">
                    <span>支付方式：</span><span>{{ paymentName }}</span>
                </div>
                <div v-if="order.shippingNo" class="info-row">
                    <span>物流：</span><span>{{ order.shippingCompany }} {{ order.shippingNo }}</span>
                </div>

                <div class="divider">- - - - - - - - - - - - - -</div>

                <!-- 商品明细 -->
                <div class="goods-header">
                    <span class="col-name">商品</span>
                    <span class="col-price">单价</span>
                    <span class="col-qty">数量</span>
                    <span class="col-subtotal">小计</span>
                </div>
                <div v-for="(g, i) in order.orderItemList" :key="i" class="goods-item">
                    <div class="goods-line">
                        <div class="goods-left">
                            <span v-if="g.barcode" class="goods-barcode">{{ g.barcode }}|</span>
                            <span class="goods-title">{{ g.title }}</span>
                            <span v-if="g.specInfo && g.specInfo.length" class="goods-spec">
                                ({{ g.specInfo.map(s => s.specValue).join('/') }})
                            </span>
                        </div>
                        <div class="goods-right">
                            <span class="col-price">{{ fen2yuan(g.price) }}</span>
                            <span class="col-qty">x{{ g.quantity }}</span>
                            <span class="col-subtotal">{{ fen2yuan(g.subtotal) }}</span>
                        </div>
                    </div>
                </div>

                <div class="divider">- - - - - - - - - - - - - -</div>

                <!-- 金额汇总 -->
                <div class="amount-row"><span>商品金额</span><span>{{ fen2yuan(order.goodsAmount) }}</span></div>
                <div class="amount-row"><span>运费</span><span>{{ fen2yuan(order.freightAmount) }}</span></div>
                <div v-if="(order.discountAmount || 0) > 0" class="amount-row">
                    <span>优惠</span><span>-{{ fen2yuan(order.discountAmount) }}</span>
                </div>
                <div class="amount-row pay-amount"><span>实付金额</span><span>￥{{ fen2yuan(order.payAmount) }}</span></div>

                <div class="divider">- - - - - - - - - - - - - -</div>

                <!-- 收货信息 -->
                <div class="info-row"><span>收货人：</span><span>{{ order.consignee }} {{ order.phone }}</span></div>
                <div class="info-row"><span>收货地址：</span><span>{{ order.address }}</span></div>
                <div v-if="order.remark" class="info-row"><span>备注：</span><span>{{ order.remark }}</span></div>

                <div class="divider">- - - - - - - - - - - - - -</div>

                <!-- 页脚 -->
                <div class="ticket-footer">谢谢惠顾，欢迎再次光临！</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Printer, Back } from '@element-plus/icons-vue'
import { getPrintTicket } from '~/api/order'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const shop = ref({})
const order = ref({})

const STATUS_NAMES = { 0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消' }
const PAYMENT_NAMES = { wechat: '微信支付', '': '未支付' }

const statusName = computed(() => STATUS_NAMES[order.value.status] || '未知')
const paymentName = computed(() => PAYMENT_NAMES[order.value.paymentMethod] || order.value.paymentMethod || '未支付')

// 分 → 元
function fen2yuan(fen) {
    const v = Number(fen || 0)
    return (v / 100).toFixed(2)
}

function handlePrint() {
    window.print()
}

function goBack() {
    // 新窗口打开时无历史记录，直接跳回订单列表
    router.push('/order/list')
}

onMounted(async () => {
    const orderNo = route.query.orderNo
    if (!orderNo) {
        error.value = '缺少订单号参数'
        loading.value = false
        return
    }
    try {
        const data = await getPrintTicket(orderNo)
        const result = data && data.data ? data.data : data
        if (result && result.success === false) {
            error.value = result.message || '订单不存在'
        } else if (result && result.order) {
            shop.value = result.shop || {}
            order.value = result.order
        } else {
            error.value = '数据加载失败'
        }
    } catch (e) {
        console.error('加载小票数据失败', e)
        error.value = '加载失败：' + (e.message || '网络异常')
    } finally {
        loading.value = false
    }
})
</script>

<style scoped>
.print-page {
    padding: 20px;
    background: #f0f2f5;
    min-height: 100vh;
}

.toolbar {
    max-width: 320px;
    margin: 0 auto 16px;
    text-align: center;
}

.ticket-wrap {
    max-width: 320px;
    margin: 0 auto;
    background: #fff;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.ticket-loading {
    padding: 60px 0;
    text-align: center;
    color: #999;
}

.ticket {
    width: 48mm;
    margin: 0 auto;
    font-family: 'Courier New', Consolas, monospace;
    font-size: 9px;
    color: #000;
    line-height: 1.6;
}

.ticket-header {
    text-align: center;
    margin-bottom: 4px;
}

.shop-name {
    font-size: 13px;
    font-weight: bold;
}

.shop-line {
    font-size: 9px;
}

.divider {
    text-align: center;
    color: #333;
    letter-spacing: 1px;
    margin: 3px 0;
    font-size: 8px;
}

.info-row {
    display: flex;
    justify-content: space-between;
    font-size: 9px;
}

.info-row span:last-child {
    text-align: right;
    word-break: break-all;
}

.goods-header {
    display: flex;
    font-weight: bold;
    padding: 2px 0;
    border-bottom: 1px solid #000;
}

.col-name {
    flex: 1;
}

.col-price {
    width: 38px;
    text-align: right;
}

.col-qty {
    width: 26px;
    text-align: center;
}

.col-subtotal {
    width: 42px;
    text-align: right;
}

.goods-item {
    padding: 2px 0;
    border-bottom: 1px dashed #ccc;
}

.goods-line {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    font-size: 9px;
}

.goods-left {
    flex: 1;
    word-break: break-all;
    padding-right: 2px;
}

.goods-barcode {
    font-weight: bold;
    font-size: 8px;
    letter-spacing: 0;
    white-space: nowrap;
}

.goods-title {
    font-size: 9px;
}

.goods-spec {
    color: #666;
    font-size: 8px;
}

.goods-right {
    display: flex;
    flex-shrink: 0;
}

.amount-row {
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    padding: 1px 0;
}

.pay-amount {
    font-size: 12px;
    font-weight: bold;
}

.ticket-footer {
    text-align: center;
    margin-top: 6px;
    font-size: 9px;
}

/* 打印样式：只打印小票 */
@media print {
    /* 声明 57mm 纸宽、零边距（驱动支持自定义纸张时直接生效） */
    @page {
        size: 57mm auto;
        margin: 0;
    }

    body {
        background: #fff !important;
    }

    .no-print {
        display: none !important;
    }

    .print-page {
        padding: 0;
        background: #fff;
        min-height: auto;
    }

    .ticket-wrap {
        max-width: none;
        margin: 0;
        padding: 0;
        box-shadow: none;
    }

    .ticket {
        width: 48mm;
    }
}
</style>
