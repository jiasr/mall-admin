<template>
    <div class="category-page">
        <!-- 顶部操作栏 -->
        <div class="toolbar">
            <el-button type="primary" @click="handleAdd(0)">
                <el-icon><Plus /></el-icon> 新增一级分类
            </el-button>
            <el-button @click="toggleExpandAll">
                {{ isAllExpanded ? '收起全部' : '展开全部' }}
            </el-button>
            <el-button @click="handleRefresh">
                <el-icon><Refresh /></el-icon> 刷新
            </el-button>
            <el-divider direction="vertical" />
            <el-button
                type="danger"
                plain
                :disabled="selectedIds.length === 0"
                @click="handleBatchDelete"
            >
                <el-icon><Delete /></el-icon> 批量删除 ({{ selectedIds.length }})
            </el-button>
            <span class="drag-tip" v-if="!loading">拖拽行可调整排序</span>
        </div>

        <!-- 树形表格 -->
        <el-table
            ref="tableRef"
            :data="tableData"
            row-key="id"
            border
            :default-expand-all="isAllExpanded"
            :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
            style="width: 100%"
            v-loading="loading"
            @selection-change="onSelectionChange"
            row-class-name="draggable-row"
        >
            <el-table-column type="selection" width="45" />

            <el-table-column prop="name" label="分类名称" min-width="240">
                <template #default="scope">
                    <el-image
                        v-if="scope.row.thumbnail"
                        :src="scope.row.thumbnail"
                        fit="cover"
                        style="width:28px;height:28px;border-radius:4px;vertical-align:middle;margin-right:6px"
                    />
                    <el-tag :type="levelTagType(scope.row)" size="small" class="mr-2">{{ levelTagText(scope.row) }}</el-tag>
                    <span>{{ scope.row.name }}</span>
                </template>
            </el-table-column>

            <el-table-column prop="level" label="层级" width="70" align="center">
                <template #default="scope">
                    {{ getLevel(scope.row) }}级
                </template>
            </el-table-column>

            <el-table-column width="90" align="center" label="排序">
                <template #default="scope">
                    <el-button link size="small" @click="handleMoveUp(scope.row)" :disabled="loading">
                        <el-icon><ArrowUp /></el-icon>
                    </el-button>
                    <el-button link size="small" @click="handleMoveDown(scope.row)" :disabled="loading">
                        <el-icon><ArrowDown /></el-icon>
                    </el-button>
                </template>
            </el-table-column>

            <el-table-column label="创建时间" width="170">
                <template #default="scope">
                    {{ scope.row.createtime || '-' }}
                </template>
            </el-table-column>

            <el-table-column label="操作" width="290" fixed="right" align="center">
                <template #default="scope">
                    <el-button type="primary" size="small" link @click="handleAdd(scope.row.id)">
                        <el-icon><Plus /></el-icon> 添加子分类
                    </el-button>
                    <el-button type="info" size="small" link @click="handleEdit(scope.row)">
                        <el-icon><Edit /></el-icon> 编辑
                    </el-button>
                    <el-button type="danger" size="small" link @click="handleDelete(scope.row)">
                        <el-icon><Delete /></el-icon> 删除
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 新增/编辑分类弹窗 -->
        <el-dialog
            v-model="dialogVisible"
            :title="dialogTitle"
            width="520px"
            :close-on-click-modal="false"
        >
            <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
                <el-form-item label="分类名称" prop="name">
                    <el-input v-model="form.name" placeholder="请输入分类名称" maxlength="50" show-word-limit />
                </el-form-item>
                <el-form-item label="上级分类" v-if="!isEdit">
                    <el-input :value="parentName" disabled placeholder="无（顶级分类）" />
                </el-form-item>
                <el-form-item label="分类层级" v-if="!isEdit">
                    <el-tag :type="dialogLevelTagType">{{ form.level }}级分类</el-tag>
                </el-form-item>
                <el-form-item label="排序号">
                    <el-input-number v-model="form.sortOrder" :min="0" :max="9999" />
                    <span class="form-tip">数字越大越靠前</span>
                </el-form-item>
                <el-form-item label="分类图标">
                    <div class="thumbnail-upload">
                        <el-image
                            v-if="form.thumbnail"
                            :src="form.thumbnail"
                            fit="cover"
                            style="width:60px;height:60px;border-radius:6px;margin-right:10px;border:1px solid #dcdfe6"
                        />
                        <el-upload
                            action="#"
                            :show-file-list="false"
                            :auto-upload="false"
                            accept="image/*"
                            :before-upload="() => false"
                            @change="handleThumbnailUpload"
                        >
                            <el-button type="primary" plain :loading="thumbnailUploading">
                                {{ form.thumbnail ? '更换图标' : '上传图标' }}
                            </el-button>
                        </el-upload>
                        <el-button
                            v-if="form.thumbnail"
                            type="danger"
                            plain
                            size="small"
                            style="margin-left:6px"
                            @click="form.thumbnail = ''"
                        >
                            清除
                        </el-button>
                    </div>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
                    {{ isEdit ? '保存' : '新增' }}
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { Plus, Refresh, Edit, Delete, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import Sortable from 'sortablejs'
import { getCategoryTree, addCategory, updateCategory, deleteCategory, updateCategorySort, batchDeleteCategory } from '~/api/category'
import { toast, showModal } from '~/composables/util'
import { useImageUpload } from '~/composables/useImageUpload'

const { uploading: thumbnailUploading, handleUpload } = useImageUpload()

// 表格数据
const tableRef = ref(null)
const tableData = ref([])
const loading = ref(false)
const isAllExpanded = ref(true)
const selectedIds = ref([])

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增分类')
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)

