<template>
    <div class="goods-add-page">
        <el-card class="main-card" shadow="never">
            <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="default">
                <!-- ====== 基本信息 ====== -->
                <el-divider content-position="left">
                    <span class="divider-title">基本信息</span>
                </el-divider>

                <el-form-item label="商品标题" prop="title">
                    <el-input v-model="form.title" placeholder="请输入商品标题" maxlength="500" show-word-limit />
                </el-form-item>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="商品分类">
                            <el-tree-select
                                v-model="form.categoryId"
                                :data="categoryTree"
                                :props="{ label: 'name', value: 'id', children: 'children' }"
                                placeholder="选择分类（三级）"
                                clearable
                                check-strictly
                                style="width: 100%"
                            />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item label="上架状态">
                    <el-radio-group v-model="form.isPutOnSale">
                        <el-radio :label="1">立即上架</el-radio>
                        <el-radio :label="0">暂不上架</el-radio>
                    </el-radio-group>
                </el-form-item>

                <!-- ====== 商品图片（统一，第一张为主图） ====== -->
                <el-divider content-position="left">
                    <span class="divider-title">商品图片</span>
                </el-divider>

                <div v-if="imageUploading" class="upload-progress">
                    <el-progress :percentage="uploadProgress" :stroke-width="8" :show-text="true" />
                    <span class="progress-text">正在上传... {{ uploadProgress }}%</span>
                </div>

                <el-form-item label="商品图片">
                    <div class="images-section">
                        <div v-for="(url, i) in form.images" :key="i" class="image-row">
                            <el-tag v-if="i === 0" type="danger" size="small" style="margin-right:6px">主图</el-tag>
                            <div class="image-preview" v-if="url">
                                <el-image :src="imgUrl(url)" fit="contain" style="width:80px;height:80px" />
                            </div>
                            <el-button type="danger" :icon="Delete" circle size="small" @click="removeImage(i)" />
                        </div>
                    </div>
                    <div style="margin-top:8px;">
                        <el-upload
                            action="#"
                            :show-file-list="false"
                            :auto-upload="false"
                            accept="image/*,video/*"
                            :before-upload="() => false"
                            @change="handleImageAdd"
                        >
                            <el-button type="primary" :icon="Plus" plain size="small">上传图片</el-button>
                        </el-upload>
                        <span class="tip" style="margin-left:8px">第一张为主图，支持图片和视频</span>
                    </div>
                </el-form-item>



                <!-- ====== 规格 ====== -->
                <el-divider content-position="left">
                    <span class="divider-title">规格定义</span>
                </el-divider>

                <el-form-item label="规格模式">
                    <el-tabs v-model="specMode" class="spec-tabs" @tab-change="onSpecModeChange">
                        <el-tab-pane label="无规格" name="noSpec">
                            <div class="no-spec-tip">
                                <p>当前为无规格商品。点击下方「自动生成SKU」生成一条无规格SKU，然后在 SKU 表格中填写价格、库存，并从进销存选择国际编码。</p>
                            </div>
                        </el-tab-pane>
                        <el-tab-pane label="有规格" name="spec">
                            <div class="specs-section">
                                <div v-for="(spec, si) in form.specs" :key="si" class="spec-block">
                                    <div class="spec-header">
                                        <span>规格{{ si + 1 }}：</span>
                                        <el-input v-model="spec.title" placeholder="规格名称（如颜色、尺码）" style="width: 160px" size="small" />
                                        <span class="spec-values-label">可选值：</span>
                                        <el-tag
                                            v-for="(sv, vi) in spec.values"
                                            :key="vi"
                                            closable
                                            size="small"
                                            @close="removeSpecValue(si, vi)"
                                            style="margin-right: 4px"
                                        >
                                            {{ sv.specValue }}
                                        </el-tag>
                                        <el-input
                                            v-if="spec.inputVisible"
                                            ref="specValueInputRef"
                                            v-model="spec.inputValue"
                                            size="small"
                                            style="width: 100px"
                                            @keyup.enter="addSpecValue(si)"
                                            @blur="addSpecValue(si)"
                                        />
                                        <el-button v-else size="small" :icon="Plus" @click="showSpecInput(si)">添加值</el-button>
                                        <el-button type="danger" size="small" :icon="Delete" circle @click="removeSpec(si)" />
                                    </div>
                                </div>
                                <el-button type="primary" :icon="Plus" plain size="small" @click="addSpec" :disabled="form.specs.length >= 3">
                                    添加规格
                                </el-button>
                                <span class="tip">最多3组规格</span>
                            </div>
                        </el-tab-pane>
                    </el-tabs>
                </el-form-item>

                <!-- ====== SKU 列表 ====== -->
                <el-divider content-position="left">
                    <span class="divider-title">
                        SKU 列表
                        <el-button type="success" :icon="Plus" size="small" plain @click="autoGenerateSkus" style="margin-left: 12px">
                            自动生成SKU
                        </el-button>
                    </span>
                </el-divider>

                <el-form-item label="">
                    <div class="sku-table-wrap">
                    <el-table :data="form.skus" border size="small" style="width: 100%">
                        <el-table-column label="SKU编码" width="160">
                            <template #default="scope">
                                <el-input v-model="scope.row.skuId" placeholder="自动生成" size="small" />
                            </template>
                        </el-table-column>
                        <el-table-column label="规格组合" min-width="200">
                            <template #default="scope">
                                <template v-if="scope.row.specInfo && scope.row.specInfo.length">
                                    <el-tag
                                        v-for="(si, ii) in scope.row.specInfo"
                                        :key="ii"
                                        size="small"
                                        type="info"
                                        style="margin-right: 4px"
                                    >
                                        {{ si.specValue }}
                                    </el-tag>
                                </template>
                                <span v-else class="no-spec">无规格</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="SKU图片" width="100">
                            <template #default="scope">
                                <div class="sku-image-cell">
                                    <el-avatar v-if="scope.row.skuImage" :src="imgUrl(scope.row.skuImage)" :size="32" shape="square" />
                                    <el-upload
                                        class="inline-upload"
                                        action="#"
                                        :show-file-list="false"
                                        :auto-upload="false"
                                        accept="image/*"
                                        :before-upload="() => false"
                                        @change="(file) => handleSkuImageUpload(file, scope.$index)"
                                    >
                                        <el-button type="primary" :icon="Upload" size="small" circle :loading="imageUploading" />
                                    </el-upload>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column label="售价(分)" width="120">
                            <template #default="scope">
                                <el-input-number v-model="scope.row.price" :min="0" :step="100" size="small" controls-position="right" style="width: 100%" />
                            </template>
                        </el-table-column>
                        <el-table-column label="国际编码" min-width="200">
                            <template #default="scope">
                                <el-tag
                                    v-if="scope.row.barcode"
                                    type="info"
                                    size="small"
                                    closable
                                    class="barcode-tag"
                                    @click="openStockPicker(scope.$index)"
                                    @close="scope.row.barcode = ''"
                                >
                                    {{ scope.row.barcode }}
                                </el-tag>
                                <el-button v-else type="primary" link size="small" @click="openStockPicker(scope.$index)">
                                    选择进销存商品
                                </el-button>
                            </template>
                        </el-table-column>
                        <el-table-column label="库存" width="100">
                            <template #default="scope">
                                <span class="stock-value">{{ scope.row.stockQuantity }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="80" fixed="right">
                            <template #default="scope">
                                <el-button type="danger" :icon="Delete" circle size="small" @click="removeSku(scope.$index)" />
                            </template>
                        </el-table-column>
                    </el-table>
                    </div>
                </el-form-item>

                <!-- ====== 标签 ====== -->
                <el-divider content-position="left">
                    <span class="divider-title">商品标签</span>
                </el-divider>

                <el-form-item label="标签">
                    <div class="tags-section">
                        <el-tag
                            v-for="(tag, ti) in form.tags"
                            :key="ti"
                            closable
                            @close="removeTag(ti)"
                            style="margin-right: 6px; margin-bottom: 6px"
                        >
                            {{ typeof tag === 'string' ? tag : tag.title }}
                        </el-tag>
                        <el-input
                            v-if="tagInputVisible"
                            ref="tagInputRef"
                            v-model="tagInputValue"
                            size="small"
                            style="width: 120px"
                            @keyup.enter="addTag"
                            @blur="addTag"
                        />
                        <el-button v-else size="small" :icon="Plus" @click="showTagInput">添加标签</el-button>
                    </div>
                </el-form-item>

                <!-- ====== 商品详情 ====== -->
                <el-divider content-position="left">
                    <span class="divider-title">商品详情</span>
                </el-divider>

                <div class="editor-wrapper">
                    <Toolbar :editor="editorRef" :defaultConfig="toolbarConfig" mode="default" />
                    <Editor :defaultConfig="editorConfig" mode="default" v-model="form.detail" @onCreated="onEditorCreated" />
                </div>
            </el-form>
        </el-card>

        <!-- ====== 进销存商品选择弹窗 ====== -->
        <el-dialog
            v-model="stockPickerVisible"
            title="选择进销存商品"
            width="680px"
            top="8vh"
            append-to-body
            destroy-on-close
        >
            <div class="stock-picker-filter">
                <el-input
                    v-model="stockPickerKeyword"
                    placeholder="输入商品名称搜索"
                    clearable
                    size="default"
                    :prefix-icon="Search"
                    @keyup.enter="searchStockGoods(stockPickerKeyword)"
                    @clear="searchStockGoods('')"
                >
                    <template #append>
                        <el-button :icon="Search" @click="searchStockGoods(stockPickerKeyword)">搜索</el-button>
                    </template>
                </el-input>
            </div>
            <el-table
                :data="stockGoodsOptions"
                v-loading="skuSelectLoading"
                border
                size="small"
                max-height="420"
                highlight-current-row
                class="stock-picker-table"
            >
                <el-table-column prop="name" label="商品名称" min-width="160" show-overflow-tooltip />
                <el-table-column prop="barcode" label="国际编码" width="140" />
                <el-table-column prop="stockQuantity" label="库存" width="80" />
                <el-table-column prop="salePrice" label="售价(元)" width="90" />
                <el-table-column label="操作" width="80" fixed="right">
                    <template #default="scope">
                        <el-button type="primary" link size="small" @click="confirmPickStock(scope.row)">选择</el-button>
                    </template>
                </el-table-column>
                <template #empty>
                    <span>未找到进销存商品，可调整关键字重试</span>
                </template>
            </el-table>
            <template #footer>
                <el-button @click="stockPickerVisible = false">关闭</el-button>
            </template>
        </el-dialog>

        <!-- 底部操作栏 -->
        <div class="bottom-bar">
            <el-button type="primary" size="large" @click="handleSubmit" :loading="submitting">
                <el-icon><Check /></el-icon> {{ isEdit ? '更新商品' : '保存商品' }}
            </el-button>
            <el-button size="large" @click="handleCancel">取消</el-button>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onActivated, nextTick, shallowRef } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Plus, Delete, Check, Upload, Close, Search } from '@element-plus/icons-vue'
