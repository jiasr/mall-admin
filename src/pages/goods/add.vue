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

                <el-form-item label="英文标题">
                    <el-input v-model="form.etitle" placeholder="英文标题（选填）" maxlength="500" />
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
                    <el-col :span="12">
                        <el-form-item label="上架状态">
                            <el-radio-group v-model="form.isPutOnSale">
                                <el-radio :label="1">立即上架</el-radio>
                                <el-radio :label="0">暂不上架</el-radio>
                            </el-radio-group>
                        </el-form-item>
                    </el-col>
                </el-row>

                <!-- ====== 商品图片 ====== -->
                <el-divider content-position="left">
                    <span class="divider-title">商品图片</span>
                </el-divider>

                <el-form-item label="主图">
                    <div class="image-upload-row">
                        <div class="image-preview" v-if="form.primaryImage">
                            <el-image :src="form.primaryImage" fit="contain" style="width:80px;height:80px" />
                        </div>
                        <el-input v-model="form.primaryImage" placeholder="输入图片URL或拖拽上传" style="width: 350px" />
                        <el-upload
                            class="inline-upload"
                            action="#"
                            :show-file-list="false"
                            :auto-upload="false"
                            accept="image/*"
                            :before-upload="() => false"
                            @change="(file) => handleFileUpload(file, 'primaryImage', 'product')"
                            drag
                        >
                            <el-icon :size="16"><UploadFilled /></el-icon>
                            <span style="font-size:12px;margin-left:4px">拖拽上传</span>
                        </el-upload>
                        <span class="tip">建议尺寸 750x750</span>
                    </div>
                </el-form-item>

                <el-form-item label="轮播图">
                    <div class="images-section">
                        <div v-for="(url, i) in form.images" :key="i" class="image-row">
                            <div class="image-preview" v-if="url">
                                <el-image :src="url" fit="contain" style="width:60px;height:60px" />
                            </div>
                            <el-input v-model="form.images[i]" placeholder="输入图片URL或点击上传" style="width: 350px" />
                        <el-upload
                            class="inline-upload"
                            action="#"
                            :show-file-list="false"
                            :auto-upload="false"
                            accept="image/*"
                            :before-upload="() => false"
                            @change="(file) => handleImageSlotUpload(file, i, 'images', 'product')"
                            drag
                        >
                            <el-icon :size="14"><UploadFilled /></el-icon>
                        </el-upload>
                            <el-button type="danger" :icon="Delete" circle size="small" @click="removeImage(i)" />
                        </div>
                        <el-button type="primary" :icon="Plus" plain size="small" @click="addImage">添加轮播图</el-button>
                    </div>
                </el-form-item>

                <el-form-item label="详情图">
                    <div class="images-section">
                        <div v-for="(url, i) in form.desc" :key="i" class="image-row">
                            <div class="image-preview" v-if="url">
                                <el-image :src="url" fit="contain" style="width:60px;height:60px" />
                            </div>
                            <el-input v-model="form.desc[i]" placeholder="输入详情图URL或点击上传" style="width: 350px" />
                        <el-upload
                            class="inline-upload"
                            action="#"
                            :show-file-list="false"
                            :auto-upload="false"
                            accept="image/*"
                            :before-upload="() => false"
                            @change="(file) => handleImageSlotUpload(file, i, 'desc', 'product')"
                            drag
                        >
                            <el-icon :size="14"><UploadFilled /></el-icon>
                        </el-upload>
                            <el-button type="danger" :icon="Delete" circle size="small" @click="removeDesc(i)" />
                        </div>
                        <el-button type="primary" :icon="Plus" plain size="small" @click="addDesc">添加详情图</el-button>
                    </div>
                </el-form-item>


                <!-- ====== 规格 ====== -->
                <el-divider content-position="left">
                    <span class="divider-title">规格定义</span>
                </el-divider>

                <el-form-item label="商品规格">
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
                        <el-table-column label="SKU图片" width="220">
                            <template #default="scope">
                                <div class="sku-image-cell">
                                    <el-input v-model="scope.row.skuImage" placeholder="图片URL" size="small" style="width: 120px" />
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
                        <el-table-column label="划线价(分)" width="130">
                            <template #default="scope">
                                <el-input-number v-model="scope.row.linePrice" :min="0" :step="100" size="small" controls-position="right" style="width: 100%" />
                            </template>
                        </el-table-column>
                        <el-table-column label="库存" width="100">
                            <template #default="scope">
                                <el-input-number v-model="scope.row.stockQuantity" :min="0" size="small" controls-position="right" style="width: 100%" />
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="80" fixed="right">
                            <template #default="scope">
                                <el-button type="danger" :icon="Delete" circle size="small" @click="removeSku(scope.$index)" />
                            </template>
                        </el-table-column>
                    </el-table>
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
import { Plus, Delete, Check, Upload } from '@element-plus/icons-vue'
import { toast } from '~/composables/util'
import { addGoods, updateGoods, getGoodsDetail } from '~/api/goods'
import { getCategoryTree } from '~/api/category'
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { useImageUpload } from '~/composables/useImageUpload'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)

