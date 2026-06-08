<template>
    <div class="groupon-add-page">
        <el-card class="main-card" shadow="never">
            <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" size="default">
                <!-- ====== 基本信息 ====== -->
                <el-divider content-position="left">
                    <span class="divider-title">活动信息</span>
                </el-divider>

                <el-form-item label="活动名称" prop="name">
                    <el-input v-model="form.name" placeholder="请输入团购活动名称" maxlength="100" show-word-limit />
                </el-form-item>

                <!-- ====== 选择团购商品 ====== -->
                <el-divider content-position="left">
                    <span class="divider-title">选择商品</span>
                </el-divider>

                <el-form-item label="团购商品" prop="goodsId">
                    <div class="goods-select-area">
                        <template v-if="selectedGoods">
                            <div class="selected-goods-card">
                                <el-image
                                    :src="selectedGoods.thumb || selectedGoods.primaryImage"
                                    style="width: 80px; height: 80px; border-radius: 6px; flex-shrink: 0"
                                    fit="cover"
                                >
                                    <template #error>
                                        <div class="image-placeholder">
                                            <el-icon :size="28"><Picture /></el-icon>
                                        </div>
                                    </template>
                                </el-image>
                                <div class="goods-detail">
                                    <div class="goods-name">{{ selectedGoods.title }}</div>
                                    <div class="goods-meta">
                                        <span>SPU: {{ selectedGoods.spuId }}</span>
                                        <span>当前售价: ¥{{ ((selectedGoods.price || selectedGoods.minSalePrice || 0) / 100).toFixed(2) }}</span>
                                    </div>
                                </div>
                                <el-button type="danger" text size="small" @click="clearGoods">
                                    <el-icon><Close /></el-icon>
                                </el-button>
                            </div>
                        </template>
                        <template v-else>
                            <el-button type="primary" @click="goodsDialogVisible = true">
                                <el-icon><Search /></el-icon> 选择商品
                            </el-button>
                        </template>
                    </div>
                </el-form-item>

                <!-- ====== 价格与条件 ====== -->
                <el-divider content-position="left">
                    <span class="divider-title">价格与条件</span>
                </el-divider>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="原价">
                            <el-input :model-value="originalPriceDisplay" disabled style="width: 100%" />
                            <span class="unit-tip">商品当前售价即原价</span>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="团购价" prop="grouponPrice">
                            <el-input-number v-model="form.grouponPrice" :min="1" :step="100" controls-position="right" style="width: 100%" />
                            <span class="unit-tip">单位：分（1元=100分）</span>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="成团人数" prop="minGroupSize">
                            <el-input-number v-model="form.minGroupSize" :min="2" :max="100" :step="1" controls-position="right" style="width: 100%" />
                            <span class="unit-tip">拼团所需最少人数</span>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="活动库存" prop="stockCount">
                            <el-input-number v-model="form.stockCount" :min="1" :max="999999" controls-position="right" style="width: 100%" />
                            <span class="unit-tip">本次团购可售数量</span>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="每人限购">
                            <el-input-number v-model="form.maxBuyPerUser" :min="1" :max="999" controls-position="right" style="width: 100%" />
                            <span class="unit-tip">单个用户最多购买数量</span>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="拼团有效期">
                            <el-input-number v-model="form.groupExpireHours" :min="1" :max="720" controls-position="right" style="width: 100%" />
                            <span class="unit-tip">开团后N小时内未成团则自动退款（小时）</span>
                        </el-form-item>
                    </el-col>
                </el-row>

                <!-- ====== 活动时间 ====== -->
                <el-divider content-position="left">
                    <span class="divider-title">活动时间</span>
                </el-divider>

                <el-form-item label="活动有效期" prop="dateRange">
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

                <!-- ====== 其他设置 ====== -->
                <el-divider content-position="left">
                    <span class="divider-title">其他设置</span>
                </el-divider>

                <el-form-item label="活动公告">
                    <el-input
                        v-model="form.notice"
                        type="textarea"
                        :rows="3"
                        placeholder="活动公告或说明（选填），将在团购详情页展示"
                        maxlength="500"
                        show-word-limit
                    />
                </el-form-item>

                <el-form-item label="活动状态">
                    <el-radio-group v-model="form.isActive">
                        <el-radio :label="1">立即生效</el-radio>
                        <el-radio :label="0">暂不生效（可稍后开启）</el-radio>
                    </el-radio-group>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 底部操作栏 -->
        <div class="bottom-bar">
            <el-button type="primary" size="large" @click="handleSubmit" :loading="submitting">
                <el-icon><Check /></el-icon> {{ isEdit ? '更新活动' : '创建活动' }}
            </el-button>
            <el-button size="large" @click="handleCancel">取消</el-button>
        </div>

        <!-- ====== 商品选择弹窗 ====== -->
        <el-dialog
            v-model="goodsDialogVisible"
            title="选择团购商品"
            width="800px"
            :close-on-click-modal="false"
            destroy-on-close
        >
            <div class="goods-search-bar">
                <el-input
                    v-model="goodsSearchKeyword"
                    placeholder="搜索商品标题或SPU"
                    clearable
                    @keyup.enter="searchGoods"
                    style="width: 300px"
                >
                    <template #prefix>
                        <el-icon><Search /></el-icon>
                    </template>
                </el-input>
                <el-button type="primary" @click="searchGoods">搜索</el-button>
            </div>

            <el-table
                :data="goodsTableData"
                border
                v-loading="goodsLoading"
                highlight-current-row
                @current-change="handleGoodsSelect"
                style="margin-top: 12px"
                max-height="400"
            >
                <el-table-column label="图片" width="70">
                    <template #default="scope">
                        <el-image
                            :src="scope.row.thumb || scope.row.primaryImage"
                            style="width: 40px; height: 40px; border-radius: 4px"
                            fit="cover"
                        >
                            <template #error>
                                <div class="image-slot-dialog">
                                    <el-icon><Picture /></el-icon>
                                </div>
                            </template>
                        </el-image>
                    </template>
                </el-table-column>
                <el-table-column prop="title" label="商品标题" min-width="200" show-overflow-tooltip />
                <el-table-column prop="spuId" label="SPU编码" width="120" align="center" />
                <el-table-column label="售价" width="100" align="center">
                    <template #default="scope">
                        <span class="price-text">¥{{ ((scope.row.price || scope.row.minSalePrice || 0) / 100).toFixed(2) }}</span>
                    </template>
                </el-table-column>
            </el-table>

            <div class="goods-pagination">
                <el-pagination
                    v-model:current-page="goodsPager.pageNum"
                    v-model:page-size="goodsPager.pageSize"
                    :page-sizes="[5, 10]"
                    :total="goodsPager.total"
                    layout="total, prev, pager, next"
                    background
                    small
                    @size-change="searchGoods"
                    @current-change="searchGoods"
                />
            </div>

            <template #footer>
                <el-button @click="goodsDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="confirmGoodsSelect" :disabled="!pendingGoods">
                    确认选择
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Plus, Search, Edit, Delete, Check, Close, Picture } from '@element-plus/icons-vue'
import { toast } from '~/composables/util'
import { addGroupon, updateGroupon, getGrouponDetail, getGoodsSimpleList } from '~/api/groupon'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)