import { toast, imgUrl } from '~/composables/util'
import store from '~/store'
import { addGoods, updateGoods, getGoodsDetail } from '~/api/goods'
import { getStockGoodsList } from '~/api/stock'
import { getCategoryTree } from '~/api/category'
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { useImageUpload } from '~/composables/useImageUpload'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)

const { uploading: imageUploading, progress: uploadProgress, handleUpload } = useImageUpload()

const isEdit = ref(false)
const editSpuId = ref(null)

// 规格模式：noSpec=无规格，spec=有规格
const specMode = ref('noSpec')

// 切换规格模式时清空已生成的 SKU，避免规格/无规格混合
function onSpecModeChange() {
    form.skus = []
}

const form = reactive({
    title: '',
    categoryId: null,
    isPutOnSale: 0,
    images: [],
    detail: '',
    specs: [],
    skus: [],
    tags: [],
})

const rules = {
    title: [{ required: true, message: '请输入商品标题', trigger: 'blur' }],
}

// 富文本编辑器
const editorRef = shallowRef()

const toolbarConfig = {
    excludeKeys: ['group-table', 'todo', 'group-video'],
}

const editorConfig = {
    placeholder: '请输入商品详情，支持图文混排...',
    MENU_CONF: {
        uploadImage: {
            async customUpload(file, insertFn) {
                const result = await handleUpload(file, 'editor')
                // 编辑器内用完整公网URL预览，存库时由 toRelPath 转回相对路径
                const previewUrl = result?.public_url || result?.url
                if (previewUrl) {
                    insertFn(previewUrl, file.name, previewUrl)
                }
            },
        },
    },
}

