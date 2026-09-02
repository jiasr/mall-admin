<template>
    <div class="goods-page">
        <div class="goods-container">
            <!-- 左侧分类树 -->
            <div class="left-panel" v-show="!categoryCollapsed">
                <el-card class="category-card" shadow="never">
                    <div class="category-header">
                        <span class="category-title">商品分类</span>
                        <div class="category-header-actions">
                            <el-button type="primary" size="small" text @click="handleCategorySelect(null)">
                                <el-icon><List /></el-icon> 全部
                            </el-button>
                            <el-button size="small" text @click="toggleCategoryPanel">收起分类</el-button>
                        </div>
                    </div>
                    <div class="tree-filter-row">
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
                        <el-button size="small" text @click="toggleCategoryExpand">
                            {{ isCategoryExpanded ? '收起全部' : '展开全部' }}
                        </el-button>
                    </div>
                    <el-tree
                        :key="treeKey"
                        :data="filteredCategoryOptions"
                        :props="{ label: 'name', value: 'id', children: 'children' }"
                        node-key="id"
                        highlight-current
                        :expand-on-click-node="false"
                        :default-expanded-keys="defaultExpandedKeys"
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
                            <el-button v-if="categoryCollapsed" type="primary" text @click="toggleCategoryPanel">
                                展开分类
                            </el-button>
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
                    <el-table
                        :data="tableData"
                        border
                        size="small"
                        style="width: 100%"
                        v-loading="loading"
                        @selection-change="handleSelectionChange"
                    >
                        <!-- 多选列：用于批量移动分类 -->
                        <el-table-column type="selection" width="44" />
                        <!-- 展开行：展示该 SPU 下每个 SKU 关联的进销存商品信息 -->
                        <el-table-column type="expand" width="48">
                            <template #default="scope">
                                <div class="expand-panel">
                                    <el-table :data="sortedSkus(scope.row)" border size="small">
                                        <el-table-column label="图片" width="60" align="center">
                                            <template #default="s">
                                                <el-image v-if="s.row.thumb" :src="s.row.thumb" fit="cover" style="width:40px;height:40px;border-radius:4px" />
                                                <span v-else style="color:#c0c4cc">—</span>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="skuId" label="SKU编码" width="240" show-overflow-tooltip />
                                        <el-table-column label="规格" min-width="160">
                                            <template #default="s">
                                                <template v-if="s.row.specInfo && s.row.specInfo.length">
                                                    <el-tag
                                                        v-for="(spec, i) in s.row.specInfo"
                                                        :key="i"
                                                        size="small"
                                                        type="info"
                                                        class="mr-1"
                                                    >
                                                        {{ spec.specValue }}
                                                    </el-tag>
                                                </template>
                                                <span v-else class="no-spec">无规格</span>
                                            </template>
                                        </el-table-column>
                                        <el-table-column label="价格" width="100" align="center">
                                            <template #default="s">
                                                <span class="price">¥{{ ((s.row.price || 0) / 100).toFixed(2) }}</span>
                                            </template>
                                        </el-table-column>
                                        <el-table-column label="国际编码" width="160" show-overflow-tooltip>
                                            <template #default="s">
                                                <el-button
                                                    type="primary"
                                                    link
                                                    size="small"
                                                    @click="openStockView(s.row.barcode)"
                                                >{{ s.row.barcode || '—' }}</el-button>
                                            </template>
                                        </el-table-column>
                                        <el-table-column label="进销存商品" min-width="180">
                                            <template #default="s">
                                                <span>{{ s.row.invName || '—' }}</span>
                                            </template>
                                        </el-table-column>
                                        <el-table-column label="进销存库存" width="110" align="center">
                                            <template #default="s">
                                                <el-tag :type="(s.row.stock || 0) <= 0 ? 'danger' : 'success'" size="small">
                                                    {{ s.row.stock || 0 }}
                                                </el-tag>
                                            </template>
                                        </el-table-column>
                                    </el-table>
                                </div>
                            </template>
                        </el-table-column>
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

                        <el-table-column prop="title" label="商品标题" width="160" show-overflow-tooltip />

                        <el-table-column label="分类" width="120" show-overflow-tooltip>
                            <template #default="scope">
                                <span>{{ getCategoryNames(scope.row.categoryId) }}</span>
                            </template>
                        </el-table-column>

                        <el-table-column label="SPU编码" width="240" align="center" show-overflow-tooltip>
                            <template #default="scope">
                                <span
                                    style="font-family: monospace; font-size: 12px; cursor: pointer; color: #409eff; display: flex; align-items: center; justify-content: center; gap: 4px; white-space: nowrap;"
                                    @click="handleView(scope.row)"
                                >
                                    {{ scope.row.spuId }}
                                    <el-icon style="color: #c0c4cc; flex-shrink: 0;" @click.stop="copyText(scope.row.spuId)"><DocumentCopy /></el-icon>
                                </span>
                            </template>
                        </el-table-column>

                        <el-table-column label="价格" width="140" align="center">
                            <template #default="scope">
                                <span class="price">{{ formatPriceRange(scope.row) }}</span>
                            </template>
                        </el-table-column>

                        <el-table-column label="状态" width="80" align="center">
                            <template #default="scope">
                                <el-tag v-if="scope.row.isPutOnSale !== 0" type="success" size="small">上架</el-tag>
                                <el-tag v-else type="info" size="small">下架</el-tag>
                            </template>
                        </el-table-column>

                        <el-table-column prop="soldNum" label="销量" width="70" align="center" />

                        <el-table-column label="操作" width="280" fixed="right" align="center">
                            <template #default="scope">
                                <el-button type="primary" size="small" link @click="handleView(scope.row)">
                                    <el-icon><View /></el-icon> 查看
                                </el-button>
                                <el-button type="primary" size="small" link @click="handleEdit(scope.row)">
                                    <el-icon><Edit /></el-icon> 编辑
                                </el-button>
                                <el-button type="warning" size="small" link @click="openMoveDialog(scope.row)">
                                    <el-icon><Rank /></el-icon> 移动
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
                <el-table :data="sortedSkus(currentGoods)" border size="small">
                    <el-table-column prop="skuId" label="SKU编码" width="200" show-overflow-tooltip />
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

        <!-- 移动分类弹窗 -->
        <el-dialog v-model="moveDialogVisible" title="移动分类" width="480px" destroy-on-close>
            <div class="move-desc">
                将 <b class="move-count">{{ moveTargetCount }}</b> 个商品移动到以下分类：
            </div>
            <el-tree-select
                v-model="moveForm.categoryId"
                :data="categoryOptions"
                :props="{ label: 'name', value: 'id', children: 'children' }"
                placeholder="选择目标分类"
                check-strictly
                clearable
                style="width: 100%"
            />
            <template #footer>
                <el-button @click="moveDialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="moveLoading" @click="handleMoveCategory">确定移动</el-button>
            </template>
        </el-dialog>

        <!-- 进销存商品查看抽屉（按国际编码/条码） -->
        <el-drawer v-model="stockDrawerVisible" title="进销存商品详情" size="720px" destroy-on-close>
            <template v-if="stockGoods">
                <el-descriptions :column="1" border>
                    <el-descriptions-item label="商品名称">{{ stockGoods.name }}</el-descriptions-item>
                    <el-descriptions-item label="条码">
                        <template v-if="stockGoods.barcode">
                            <div class="barcode-wrap">
                                <canvas id="goods-stock-barcode-canvas" class="barcode-canvas"></canvas>
                                <div class="barcode-text">{{ stockGoods.barcode }}</div>
                            </div>
                        </template>
                        <span v-else>-</span>
                    </el-descriptions-item>
                    <el-descriptions-item label="品牌">{{ stockGoods.brand || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="规格">{{ stockGoods.spec || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="单位">{{ stockGoods.unit || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="分类">{{ stockGoods.category || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="成本价">¥{{ Number(stockGoods.costPrice || 0).toFixed(2) }}</el-descriptions-item>
                    <el-descriptions-item label="参考售价">¥{{ Number(stockGoods.salePrice || 0).toFixed(2) }}</el-descriptions-item>
                    <el-descriptions-item label="库存数量">{{ stockGoods.stockQuantity }}</el-descriptions-item>
                    <el-descriptions-item label="预警阈值">{{ stockGoods.warnThreshold }}</el-descriptions-item>
                    <el-descriptions-item label="供应商">{{ stockGoods.supplier || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="创建时间">{{ stockGoods.createTime || '-' }}</el-descriptions-item>
                </el-descriptions>

                <h4 class="block-title">库存流水</h4>
                <el-table :data="stockLogs" border size="small" v-loading="stockLogLoading">
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
                <el-empty v-if="!stockLogLoading && stockLogs.length === 0" description="暂无出入库记录" :image-size="60" />
            </template>
        </el-drawer>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onActivated, watch, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh, Picture, View, Plus, Edit, Delete, Top, Bottom, Folder, List, DocumentCopy, Rank } from '@element-plus/icons-vue'
import { getGoodsList, getGoodsDetail, deleteGoods, putOnSale, pullOffSale, moveGoodsCategory } from '~/api/goods'
import { getCategoryTree } from '~/api/category'
import { getStockGoodsByBarcode, getStockLogList } from '~/api/stock'
import JsBarcode from 'jsbarcode'
import { toast, showModal } from '~/composables/util'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])
const categoryOptions = ref([])
const categoryMap = ref({})
const treeFilter = ref('')
const currentCategoryName = ref('')
const categoryCollapsed = ref(false)
function toggleCategoryPanel() {
    categoryCollapsed.value = !categoryCollapsed.value
}

// 分类树搜索：通过计算属性过滤树数据（不依赖 tree 实例方法）
const filteredCategoryOptions = computed(() => {
    const kw = (treeFilter.value || '').trim()
    if (!kw) return categoryOptions.value
    const doFilter = (list) => {
        const result = []
        ;(list || []).forEach((n) => {
            const children = n.children && n.children.length ? doFilter(n.children) : []
            if (n.name.includes(kw) || children.length) {
                result.push({ ...n, children })
            }
        })
        return result
    }
    return doFilter(categoryOptions.value)
})

// 分类树：展开全部 / 收起全部
// 通过 default-expanded-keys + 改变 :key 强制 el-tree 重新挂载来生效，
// 规避该版本 el-tree 对 setExpandedKeys / 受控 expanded-keys 的支持问题
const isCategoryExpanded = ref(false)
const treeKey = ref(0)
const defaultExpandedKeys = ref([])
function getExpandableKeys(list = []) {
    const keys = []
    list.forEach((n) => {
        if (n.children && n.children.length) {
            keys.push(n.id)
            keys.push(...getExpandableKeys(n.children))
        }
    })
    return keys
}
function toggleCategoryExpand() {
    isCategoryExpanded.value = !isCategoryExpanded.value
    defaultExpandedKeys.value = isCategoryExpanded.value ? getExpandableKeys(categoryOptions.value) : []
    treeKey.value++
}

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
        const tree = await getCategoryTree()
        categoryOptions.value = tree
        const map = {}
        const walk = (nodes) => {
            (nodes || []).forEach(n => {
                map[n.id] = n.name
                if (n.children && n.children.length) walk(n.children)
            })
        }
        walk(tree)
        categoryMap.value = map
        isCategoryExpanded.value = false
        defaultExpandedKeys.value = []
        treeKey.value++
    } catch (e) {
        console.error('加载分类树失败', e)
    }
}

// 由商品所属分类 id（支持逗号分隔多个）映射为分类名称
function getCategoryNames(ids) {
    if (!ids) return '-'
    return String(ids).split(',').map(id => categoryMap.value[id] || id).join(' / ')
}

// SKU 按价格（分）从高到低排序
function sortedSkus(row) {
    const list = (row && row.skuList) || []
    return [...list].sort((a, b) => (a.price || 0) - (b.price || 0))
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
    // 重新挂载分类树，清除高亮与展开状态
    defaultExpandedKeys.value = []
    treeKey.value++
    pager.pageNum = 1
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
    defaultExpandedKeys.value = []
    treeKey.value++
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

// ===== 移动分类 =====
const selectedRows = ref([])

// 勾选变化
function handleSelectionChange(rows) {
    selectedRows.value = rows
}

// 打开移动分类弹窗：row 传单个商品，不传则使用表格勾选
function openMoveDialog(row) {
    if (row) {
        selectedRows.value = [row]
    }
    if (!selectedRows.value.length) {
        toast('请先勾选要移动的商品', 'warning')
        return
    }
    moveTargetCount.value = selectedRows.value.length
    moveForm.categoryId = null
    moveDialogVisible.value = true
}

const moveDialogVisible = ref(false)
const moveLoading = ref(false)
const moveTargetCount = ref(0)
const moveForm = reactive({ categoryId: null })

// 执行移动分类
async function handleMoveCategory() {
    if (!moveForm.categoryId) {
        toast('请选择目标分类', 'warning')
        return
    }
    moveLoading.value = true
    try {
        await moveGoodsCategory({
            spuIds: selectedRows.value.map((r) => r.spuId),
            categoryId: moveForm.categoryId,
        })
        toast('移动成功', 'success')
        moveDialogVisible.value = false
        selectedRows.value = []
        handleSearch()
        loadCategoryOptions()
    } catch (e) {
        console.error('移动分类失败', e)
    } finally {
        moveLoading.value = false
    }
}

// 主表是 SPU 维度，价格取旗下所有 SKU 的价格区间（最低~最高）；具体单价在展开行每个 SKU 上展示
function formatPriceRange(row) {
    const list = row?.skuList || []
    if (!list.length) return '-'
    const prices = list.map(s => Number(s.price) || 0)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    if (min === max) return '¥' + (min / 100).toFixed(2)
    return '¥' + (min / 100).toFixed(2) + ' ~ ¥' + (max / 100).toFixed(2)
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

// ========== 进销存商品查看（按国际编码/条码） ==========
const stockDrawerVisible = ref(false)
const stockGoods = ref(null)
const stockLogs = ref([])
const stockLogLoading = ref(false)

async function openStockView(barcode) {
    if (!barcode) {
        toast('该 SKU 无国际编码', 'warning')
        return
    }
    stockDrawerVisible.value = true
    stockGoods.value = null
    stockLogs.value = []
    stockLogLoading.value = true
    try {
        const goods = await getStockGoodsByBarcode(barcode)
        stockGoods.value = goods
        await nextTick()
        renderStockBarcode()
        const data = await getStockLogList({ goods_id: goods.id, pageIndex: 1, pageSize: 100 })
        stockLogs.value = (data && data.list) || []
    } catch (e) {
        console.error('加载进销存商品失败', e)
        toast('未找到该条码对应的进销存商品', 'warning')
    } finally {
        stockLogLoading.value = false
    }
}

function bizTypeText(type) {
    const map = { stock_in: '入库', stock_out: '出库', stock_check: '盘点' }
    return map[type] || type || '-'
}

// 用 JsBarcode 渲染条码图片（对齐进销存页）
function renderStockBarcode() {
    const goods = stockGoods.value
    const el = document.getElementById('goods-stock-barcode-canvas')
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
        // 非 13 位或非数字时，降级为 Code128 展示
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

.category-header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
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

.tree-filter-row {
    display: flex;
    align-items: center;
    gap: 4px;
}

.tree-filter-row .tree-filter {
    flex: 1;
}

.tree-filter-row .el-button {
    flex-shrink: 0;
    margin-left: 0;
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

.expand-panel {
    padding: 8px 16px;
    background: #fafafa;
}

.expand-panel .no-spec {
    color: #c0c4cc;
    font-size: 13px;
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

.move-desc {
    margin-bottom: 12px;
    font-size: 14px;
    color: #606266;
}

.move-count {
    color: #e6a23c;
    font-size: 16px;
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
</style>