const isEdit = ref(false)
const editId = ref(null)
const submitting = ref(false)

const form = reactive({
    name: '',
    goodsId: null,
    grouponPrice: 0,
    minGroupSize: 2,
    stockCount: 100,
    maxBuyPerUser: 5,
    groupExpireHours: 24,
    dateRange: [],
    notice: '',
    isActive: 1,
})

const rules = {
    name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
    goodsId: [{ required: true, message: '请选择团购商品', trigger: 'change' }],
    grouponPrice: [
        { required: true, message: '请输入团购价', trigger: 'blur' },
        { type: 'number', min: 1, message: '团购价必须大于0', trigger: 'blur' },
    ],
    minGroupSize: [
        { required: true, message: '请输入成团人数', trigger: 'blur' },
        { type: 'number', min: 2, message: '成团人数至少为2人', trigger: 'blur' },
    ],
    stockCount: [
        { required: true, message: '请输入活动库存', trigger: 'blur' },
    ],
    dateRange: [{ required: true, message: '请选择活动有效期', trigger: 'change' }],
}

// 已选商品
const selectedGoods = ref(null)
const originalPriceDisplay = computed(() => {
    if (!selectedGoods.value) return '-'
    const price = selectedGoods.value.price || selectedGoods.value.minSalePrice || 0
    return '¥' + (price / 100).toFixed(2)
})

function clearGoods() {
    selectedGoods.value = null
    form.goodsId = null
}

// 商品选择弹窗
const goodsDialogVisible = ref(false)
const goodsSearchKeyword = ref('')
const goodsTableData = ref([])
const goodsLoading = ref(false)
const pendingGoods = ref(null)

const goodsPager = reactive({
    pageNum: 1,
    pageSize: 10,
    total: 0,
})

async function searchGoods() {
    goodsLoading.value = true
    try {
        const params = {
            pageNum: goodsPager.pageNum,
            pageSize: goodsPager.pageSize,
        }
        if (goodsSearchKeyword.value) params.keyword = goodsSearchKeyword.value
        const data = await getGoodsSimpleList(params)
        goodsTableData.value = data.spuList || []
        goodsPager.total = data.totalCount || 0
    } catch (e) {
        console.error('获取商品列表失败', e)
    } finally {
        goodsLoading.value = false
    }
}

