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
        >
            <el-table-column prop="name" label="分类名称" min-width="200">
                <template #default="scope">
                    <el-tag :type="levelTagType(scope.row)" size="small" class="mr-2">{{ levelTagText(scope.row) }}</el-tag>
                    <span>{{ scope.row.name }}</span>
                </template>
            </el-table-column>

            <el-table-column prop="level" label="层级" width="80" align="center">
                <template #default="scope">
                    {{ getLevel(scope.row) }}级
                </template>
            </el-table-column>

            <el-table-column label="排序" width="80" align="center">
                <template #default="scope">
                    {{ scope.row.sort ?? scope.row.sortOrder ?? '-' }}
                </template>
            </el-table-column>

            <el-table-column label="创建时间" width="170">
                <template #default="scope">
                    {{ scope.row.createtime || '-' }}
                </template>
            </el-table-column>

            <el-table-column label="操作" width="280" fixed="right" align="center">
                <template #default="scope">
                    <el-button
                        type="primary"
                        size="small"
                        link
                        @click="handleAdd(scope.row.id)"
                    >
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
            width="500px"
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
                <el-form-item label="排序号" prop="sortOrder">
                    <el-input-number v-model="form.sortOrder" :min="0" :max="999" placeholder="数字越小越靠前" />
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
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { Plus, Refresh, Edit, Delete } from '@element-plus/icons-vue'
import { getCategoryTree, addCategory, updateCategory, deleteCategory } from '~/api/category'
import { toast, showModal } from '~/composables/util'

// 表格数据
const tableRef = ref(null)
const tableData = ref([])
const loading = ref(false)
const isAllExpanded = ref(true)

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
})

const rules = {
    name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
}

// 父级名称
const parentName = ref('')

// 获取分类层级（基于注入的 _depth，从 1 开始）
function getLevel(row) {
    return row._depth || 1
}

// 判断是否为顶级分类（parentId 为 0 或 '0'）
function isTopLevel(parentId) {
    return parentId == 0
}

// 数字转中文
const cnNums = ['一', '二', '三', '四', '五', '六', '七', '八', '九']

function toCn(num) {
    if (num <= 9) return cnNums[num - 1]
    return String(num)
}

// 标签类型（循环 5 种）
const tagTypes = ['danger', 'warning', 'success', 'info', '']

function levelTagType(row) {
    const lv = getLevel(row)
    return tagTypes[(lv - 1) % tagTypes.length]
}

function levelTagText(row) {
    return toCn(getLevel(row)) + '级'
}

// 查找分类名
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

const dialogLevelTagType = computed(() => {
    const lv = form.level
    return tagTypes[(lv - 1) % tagTypes.length]
})

// 加载数据
async function fetchData() {
    loading.value = true
    try {
        const data = await getCategoryTree()
        // 根据树深度注入 _depth（1-based），不依赖后端 level 字段
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
    } catch (e) {
        console.error('获取分类树失败', e)
    } finally {
        loading.value = false
    }
}

// 刷新
function handleRefresh() {
    fetchData()
}

// 展开/收起全部
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

// 新增
function handleAdd(parentId) {
    isEdit.value = false
    dialogTitle.value = isTopLevel(parentId) ? '新增一级分类' : '新增子分类'
    form.id = null
    form.name = ''
    form.parentId = parentId
    form.sortOrder = 0

    if (isTopLevel(parentId)) {
        form.level = 1
        parentName.value = '无（顶级分类）'
    } else {
        parentName.value = findCategoryName(tableData.value, parentId) || ''
        // 计算层级
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

// 编辑
function handleEdit(row) {
    isEdit.value = true
    dialogTitle.value = '编辑分类'
    form.id = row.id
    form.name = row.name
    form.parentId = row.parentId
    form.level = getLevel(row)
    form.sortOrder = row.sortOrder || 0
    dialogVisible.value = true
}

// 提交
async function handleSubmit() {
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return

    submitLoading.value = true
    try {
        if (isEdit.value) {
            await updateCategory(form.id, {
                name: form.name,
                sortOrder: form.sortOrder,
            })
            toast('修改成功')
        } else {
            await addCategory({
                name: form.name,
                parentId: String(form.parentId),
                sort: form.sortOrder,
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

// 删除
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

onMounted(() => {
    fetchData()
})
</script>

<style scoped>
.category-page {
    padding: 0;
}

.toolbar {
    margin-bottom: 16px;
    display: flex;
    gap: 8px;
}

.mr-2 {
    margin-right: 6px;
}
</style>
