<template>
    <div class="print-page">
        <!-- 工具栏（内嵌预览时整栏隐藏，打印时隐藏） -->
        <div v-if="!embed" class="toolbar no-print">
            <el-button type="primary" @click="handlePrint" :loading="loading">
                <el-icon><Printer /></el-icon> 打印小票
            </el-button>
            <el-button v-if="!embed" @click="goBack">
                <el-icon><Back /></el-icon> 返回
            </el-button>
        </div>

        <!-- 小票内容（57mm 热敏小票，与飞鹅实际打印所见即所得） -->
        <div class="ticket-wrap">
            <div v-if="loading" class="ticket-loading">加载中...</div>
            <div v-else-if="error" class="ticket-loading">{{ error }}</div>
            <TicketContent v-else :shop="shop" :order="order" />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Printer, Back } from '@element-plus/icons-vue'
import TicketContent from '~/components/TicketContent.vue'
import { getPrintTicket } from '~/api/order'

const route = useRoute()
const router = useRouter()

// embed=1 表示在订单列表弹窗中内嵌预览，隐藏"返回"按钮
const embed = route.query.embed === '1'

const loading = ref(true)
const error = ref('')
const shop = ref({})
const order = ref({})

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
}
</style>