const form = reactive({
    id: null,
    name: '',
    parentId: 0,
    level: 1,
    sortOrder: 0,
    thumbnail: '',
})

const rules = {
    name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
}

// 父级名称
const parentName = ref('')

// 拖拽实例
let sortableInstance = null

// ====== 工具函数 ======

function getLevel(row) {
    return row._depth || 1
}

function isTopLevel(parentId) {
    return parentId == 0
}

const cnNums = ['一', '二', '三', '四', '五', '六', '七', '八', '九']

function toCn(num) {
    if (num <= 9) return cnNums[num - 1]
    return String(num)
}

const tagTypes = ['danger', 'warning', 'success', 'info', '']

function levelTagType(row) {
    const lv = getLevel(row)
    return tagTypes[(lv - 1) % tagTypes.length]
}

function levelTagText(row) {
    return toCn(getLevel(row)) + '级'
}

function findCategoryName(tree, id) {
    for (const node of tree) {
        if (node.id === id) return node.name
        if (node.children && node.children.length > 0) {
            const found = findCategoryName(node.children, id)
            if (found) return found
        }
    }
    return ''
}

/** 扁平化树：收集所有节点（包含 _depth） */
function flattenTree(nodes, parentId = '0', depth = 1) {
    const result = []
    for (const node of nodes) {
        result.push({ ...node, _flatParentId: parentId, _flatDepth: depth })
        if (node.children && node.children.length > 0) {
            result.push(...flattenTree(node.children, node.id, depth + 1))
        }
    }
    return result
}

const dialogLevelTagType = computed(() => {
    const lv = form.level
    return tagTypes[(lv - 1) % tagTypes.length]
})

// ====== 批量选择 ======

function onSelectionChange(rows) {
    const ids = []
    function collect(nodes) {
        for (const n of nodes) {
            ids.push(n.id)
            if (n.children && n.children.length > 0) collect(n.children)
        }
    }
    collect(rows)
    selectedIds.value = ids
}

// ====== 数据加载 ======

async function fetchData() {
    loading.value = true
    try {
        const data = await getCategoryTree()
        function injectDepth(nodes, depth) {
            if (!nodes || !Array.isArray(nodes)) return
            nodes.forEach(node => {
                node._depth = depth
                if (node.children && node.children.length > 0) {
                    injectDepth(node.children, depth + 1)
                }
            })
        }
        injectDepth(data || [], 1)
        tableData.value = data || []
        await nextTick()
        initSortable()
    } catch (e) {
        console.error('获取分类树失败', e)
    } finally {
        loading.value = false
    }
}

// ====== 拖拽排序 ======

