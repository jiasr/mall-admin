<template>
    <div class="goods-page">
        <!-- 顶部筛选栏 -->
        <el-card class="filter-card" shadow="never">
            <el-form :inline="true" :model="filterForm" class="filter-form">
                <el-form-item>
                    <el-button type="success" @click="$router.push('/goods/add')">
                        <el-icon><Plus /></el-icon> 添加商品
                    </el-button>
                </el-form-item>
                <span class="filter-separator"></span>
                <el-form-item label="关键词">
                    <el-input v-model="filterForm.keyword" placeholder="商品标题" clearable @keyup.enter="handleSearch" />
                </el-form-item>
                <el-form-item label="分类">
                    <el-tree-select
                        v-model="filterForm.categoryId"
                        :data="categoryOptions"
                        :props="{ label: 'name', value: 'id', children: 'children' }"
                        placeholder="选择分类"
                        clearable
                        check-strictly
                        style="width: 180px"
                    />
                </el-form-item>
                <el-form-item label="状态">
                    <el-select v-model="filterForm.status" placeholder="上架状态" clearable style="width: 120px">
                        <el-option label="已上架" :value="1" />
                        <el-option label="已下架" :value="0" />
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

        <!-- 商品表格 -->
        <el-card class="table-card" shadow="never">
            <el-table :data="tableData" border size="small" style="width: 100%" v-loading="loading">
                <el-table-column label="商品图片" width="100" align="center">
                    <template #default="scope">
                        <el-image
                            :src="scope.row.thumb || scope.row.primaryImage"
                            style="width: 60px; height: 60px; border-radius: 6px"
                            fit="cover"
                        >
                            <template #error>
                                <div class="image-slot">
                                    <el-icon><Picture /></el-icon>
                                </div>
                            </template>
                        </el-image>
                    </template>
                </el-table-column>

                <el-table-column prop="title" label="商品标题" min-width="250" show-overflow-tooltip />

                <el-table-column prop="spuId" label="SPU编码" width="120" align="center" />

                <el-table-column label="价格" width="140" align="center">
                    <template #default="scope">
                        <span class="price">¥{{ ((scope.row.price || scope.row.minSalePrice) / 100).toFixed(2) }}</span>
                    </template>
                </el-table-column>

                <el-table-column label="划线价" width="140" align="center">
                    <template #default="scope">
                        <span class="line-price">¥{{ ((scope.row.originPrice || scope.row.maxLinePrice) / 100).toFixed(2) }}</span>
                    </template>
                </el-table-column>

                <el-table-column label="状态" width="100" align="center">
                    <template #default="scope">
                        <el-tag v-if="scope.row.isPutOnSale !== 0" type="success" size="small">已上架</el-tag>
                        <el-tag v-else type="info" size="small">已下架</el-tag>
                    </template>
                </el-table-column>

                <el-table-column prop="soldNum" label="销量" width="80" align="center" />

                <el-table-column label="操作" width="260" fixed="right" align="center">
                    <template #default="scope">
                        <el-button type="primary" size="small" link @click="handleView(scope.row)">
                            <el-icon><View /></el-icon> 查看
                        </el-button>
                        <el-button type="primary" size="small" link @click="handleEdit(scope.row)">
                            <el-icon><Edit /></el-icon> 编辑
                        </el-button>
                        <el-button
                            v-if="scope.row.isPutOnSale !== 0"
                            type="warning"
                            size="small"
                            link
                            @click="handleToggleSale(scope.row)"
                        >
                            <el-icon><Bottom /></el-icon> 下架
                        </el-button>
                        <el-button
                            v-else
                            type="success"
                            size="small"
                            link
                            @click="handleToggleSale(scope.row)"
                        >
                            <el-icon><Top /></el-icon> 上架
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

        <!-- 商品详情抽屉 -->
        <el-drawer v-model="drawerVisible" title="商品详情" size="600px" destroy-on-close>
            <template v-if="currentGoods">
                <el-descriptions :column="2" border>
                    <el-descriptions-item label="SPU编码">{{ currentGoods.spuId }}</el-descriptions-item>
                    <el-descriptions-item label="标题" :span="2">{{ currentGoods.title }}</el-descriptions-item>
                    <el-descriptions-item label="最低售价">¥{{ ((currentGoods.minSalePrice || 0) / 100).toFixed(2) }}</el-descriptions-item>
                    <el-descriptions-item label="最高售价">¥{{ ((currentGoods.maxSalePrice || 0) / 100).toFixed(2) }}</el-descriptions-item>
                    <el-descriptions-item label="最低划线价">¥{{ ((currentGoods.minLinePrice || 0) / 100).toFixed(2) }}</el-descriptions-item>
                    <el-descriptions-item label="最高划线价">¥{{ ((currentGoods.maxLinePrice || 0) / 100).toFixed(2) }}</el-descriptions-item>
                    <el-descriptions-item label="库存">{{ currentGoods.spuStockQuantity }}</el-descriptions-item>
                    <el-descriptions-item label="已售">{{ currentGoods.soldNum }}</el-descriptions-item>
                    <el-descriptions-item label="上架状态">
                        <el-tag v-if="currentGoods.isPutOnSale" type="success">已上架</el-tag>
                        <el-tag v-else type="info">已下架</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="售罄">
                        <el-tag v-if="currentGoods.isSoldOut" type="danger">已售罄</el-tag>
                        <el-tag v-else type="success">有货</el-tag>
                    </el-descriptions-item>
                </el-descriptions>

                <!-- SKU 列表 -->
                <h4 class="sku-title">SKU 列表</h4>
                <el-table :data="currentGoods.skuList || []" border size="small">
                    <el-table-column prop="skuId" label="SKU编码" width="120" />
                    <el-table-column label="规格" min-width="150">
                        <template #default="scope">
                            <template v-if="scope.row.specInfo">
                                <el-tag v-for="(spec, i) in scope.row.specInfo" :key="i" size="small" class="mr-1">
                                    {{ spec.specValue }}
                                </el-tag>
                            </template>
                        </template>
                    </el-table-column>
                    <el-table-column label="售价" width="100">
                        <template #default="scope">
                            ¥{{ ((scope.row.priceInfo?.[0]?.price || 0) / 100).toFixed(2) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="库存" width="80">
                        <template #default="scope">
                            {{ scope.row.stockInfo?.stockQuantity || 0 }}
                        </template>
                    </el-table-column>
                </el-table>
            </template>
        </el-drawer>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh, Picture, View, Plus, Edit, Delete, Top, Bottom } from '@element-plus/icons-vue'
import { getGoodsList, getGoodsDetail, deleteGoods, putOnSale, pullOffSale } from '~/api/goods'
import { getCategoryTree } from '~/api/category'
import { toast, showModal } from '~/composables/util'

const router = useRouter()

const loading = ref(false)
const tableData = ref([])
const categoryOptions = ref([])

const filterForm = reactive({
    keyword: '',
    categoryId: null,
    status: null,
})

const pager = reactive({
    pageNum: 1,
    pageSize: 10,
    total: 0,
})

// 加载分类选项
async function loadCategoryOptions() {
    try {
        categoryOptions.value = await getCategoryTree()
    } catch (e) {
        console.error('加载分类选项失败', e)
    }
}

// 搜索
async function handleSearch() {
    loading.value = true
    try {
        const params = {
            pageNum: pager.pageNum,
            pageSize: pager.pageSize,
        }
        if (filterForm.keyword) params.keyword = filterForm.keyword
        if (filterForm.categoryId) params.categoryId = filterForm.categoryId
        if (filterForm.status !== null && filterForm.status !== '') params.isPutOnSale = filterForm.status

        const data = await getGoodsList(params)
        if (data) {
            tableData.value = data.spuList || []
            pager.total = data.totalCount || 0
        }
    } catch (e) {
        console.error('加载商品列表失败', e)
    } finally {
        loading.value = false
    }
}

// 重置
function handleReset() {
    filterForm.keyword = ''
    filterForm.categoryId = null
    filterForm.status = null
    pager.pageNum = 1
    handleSearch()
}

// 查看详情
const drawerVisible = ref(false)
const currentGoods = ref(null)

async function handleView(row) {
    drawerVisible.value = true
    currentGoods.value = null
    try {
        const data = await getGoodsDetail(row.spuId)
        currentGoods.value = data
    } catch (e) {
        console.error('加载商品详情失败', e)
    }
}

// 编辑商品
function handleEdit(row) {
    router.push(`/goods/add?spuId=${row.spuId}`)
}

// 上架/下架
async function handleToggleSale(row) {
    const action = row.isPutOnSale !== 0 ? '下架' : '上架'
    try {
        await showModal(`确定要${action}该商品吗？`, 'warning', `${action}确认`)
        if (row.isPutOnSale !== 0) {
            await pullOffSale(row.spuId)
        } else {
            await putOnSale(row.spuId)
        }
        toast(`${action}成功`, 'success')
        handleSearch()
    } catch (e) {
        if (e !== 'cancel') {
            console.error(`${action}失败`, e)
        }
    }
}

// 删除商品
async function handleDelete(row) {
    try {
        await showModal('确定要删除该商品吗？此操作不可恢复！', 'error', '删除确认')
        await deleteGoods(row.spuId)
        toast('删除成功', 'success')
        handleSearch()
    } catch (e) {
        if (e !== 'cancel') {
            console.error('删除失败', e)
        }
    }
}

onMounted(() => {
    loadCategoryOptions()
    handleSearch()
})
</script>

<style scoped>
.goods-page {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.filter-card {
    border: none;
}

.filter-card :deep(.el-card__body) {
    padding: 12px 16px 0;
}

.filter-card :deep(.el-form-item) {
    margin-bottom: 12px;
}

.filter-separator {
    display: inline-block;
    width: 1px;
    height: 20px;
    background: #dcdfe6;
    margin: 0 12px;
    vertical-align: middle;
}

.table-card {
    border: none;
}

.table-card :deep(.el-card__body) {
    padding: 12px 16px;
}

.price {
    color: #f56c6c;
    font-weight: 600;
}

.line-price {
    color: #909399;
    text-decoration: line-through;
    font-size: 13px;
}

.pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
}

.image-slot {
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f7fa;
    color: #c0c4cc;
    border-radius: 6px;
}

.sku-title {
    margin: 20px 0 12px;
    font-size: 15px;
    color: #303133;
}

.mr-1 {
    margin-right: 4px;
}
</style>
