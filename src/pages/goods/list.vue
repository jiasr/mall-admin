<template>
    <div class="goods-page">
        <div class="goods-container">
            <!-- 左侧分类树 -->
            <div class="left-panel">
                <el-card class="category-card" shadow="never">
                    <div class="category-header">
                        <span class="category-title">商品分类</span>
                        <el-button type="primary" size="small" text @click="handleCategorySelect(null)">
                            <el-icon><List /></el-icon> 全部
                        </el-button>
                    </div>
                    <el-input
                        v-model="treeFilter"
                        placeholder="搜索分类"
                        size="small"
                        clearable
                        class="tree-filter"
                    >
                        <template #prefix>
                            <el-icon><Search /></el-icon>
                        </template>
                    </el-input>
                    <el-tree
                        ref="treeRef"
                        :data="categoryOptions"
                        :props="{ label: 'name', value: 'id', children: 'children' }"
                        :filter-node-method="filterNode"
                        node-key="id"
                        highlight-current
                        :expand-on-click-node="false"
                        @node-click="handleNodeClick"
                    >
                        <template #default="{ node, data }">
                            <span class="tree-node">
                                <el-icon class="tree-node-icon"><Folder /></el-icon>
                                <span class="tree-node-label">{{ data.name }}</span>
                                <span class="tree-node-count" v-if="data.productCount !== undefined">({{ data.productCount }})</span>
                            </span>
                        </template>
                    </el-tree>
                </el-card>
            </div>

            <!-- 右侧商品列表 -->
            <div class="right-panel">
                <el-card class="content-card" shadow="never">
                    <!-- 顶部操作栏 -->
                    <div class="content-header">
                        <div class="header-left">
                            <span class="current-category" v-if="currentCategoryName">
                                <el-icon><Folder /></el-icon> {{ currentCategoryName }}
                            </span>
                            <span class="current-category" v-else>全部商品</span>
                        </div>
                        <el-form :inline="true" :model="filterForm" class="search-form">
                            <el-form-item>
                                <el-button type="success" @click="$router.push('/goods/add')">
                                    <el-icon><Plus /></el-icon> 添加商品
                                </el-button>
                            </el-form-item>
                            <el-form-item label="关键词">
                                <el-input v-model="filterForm.keyword" placeholder="商品标题" clearable @keyup.enter="handleSearch" />
                            </el-form-item>
                            <el-form-item label="状态">
                                <el-select v-model="filterForm.status" placeholder="上架状态" clearable style="width: 110px">
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
                    </div>

                    <!-- 商品表格 -->
                    <el-table :data="tableData" border size="small" style="width: 100%" v-loading="loading">
                        <el-table-column label="商品图片" width="80" align="center">
                            <template #default="scope">
                                <el-image
                                    :src="scope.row.thumb || scope.row.primaryImage"
                                    style="width: 50px; height: 50px; border-radius: 4px"
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

                        <el-table-column prop="title" label="商品标题" min-width="200" show-overflow-tooltip />

                        <el-table-column label="SPU编码" width="240" align="center">
                            <template #default="scope">
                                <span
                                    style="font-family: monospace; font-size: 12px; cursor: pointer; color: #409eff; display: flex; align-items: center; justify-content: center; gap: 4px;"
                                    @click="handleView(scope.row)"
                                >
                                    {{ scope.row.spuId }}
                                    <el-icon style="color: #c0c4cc; flex-shrink: 0;" @click.stop="copyText(scope.row.spuId)"><DocumentCopy /></el-icon>
                                </span>
                            </template>
                        </el-table-column>

                        <el-table-column label="国际编码" width="140" align="center">
                            <template #default="scope">
                                <span style="font-family: monospace; font-size: 12px;">{{ getBarcode(scope.row.skuList) }}</span>
                            </template>
                        </el-table-column>

                        <el-table-column label="价格" width="120" align="center">
                            <template #default="scope">
                                <span class="price">¥{{ ((scope.row.price || scope.row.minSalePrice) / 100).toFixed(2) }}</span>
                            </template>
                        </el-table-column>

                        <el-table-column label="状态" width="80" align="center">
                            <template #default="scope">
                                <el-tag v-if="scope.row.isPutOnSale !== 0" type="success" size="small">上架</el-tag>
                                <el-tag v-else type="info" size="small">下架</el-tag>
                            </template>
                        </el-table-column>

                        <el-table-column prop="soldNum" label="销量" width="70" align="center" />

                        <el-table-column label="操作" width="240" fixed="right" align="center">
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
                            size="small"
                            @size-change="handleSearch"
                            @current-change="handleSearch"
                        />
                    </div>
                </el-card>
            </div>
        </div>

        <!-- 商品详情抽屉 -->
        <el-drawer v-model="drawerVisible" title="商品详情" size="600px" destroy-on-close>
            <template v-if="currentGoods">
                <el-descriptions :column="2" border>
                    <el-descriptions-item label="SPU编码">{{ currentGoods.spuId }}</el-descriptions-item>
                    <el-descriptions-item label="标题" :span="2">{{ currentGoods.title }}</el-descriptions-item>
                    <el-descriptions-item label="最低售价">¥{{ ((currentGoods.minSalePrice || 0) / 100).toFixed(2) }}</el-descriptions-item>
                    <el-descriptions-item label="最高售价">¥{{ ((currentGoods.maxSalePrice || 0) / 100).toFixed(2) }}</el-descriptions-item>

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

                <h4 class="sku-title" v-if="currentGoods.detailContent">商品详情</h4>
                <div class="detail-content" v-if="currentGoods.detailContent" v-html="currentGoods.detailContent"></div>
            </template>
        </el-drawer>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onActivated, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh, Picture, View, Plus, Edit, Delete, Top, Bottom, Folder, List, DocumentCopy } from '@element-plus/icons-vue'