function initSortable() {
    destroySortable()
    const wrapper = tableRef.value?.$el
    if (!wrapper) return
    const tbody = wrapper.querySelector('.el-table__body-wrapper tbody')
    if (!tbody) return

    sortableInstance = Sortable.create(tbody, {
        animation: 200,
        delay: 150,
        delayOnTouchOnly: true,
        onEnd: handleDragEnd,
    })
}

function destroySortable() {
    if (sortableInstance) {
        sortableInstance.destroy()
        sortableInstance = null
    }
}

async function handleDragEnd() {
    const wrapper = tableRef.value?.$el
    const tbody = wrapper?.querySelector('.el-table__body-wrapper tbody')
    if (!tbody) return

    const rows = tbody.querySelectorAll('.el-table__row')
    const flatVisual = []

    rows.forEach(tr => {
        const id = tr.getAttribute('row-key')
        if (!id) return
        const firstCell = tr.querySelector('td:first-child .el-table__cell')
        const cell = firstCell || tr.querySelector('td:first-child .cell')
        let indent = 0
        if (cell) {
            const px = cell.style.paddingLeft
            if (px) indent = parseInt(px) || 0
        }
        const depth = Math.round(indent / 16)
        flatVisual.push({ id, depth })
    })

    if (flatVisual.length === 0) return

    // 根据缩进构建父子关系
    const parentStack = [{ id: '0', depth: -1 }]
    const itemParentMap = {}

    for (const item of flatVisual) {
        while (parentStack.length > 0 && parentStack[parentStack.length - 1].depth >= item.depth) {
            parentStack.pop()
        }
        const parentId = parentStack.length > 0 ? parentStack[parentStack.length - 1].id : '0'
        itemParentMap[item.id] = parentId
        parentStack.push({ id: item.id, depth: item.depth })
    }

    // 按父级分组，分配 sort_order
    const siblings = {}
    for (const item of flatVisual) {
        const pid = itemParentMap[item.id]
        if (!siblings[pid]) siblings[pid] = []
        siblings[pid].push(item.id)
    }

    const items = []
    for (const [, ids] of Object.entries(siblings)) {
        ids.forEach((id, idx) => {
            items.push({ id, sortOrder: (ids.length - idx) * 10 })
        })
    }

    if (items.length === 0) return

    try {
        await updateCategorySort({ items })
        toast('排序已更新', 'success')
        await fetchData()
    } catch (e) {
        console.error('排序更新失败', e)
        toast('排序更新失败', 'error')
    }
}

// ====== 上下移动 ======

function getSiblings(row) {
    const flat = flattenTree(tableData.value)
    const parentId = isTopLevel(row.parentId) ? '0' : row.parentId
    return flat.filter(n => {
        const nParent = isTopLevel(n.parentId) ? '0' : n.parentId
        return nParent === parentId && n.id !== row.id
    }).sort((a, b) => (b.sort || 0) - (a.sort || 0))
}

async function handleMoveUp(row) {
    const sibs = getSiblings(row)
    const currentSort = row.sort || 0
    const above = sibs.find(n => (n.sort || 0) > currentSort)
    if (!above) {
        toast('已经是第一位了', 'warning')
        return
    }
    const items = [
        { id: row.id, sortOrder: above.sort || 0 },
        { id: above.id, sortOrder: currentSort },
    ]
    try {
        await updateCategorySort({ items })
        toast('排序已更新', 'success')
        await fetchData()
    } catch (e) {
        console.error('移动失败', e)
    }
}

async function handleMoveDown(row) {
    const sibs = getSiblings(row)
    const currentSort = row.sort || 0
    const below = sibs.find(n => (n.sort || 0) < currentSort)
    if (!below) {
        toast('已经是最后一位了', 'warning')
        return
    }
    const items = [
        { id: row.id, sortOrder: below.sort || 0 },
        { id: below.id, sortOrder: currentSort },
    ]
    try {
        await updateCategorySort({ items })
        toast('排序已更新', 'success')
        await fetchData()
    } catch (e) {
        console.error('移动失败', e)
    }
}

// ====== 缩略图上传 ======

async function handleThumbnailUpload(file) {
    if (!file?.raw) return
    const result = await handleUpload(file.raw, 'category')
    if (result?.url) {
        form.thumbnail = result.url
    }
}

// ====== CRUD ======

function handleRefresh() {
    fetchData()
}