function onEditorCreated(editor) {
    editorRef.value = editor
    // 为编辑器内容区添加移动端友好样式
    const editorEl = editor.getEditableContainer()
    if (editorEl) {
        editorEl.style.cssText = 'word-break:break-word;overflow-wrap:break-word;'
    }
}

const categoryTree = ref([])
const submitting = ref(false)

// ====== 图片上传处理 ======
async function handleImageAdd(file) {
    if (!file?.raw) return
    const result = await handleUpload(file.raw, 'product')
    if (result?.url) {
        form.images.push(result.url)
    }
}

async function handleSkuImageUpload(file, index) {
    if (!file?.raw) return
    const result = await handleUpload(file.raw, 'product')
    if (result?.url) {
        form.skus[index].skuImage = result.url
    }
}

// ====== 图片列表操作 ======
function removeImage(i) { form.images.splice(i, 1) }

// ====== 规格 ======
function addSpec() {
    form.specs.push({
        title: '',
        values: [],
        inputVisible: false,
        inputValue: '',
    })
}

function removeSpec(i) { form.specs.splice(i, 1) }

function showSpecInput(i) {
    form.specs[i].inputVisible = true
    nextTick(() => {
        const refs = specValueInputRef.value
        if (refs) {
            const input = Array.isArray(refs) ? refs[refs.length - 1] : refs
            input?.focus?.()
        }
    })
}

