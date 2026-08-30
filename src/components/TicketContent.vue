<template>
    <div class="ticket">
        <!-- 店铺头部 -->
        <div class="center-line shop-name">{{ shop.name || '商城' }}</div>
        <div v-if="shop.phone" class="center-line">电话: {{ shop.phone }}</div>

        <div class="divider">{{ line }}</div>

        <!-- 订单信息 -->
        <div class="line">订单号: {{ order.orderNo }}</div>
        <div v-if="order.createTime" class="line">下单时间: {{ order.createTime }}</div>
        <div v-if="order.paidAt" class="line">支付时间: {{ order.paidAt }}</div>
        <div class="line">订单状态: {{ statusName }}</div>
        <div class="line">支付方式: {{ paymentName }}</div>
        <div v-if="order.shippingNo" class="line">物流: {{ order.shippingCompany }} {{ order.shippingNo }}</div>

        <div class="divider">{{ line }}</div>

        <!-- 商品明细（单行紧凑排版） -->
        <div v-for="(g, i) in order.orderItemList" :key="i" class="line">
            {{ goodsName(g) }} x{{ g.quantity }}  ￥{{ fen2yuan(g.subtotal) }}
        </div>

        <div class="divider">{{ line }}</div>

        <!-- 金额汇总 -->
        <div class="line">商品金额: {{ fen2yuan(order.goodsAmount) }}</div>
        <div class="line">运费: {{ fen2yuan(order.freightAmount) }}</div>
        <div v-if="(order.discountAmount || 0) > 0" class="line">优惠: -{{ fen2yuan(order.discountAmount) }}</div>
        <div class="line pay-amount">实付金额: ￥{{ fen2yuan(order.payAmount) }}</div>

        <div class="divider">{{ line }}</div>

        <!-- 收货信息 -->
        <div class="line">收货人: {{ order.consignee }} {{ order.phone }}</div>
        <div class="line">收货地址: {{ order.address }}</div>
        <div v-if="order.remark" class="line">备注: {{ order.remark }}</div>

        <div class="divider">{{ line }}</div>

        <!-- 页脚 -->
        <div class="center-line">谢谢惠顾，欢迎再次光临！</div>
        <div class="line">打印时间: {{ printTime }}</div>

        <!-- 订单二维码：微信扫码查看订单号 -->
        <div class="center-line qr-area" v-if="qrDataUrl">
            <img :src="qrDataUrl" class="qr-img" alt="订单二维码" />
            <div class="line">扫码查看订单号: {{ order.orderNo }}</div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import QRCode from 'qrcode'

const props = defineProps({
    shop: { type: Object, default: () => ({}) },
    order: { type: Object, default: () => ({}) },
})

const qrDataUrl = ref('')

// 生成订单号二维码（使用本地 qrcode 依赖，无需 CDN）
function genQrCode(text) {
    qrDataUrl.value = ''
    QRCode.toDataURL(text, { width: 132, margin: 1, errorCorrectionLevel: 'M' })
        .then((url) => {
            qrDataUrl.value = url
        })
        .catch((err) => {
            console.error('二维码生成失败', err)
        })
}

watch(
    () => props.order.orderNo,
    (no) => {
        if (no) genQrCode(no)
    },
    { immediate: true }
)

const STATUS_NAMES = { 0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消' }
const PAYMENT_NAMES = { wechat: '微信支付', '': '未支付' }

const statusName = computed(() => STATUS_NAMES[props.order.status] || '未知')
const paymentName = computed(() => PAYMENT_NAMES[props.order.paymentMethod] || props.order.paymentMethod || '未支付')

// 分 → 元
function fen2yuan(fen) {
    const v = Number(fen || 0)
    return (v / 100).toFixed(2)
}

// 分隔线：与飞鹅 build_ticket_content 的 LINE 一致（32 个 -）
const line = '-'.repeat(32)

// 打印时间
const printTime = (() => {
    const d = new Date()
    const p = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
})()

// 商品名称：条码|标题(规格)
function goodsName(g) {
    const barcode = g.barcode ? g.barcode + '|' : ''
    const spec = g.specInfo && g.specInfo.length ? `(${g.specInfo.map(s => s.specValue).join('/')})` : ''
    return barcode + g.title + spec
}
</script>

<style scoped>
.ticket {
    width: 48mm;
    margin: 0 auto;
    font-family: 'Courier New', Consolas, monospace;
    font-size: 9px;
    color: #000;
    line-height: 1.6;
}

/* 与飞鹅 build_ticket_content 排版一致：普通行左对齐，头部/页脚居中 */
.line {
    font-size: 9px;
    word-break: break-all;
    white-space: pre-wrap;
}

.center-line {
    text-align: center;
    font-size: 9px;
}

.shop-name {
    font-size: 13px;
    font-weight: bold;
}

.divider {
    text-align: center;
    color: #333;
    margin: 3px 0;
    font-size: 8px;
    word-break: break-all;
}

.pay-amount {
    font-size: 12px;
    font-weight: bold;
}

.qr-area {
    margin-top: 8px;
}

.qr-img {
    width: 120px;
    height: 120px;
    display: block;
    margin: 0 auto;
}
</style>