import { getGoodsList, getGoodsDetail, deleteGoods, putOnSale, pullOffSale } from '~/api/goods'
import { getCategoryTree } from '~/api/category'
import { toast, showModal } from '~/composables/util'

const router = useRouter()
const treeRef = ref(null)

const loading = ref(false)
const tableData = ref([])
const categoryOptions = ref([])
const treeFilter = ref('')
const currentCategoryName = ref('')

// 分类树筛选
function filterNode(value, data) {
    if (!value) return true
    return data.name.includes(value)
}

watch(treeFilter, (val) => {
    treeRef.value?.filter(val)
})

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

// 加载分类树
async function loadCategoryOptions() {
    try {
        categoryOptions.value = await getCategoryTree()
    } catch (e) {
        console.error('加载分类树失败', e)
    }
}

// 点击分类节点
function handleNodeClick(data) {
    filterForm.categoryId = data.id
    currentCategoryName.value = data.name
    pager.pageNum = 1
    handleSearch()
}

// 点击"全部"或者清除分类
function handleCategorySelect() {
    filterForm.categoryId = null
    currentCategoryName.value = ''
    pager.pageNum = 1
    treeRef.value?.setCurrentKey(null)
    handleSearch()
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
    filterForm.status = null
    filterForm.categoryId = null
    currentCategoryName.value = ''
    pager.pageNum = 1
    treeRef.value?.setCurrentKey(null)
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

function getBarcode(skuList) {
    if (!skuList || !skuList.length) return '-'
    const item = skuList.find(s => s.barcode) || skuList[0]
    return item.barcode || '-'
}

function copyText(text) {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
        toast('已复制', 'success')
    }).catch(() => {
        // fallback
        const ta = document.createElement('textarea')
        ta.value = text
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        toast('已复制', 'success')
    })
}

onMounted(async () => {
    await loadCategoryOptions()
    handleSearch()
})

// Keep-alive 缓存激活时重新加载分类树和商品列表
onActivated(() => {
    loadCategoryOptions()
    handleSearch()
})
</script>

<style scoped>
.goods-page {
    height: calc(100vh - 100px);
    overflow: hidden;
}

.goods-container {
    display: flex;
    height: 100%;
    gap: 12px;
}

/* ====== 左侧分类面板 ====== */
.left-panel {
    width: 240px;
    flex-shrink: 0;
    height: 100%;
}

.category-card {
    height: 100%;
    border: none;
    display: flex;
    flex-direction: column;
}

.category-card :deep(.el-card__body) {
    padding: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.category-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 12px 8px;
}

.category-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
}

.tree-filter {
    padding: 0 12px 8px;
}

.category-card :deep(.el-tree) {
    flex: 1;
    overflow-y: auto;
    padding: 4px 8px;
}

.category-card :deep(.el-tree-node__content) {
    height: 32px;
    border-radius: 4px;
}

.category-card :deep(.el-tree-node__content:hover) {
    background: #f0f2f5;
}

.category-card :deep(.el-tree-node.is-current > .el-tree-node__content) {
    background: #ecf5ff;
    color: #409eff;
}

.tree-node {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
    overflow: hidden;
}

.tree-node-icon {
    font-size: 14px;
    color: #909399;
    flex-shrink: 0;
}

.tree-node-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
}

.tree-node-count {
    font-size: 12px;
    color: #c0c4cc;
    flex-shrink: 0;
}

/* ====== 右侧内容区 ====== */
.right-panel {
    flex: 1;
    height: 100%;
    min-width: 0;
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
    margin-bottom: 8px;
}

.current-category {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    display: flex;
    align-items: center;
    gap: 4px;
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

/* ====== 表格区域 ====== */
.content-card :deep(.el-table) {
    flex: 1;
}

.content-card :deep(.el-table__body-wrapper) {
    overflow-y: auto;
}

.price {
    color: #f56c6c;
    font-weight: 600;
}

.pagination {
    display: flex;
    justify-content: flex-end;
    padding: 10px 16px;
    border-top: 1px solid #ebeef5;
    flex-shrink: 0;
}

.image-slot {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f7fa;
    color: #c0c4cc;
    border-radius: 4px;
}

.sku-title {
    margin: 20px 0 12px;
    font-size: 15px;
    color: #303133;
}

.mr-1 {
    margin-right: 4px;
}

.detail-content {
    padding: 12px;
    background: #fafafa;
    border-radius: 6px;
    border: 1px solid #ebeef5;
    max-height: 400px;
    overflow-y: auto;
    line-height: 1.7;
    font-size: 14px;
    color: #333;
}

.detail-content :deep(img) {
    max-width: 100%;
    height: auto;
}
</style>