const specValueInputRef = ref([])

function addSpecValue(si) {
    const spec = form.specs[si]
    const val = spec.inputValue?.trim()
    if (!val) { spec.inputVisible = false; return }
    if (spec.values.find(v => v.specValue === val)) { spec.inputVisible = false; return }
    spec.values.push({
        specValueId: randomId(),
        specId: randomId(),
        specValue: val,
    })
    spec.inputValue = ''
    spec.inputVisible = false
}

function removeSpecValue(si, vi) {
    form.specs[si].values.splice(vi, 1)
}

// ====== SKU ======
function autoGenerateSkus() {
    const specs = form.specs.filter(s => s.values.length > 0)

    // 无规格模式：生成一条无规格 SKU
    if (specMode.value === 'noSpec') {
        form.skus = [{
            skuId: randomId(),
            skuImage: '',
            price: 0,
            barcode: '',
            stockQuantity: 0,
            specInfo: [],
        }]
        toast('已生成 1 个SKU（无规格）', 'success')
        return
    }

    const combinations = cartesianProduct(specs.map(s => s.values))
    form.skus = combinations.map(combo => ({
        skuId: randomId(),
        skuImage: '',
        price: 0,
        barcode: '',
        stockQuantity: 0,
        specInfo: combo.map((v, idx) => ({
            specId: specs[idx].title,
            specValueId: v.specValueId,
            specValue: v.specValue,
        })),
    }))

    toast(`已生成 ${form.skus.length} 个SKU`, 'success')
}

function removeSku(i) { form.skus.splice(i, 1) }

// ====== 进销存商品选择弹窗 ======
const skuSelectLoading = ref(false)
const stockGoodsOptions = ref([])
const stockPickerVisible = ref(false)
const stockPickerKeyword = ref('')
const stockPickerIndex = ref(-1)

async function searchStockGoods(keyword) {
    skuSelectLoading.value = true
    try {
        const data = await getStockGoodsList({ pageIndex: 1, pageSize: 50, keyword: keyword || '' })
        stockGoodsOptions.value = (data && data.list) || []
    } catch (e) {
        stockGoodsOptions.value = []
    } finally {
        skuSelectLoading.value = false
    }
}

// 打开弹窗，加载进销存商品列表
function openStockPicker(index) {
    stockPickerIndex.value = index
    stockPickerKeyword.value = ''
    stockPickerVisible.value = true
    searchStockGoods('')
}

// 选择某条进销存商品：回填条码 + 库存（只回填库存，不回填售价/图片）
function confirmPickStock(goods) {
    if (!goods) return
    const idx = stockPickerIndex.value
    if (idx >= 0 && form.skus[idx]) {
        form.skus[idx].barcode = goods.barcode || ''
        form.skus[idx].stockQuantity = goods.stockQuantity || 0
    }
    stockPickerVisible.value = false
}

// ====== 标签 ======
const tagInputVisible = ref(false)
const tagInputValue = ref('')
const tagInputRef = ref(null)

function showTagInput() {
    tagInputVisible.value = true
    nextTick(() => tagInputRef.value?.focus?.())
}

function addTag() {
    const val = tagInputValue.value?.trim()
    if (!val) { tagInputVisible.value = false; return }
    if (form.tags.includes(val)) { tagInputVisible.value = false; return }
    form.tags.push(val)
    tagInputValue.value = ''
    tagInputVisible.value = false
}

function removeTag(i) { form.tags.splice(i, 1) }