function handleGoodsSelect(row) {
    pendingGoods.value = row
}

function confirmGoodsSelect() {
    if (!pendingGoods.value) return
    const g = pendingGoods.value
    selectedGoods.value = g
    form.goodsId = g.spuId
    // 自动填入团购价为原价的6折（作为初始建议值，管理员可手动修改）
    const origin = g.price || g.minSalePrice || 0
    if (origin > 0 && form.grouponPrice === 0) {
        form.grouponPrice = Math.floor(origin * 0.6)
    }
    pendingGoods.value = null
    goodsDialogVisible.value = false
}

// 提交
async function handleSubmit() {
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return

    const originPrice = selectedGoods.value
        ? (selectedGoods.value.price || selectedGoods.value.minSalePrice || 0)
        : 0

    if (form.grouponPrice >= originPrice) {
        toast('团购价必须低于商品原价', 'warning')
        return
    }

    submitting.value = true
    try {
        const payload = {
            name: form.name,
            goodsId: form.goodsId,
            goodsSpuId: form.goodsId,
            goodsTitle: selectedGoods.value?.title || '',
            goodsImage: selectedGoods.value?.thumb || selectedGoods.value?.primaryImage || '',
            originPrice: originPrice,
            grouponPrice: form.grouponPrice,
            minGroupSize: form.minGroupSize,
            stockCount: form.stockCount,
            maxBuyPerUser: form.maxBuyPerUser,
            groupExpireHours: form.groupExpireHours,
            startTime: form.dateRange[0],
            endTime: form.dateRange[1],
            notice: form.notice,
            isActive: form.isActive,
        }

        if (isEdit.value) {
            await updateGroupon(editId.value, payload)
            toast('活动更新成功', 'success')
        } else {
            await addGroupon(payload)
            toast('团购活动创建成功', 'success')
        }
        router.push('/groupon/list')
    } catch (e) {
        console.error('操作失败', e)
    } finally {
        submitting.value = false
    }
}

function handleCancel() {
    router.back()
}

// 初始化
onMounted(async () => {
    const id = route.query.id
    if (id) {
        isEdit.value = true
        editId.value = id
        try {
            const data = await getGrouponDetail(id)
            if (data) {
                form.name = data.name || ''
                form.goodsId = data.goodsId || data.goodsSpuId || null
                form.grouponPrice = data.grouponPrice || 0
                form.minGroupSize = data.minGroupSize || 2
                form.stockCount = data.stockCount || 100
                form.maxBuyPerUser = data.maxBuyPerUser || 5
                form.groupExpireHours = data.groupExpireHours || 24
                form.dateRange = [data.startTime, data.endTime]
                form.notice = data.notice || ''
                form.isActive = data.status !== undefined ? (data.status === 2 ? 0 : 1) : 1

                selectedGoods.value = {
                    title: data.goodsTitle || '',
                    spuId: data.goodsId || data.goodsSpuId || '',
                    thumb: data.goodsImage || '',
                    primaryImage: data.goodsImage || '',
                    price: data.originPrice || 0,
                    minSalePrice: data.originPrice || 0,
                }
            }
        } catch (e) {
            console.error('加载活动详情失败', e)
            toast('加载活动详情失败', 'error')
        }
    }
})
</script>

<style scoped>
.groupon-add-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-bottom: 80px;
}

.main-card {
    border: none;
}

.divider-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
}

.unit-tip {
    font-size: 12px;
    color: #909399;
    margin-left: 8px;
}

.price-text {
    color: #f56c6c;
    font-weight: 600;
}

/* 已选商品卡片 */
.goods-select-area {
    width: 100%;
}

.selected-goods-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #fafafa;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    max-width: 500px;
}

.goods-detail {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.goods-name {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.goods-meta {
    font-size: 12px;
    color: #909399;
    display: flex;
    gap: 16px;
}

.image-placeholder {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f7fa;
    color: #c0c4cc;
    border-radius: 6px;
}

/* 商品选择弹窗 */
.goods-search-bar {
    display: flex;
    gap: 8px;
    align-items: center;
}

.goods-pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
}

.image-slot-dialog {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f7fa;
    color: #c0c4cc;
    border-radius: 4px;
}

/* 底部操作栏 */
.bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 64px;
    background: #fff;
    border-top: 1px solid #ebeef5;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    z-index: 100;
    box-shadow: 0 -2px 8px rgba(0,0,0,0.06);
}
</style>