async function toggleExpandAll() {
    isAllExpanded.value = !isAllExpanded.value
    await nextTick()
    const table = tableRef.value
    if (!table) return
    const expanded = isAllExpanded.value
    function toggle(rows) {
        rows.forEach(row => {
            table.toggleRowExpansion(row, expanded)
            if (row.children && row.children.length > 0) {
                toggle(row.children)
            }
        })
    }
    toggle(tableData.value || [])
}

function handleAdd(parentId) {
    isEdit.value = false
    dialogTitle.value = isTopLevel(parentId) ? '新增一级分类' : '新增子分类'
    form.id = null
    form.name = ''
    form.parentId = parentId
    form.sortOrder = 0
    form.thumbnail = ''

    if (isTopLevel(parentId)) {
        form.level = 1
        parentName.value = '无（顶级分类）'
    } else {
        parentName.value = findCategoryName(tableData.value, parentId) || ''
        function findLevel(tree, id) {
            for (const node of tree) {
                if (node.id === id) return getLevel(node)
                if (node.children && node.children.length > 0) {
                    const found = findLevel(node.children, id)
                    if (found) return found
                }
            }
            return 1
        }
        form.level = findLevel(tableData.value, parentId) + 1
    }

    dialogVisible.value = true
}

function handleEdit(row) {
    isEdit.value = true
    dialogTitle.value = '编辑分类'
    form.id = row.id
    form.name = row.name
    form.parentId = row.parentId
    form.level = getLevel(row)
    form.sortOrder = row.sort || 0
    form.thumbnail = row.thumbnail || ''
    dialogVisible.value = true
}

async function handleSubmit() {
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return

    submitLoading.value = true
    try {
        if (isEdit.value) {
            await updateCategory(form.id, {
                name: form.name,
                sortOrder: form.sortOrder,
                thumbnail: form.thumbnail,
            })
            toast('修改成功')
        } else {
            await addCategory({
                name: form.name,
                parentId: String(form.parentId),
                sort: form.sortOrder,
                thumbnail: form.thumbnail,
            })
            toast('新增成功')
        }
        dialogVisible.value = false
        fetchData()
    } catch (e) {
        console.error('操作失败', e)
    } finally {
        submitLoading.value = false
    }
}

function handleDelete(row) {
    const hasChildren = row.children && row.children.length > 0
    const warningText = hasChildren
        ? `分类「${row.name}」下有子分类，无法直接删除，请先删除子分类。`
        : `确定要删除分类「${row.name}」吗？`

    if (hasChildren) {
        toast(warningText, 'warning')
        return
    }

    showModal(warningText, 'warning', '删除确认').then(async () => {
        try {
            await deleteCategory(row.id)
            toast('删除成功')
            fetchData()
        } catch (e) {
            console.error('删除失败', e)
        }
    }).catch(() => {})
}

// ====== 批量删除 ======

async function handleBatchDelete() {
    if (selectedIds.value.length === 0) return

    showModal(
        `确定要删除选中的 ${selectedIds.value.length} 个分类吗？<br>有子分类的将会被跳过。`,
        'warning',
        '批量删除确认'
    ).then(async () => {
        try {
            const res = await batchDeleteCategory({ ids: selectedIds.value })
            const data = res?.data || {}
            const deleted = data.deleted || []
            const skipped = data.skipped || []
            let msg = `成功删除 ${deleted.length} 个分类`
            if (skipped.length > 0) {
                msg += `，${skipped.length} 个分类因含有子分类被跳过`
            }
            toast(msg, skipped.length > 0 ? 'warning' : 'success')
            selectedIds.value = []
            fetchData()
        } catch (e) {
            console.error('批量删除失败', e)
            toast('批量删除失败', 'error')
        }
    }).catch(() => {})
}

// ====== 生命周期 ======

onMounted(() => {
    fetchData()
})

onBeforeUnmount(() => {
    destroySortable()
})
</script>

<style scoped>
.category-page {
    padding: 0;
}

.toolbar {
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.drag-tip {
    font-size: 12px;
    color: #909399;
    margin-left: auto;
}

.mr-2 {
    margin-right: 6px;
}

.form-tip {
    margin-left: 8px;
    font-size: 12px;
    color: #909399;
}

.thumbnail-upload {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
}
</style>