// ====== 提交 ======
async function handleSubmit() {
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return

    submitting.value = true
    try {
        const payload = {
            title: form.title,
            categoryId: form.categoryId,
            isPutOnSale: form.isPutOnSale,
            images: form.images.filter(u => u.trim()).map(u => toRelPath(u)),
            // 富文本图片转相对路径存库（完整URL由后端返回时拼接）
            detail: toRelPath(form.detail),
            specs: form.specs.map(s => ({
                specId: randomId(),
                title: s.title,
                values: s.values,
            })),
            skus: form.skus.map(s => ({
                skuId: s.skuId,
                skuImage: toRelPath(s.skuImage),
                price: s.price,
                barcode: s.barcode,
                stockQuantity: s.stockQuantity,
                specInfo: s.specInfo,
            })),
            tags: form.tags.map(t => (typeof t === 'string' ? { title: t } : t)),
        }

        if (isEdit.value) {
            await updateGoods(editSpuId.value, payload)
            toast('商品更新成功', 'success')
        } else {
            await addGoods(payload)
            toast('商品添加成功', 'success')
        }
        router.push('/goods/list')
    } catch (e) {
        // 数据可能已入库，仅提示网络异常
        toast('保存失败: ' + (e.message || '请稍后重试'), 'error')
    } finally {
        submitting.value = false
    }
}

function handleCancel() {
    router.back()
}

// ====== 工具函数 ======
function randomId() {
    return Math.random().toString(36).substring(2, 14) + Date.now().toString(36)
}

// 把富文本HTML里完整URL的图片(<img src="https://...">)转回相对路径(去掉imageBaseUrl前缀)
// 存库时只存对象存储路径(/mall-images1/...)，完整URL由后端在返回时拼接
function toRelPath(html) {
    if (!html) return html || ''
    const base = store.state.imageBaseUrl || ''
    if (!base) return html
    let rel = html.split(base).join('')
    // 保证以 / 开头(相对路径格式与后端 relative_url 一致)
    if (rel && rel.charAt(0) !== '/') rel = '/' + rel
    return rel
}

function cartesianProduct(arrays) {
    if (!arrays.length) return [[]]
    const rest = cartesianProduct(arrays.slice(1))
    return arrays[0].flatMap(v => rest.map(r => [v, ...r]))
}

// ====== 加载分类树 ======
async function loadCategoryTree() {
    try {
        categoryTree.value = await getCategoryTree()
    } catch (e) {
        console.error('加载分类树失败', e)
    }
}

// ====== 初始化 ======
onMounted(async () => {
    await loadCategoryTree()

    // 编辑模式：根据 spuId 加载商品数据回填
    const spuId = route.query.spuId
    if (spuId) {
        isEdit.value = true
        editSpuId.value = spuId
        await loadGoodsDetail(spuId)
    }
})

// Keep-alive 缓存激活时，根据路由参数判断是新增还是编辑，重置/回填表单
onActivated(() => {
    loadCategoryTree()
    const spuId = route.query.spuId
    if (spuId && spuId !== editSpuId.value) {
        // 切换到编辑另一个商品 → 重新加载
        isEdit.value = true
        editSpuId.value = spuId
        loadGoodsDetail(spuId)
    } else if (!spuId && editSpuId.value) {
        // 从编辑切回新增 → 清空表单
        resetForm()
    } else if (!spuId && !isEdit.value) {
        // 新增后去列表再点新增 → 上次内容还残留，需清空
        resetForm()
    }
})

// 加载商品详情回填表单
async function loadGoodsDetail(spuId) {
    try {
        const data = await getGoodsDetail(spuId)
        if (data) {
            form.title = data.title || ''
            form.categoryId = data.categoryId || null
            form.isPutOnSale = data.isPutOnSale ?? 0
            // 合并 primaryImage + images 到统一数组，第一张是主图
            const imgs = data.images || []
            if (data.primaryImage && (!imgs.length || imgs[0] !== data.primaryImage)) {
                imgs.unshift(data.primaryImage)
            }
            form.images = imgs
            form.detail = data.detailContent || data.detail || ''
            form.tags = data.tags || []

            // 回填规格
            if (data.specs && data.specs.length) {
                form.specs = data.specs.map(s => ({
                    title: s.title || '',
                    values: (s.values || []).map(v => ({
                        specValueId: v.specValueId || randomId(),
                        specId: v.specId || randomId(),
                        specValue: v.specValue || '',
                    })),
                    inputVisible: false,
                    inputValue: '',
                }))
            }

            // 回填 SKU
            if (data.skuList && data.skuList.length) {
                form.skus = data.skuList.map(s => ({
                    skuId: s.skuId || randomId(),
                    skuImage: s.skuImage || '',
                    price: (s.priceInfo && s.priceInfo[0]?.price) || 0,
                    barcode: s.barcode || '',
                    stockQuantity: (s.stockInfo && s.stockInfo.stockQuantity) || 0,
                    specInfo: s.specInfo || [],
                }))
                // 根据首个 SKU 是否带规格，决定规格模式
                const hasSpec = (data.skuList[0]?.specInfo && data.skuList[0].specInfo.length > 0)
                specMode.value = hasSpec ? 'spec' : 'noSpec'
            }
        }
    } catch (e) {
        console.error('加载商品数据失败', e)
        toast('加载商品数据失败', 'error')
    }
}