const { uploading: imageUploading, handleUpload } = useImageUpload()

const isEdit = ref(false)
const editSpuId = ref(null)

const form = reactive({
    title: '',
    etitle: '',
    categoryId: null,
    isPutOnSale: 0,
    primaryImage: '',
    images: [],
    desc: [],
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
                // 使用 MinIO 上传，上传成功后插入公网 URL
                const url = await handleUpload(file, 'editor')
                if (url) {
                    insertFn(url, file.name, url)
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
async function handleFileUpload(file, field, scene) {
    if (!file?.raw) return
    const url = await handleUpload(file.raw, scene)
    if (url) {
        form[field] = url
    }
}

async function handleImageSlotUpload(file, index, field, scene) {
    if (!file?.raw) return
    const url = await handleUpload(file.raw, scene)
    if (url) {
        form[field][index] = url
    }
}

async function handleSkuImageUpload(file, index) {
    if (!file?.raw) return
    const url = await handleUpload(file.raw, 'product')
    if (url) {
        form.skus[index].skuImage = url
    }
}

// ====== 图片列表操作 ======
function addImage() { form.images.push('') }
function removeImage(i) { form.images.splice(i, 1) }
function addDesc() { form.desc.push('') }
function removeDesc(i) { form.desc.splice(i, 1) }

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
    if (specs.length === 0) {
        toast('请先设置规格及规格值', 'warning')
        return
    }

    const combinations = cartesianProduct(specs.map(s => s.values))
    form.skus = combinations.map(combo => ({
        skuId: randomId(),
        skuImage: '',
        price: 0,
        linePrice: 0,
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
            etitle: form.etitle,
            categoryId: form.categoryId,
            isPutOnSale: form.isPutOnSale,
            primaryImage: form.primaryImage,
            images: form.images.filter(u => u.trim()),
            desc: form.desc.filter(u => u.trim()),
            detail: form.detail,
            specs: form.specs.map(s => ({
                specId: randomId(),
                title: s.title,
                values: s.values,
            })),
            skus: form.skus.map(s => ({
                skuId: s.skuId,
                skuImage: s.skuImage,
                price: s.price,
                linePrice: s.linePrice,
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
        console.error('添加商品失败', e)
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
        try {
            const data = await getGoodsDetail(spuId)
            if (data) {
                form.title = data.title || ''
                form.etitle = data.etitle || ''
                form.categoryId = data.categoryId || null
                form.isPutOnSale = data.isPutOnSale ?? 0
                form.primaryImage = data.primaryImage || ''
                form.images = data.images || []
                form.desc = data.desc || []
                form.detail = data.detail || ''
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
                        linePrice: (s.priceInfo && s.priceInfo[0]?.linePrice) || 0,
                        stockQuantity: (s.stockInfo && s.stockInfo.stockQuantity) || 0,
                        specInfo: s.specInfo || [],
                    }))
                }
            }
        } catch (e) {
            console.error('加载商品数据失败', e)
            toast('加载商品数据失败', 'error')
        }
    }
})

// Keep-alive 缓存激活时重新加载分类树（用户在分类页新增后切回来能刷新）
onActivated(() => {
    loadCategoryTree()
})
</script>

<style scoped>
.goods-add-page {
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

/* 行内拖拽上传区域 - 压缩尺寸 */
.image-upload-row .inline-upload .el-upload-dragger {
    padding: 6px 10px;
    height: auto;
    min-height: auto;
    display: flex;
    align-items: center;
    gap: 4px;
}

.image-upload-row .inline-upload .el-upload-dragger:hover {
    border-color: #409eff;
}

.image-upload-row .inline-upload .el-upload-dragger .el-icon {
    margin-bottom: 0;
}

.images-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.image-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.image-preview {
    flex-shrink: 0;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    overflow: hidden;
}

.inline-upload {
    display: inline-flex;
}

.sku-image-cell {
    display: flex;
    align-items: center;
    gap: 4px;
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
</style>