// 重置表单到初始状态
function resetForm() {
    isEdit.value = false
    editSpuId.value = null
    form.title = ''
    form.categoryId = null
    form.isPutOnSale = 0
    form.images = []
    form.detail = ''
    form.specs = []
    form.skus = []
    form.tags = []
    specMode.value = 'noSpec'
    editorRef.value?.setContents?.('')
    formRef.value?.clearValidate?.()
}
</script>

<style scoped>
.goods-add-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-bottom: 80px;
    overflow-x: hidden;
}

.main-card {
    border: none;
    overflow-x: hidden;
}

.divider-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
}

.tip {
    font-size: 12px;
    color: #909399;
    margin-left: 8px;
}

.image-upload-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

/* 主图拖拽上传区域 */
.image-upload-row .inline-upload .el-upload-dragger {
    padding: 12px 20px;
    height: auto;
    min-height: 80px;
    width: 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.image-upload-row .inline-upload .el-upload-dragger:hover {
    border-color: #409eff;
}

.image-upload-row .inline-upload .el-upload-dragger .el-icon {
    margin-bottom: 0;
}

/* 轮播图/详情图的小拖拽区域 */
.images-section .inline-upload .el-upload-dragger {
    padding: 6px 8px;
    height: auto;
    min-height: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
}

.images-section .inline-upload .el-upload-dragger:hover {
    border-color: #409eff;
}

.images-section {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.image-row {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #fafafa;
    border: 1px solid #eee;
    border-radius: 6px;
    padding: 6px;
}

.sku-table-wrap {
    overflow-x: auto;
    max-width: 100%;
}

.image-preview {
    flex-shrink: 0;
    position: relative;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    overflow: hidden;
}

.image-preview-close {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 18px;
    height: 18px;
    background: #f56c6c;
    color: #fff;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    opacity: 0;
    transition: opacity 0.2s;
}

.image-preview:hover .image-preview-close {
    opacity: 1;
}

.inline-upload {
    display: inline-flex;
}

.sku-image-cell {
    display: flex;
    align-items: center;
    gap: 4px;
}

.spec-tabs :deep(.el-tabs__header) {
    margin-bottom: 12px;
}

.no-spec-tip {
    padding: 16px;
    background: #fafafa;
    border: 1px dashed #dcdfe6;
    border-radius: 6px;
    color: #606266;
    font-size: 13px;
    line-height: 1.8;
}

.barcode-tag {
    cursor: pointer;
    max-width: 100%;
}

.stock-value {
    color: #303133;
    display: inline-block;
    width: 100%;
    text-align: center;
}

.stock-picker-filter {
    margin-bottom: 12px;
}

.stock-picker-table :deep(.el-table__row) {
    cursor: pointer;
}

.specs-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.spec-block {
    padding: 10px 12px;
    background: #fafafa;
    border-radius: 6px;
    border: 1px solid #ebeef5;
}

.spec-header {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.spec-values-label {
    font-size: 13px;
    color: #606266;
    margin-left: 8px;
}

.no-spec {
    color: #c0c4cc;
    font-size: 13px;
}

.tags-section {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
}

.editor-wrapper {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    z-index: 1;
}

.editor-wrapper :deep(.w-e-toolbar) {
    border-bottom: 1px solid #dcdfe6;
    border-radius: 4px 4px 0 0;
}

.editor-wrapper :deep(.w-e-text-container) {
    min-height: 400px;
}

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

.upload-progress {
    padding: 12px 0;
}
.upload-progress .progress-text {
    display: block;
    text-align: center;
    font-size: 13px;
    color: #409eff;
    margin-top: 4px;
}
</style>
