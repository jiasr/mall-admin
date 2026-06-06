<template>
    <div class="spec-page">
        <!-- 顶部操作栏 -->
        <div class="toolbar">
            <el-button type="primary" @click="handleAdd">
                <el-icon><Plus /></el-icon> 新增规格
            </el-button>
            <el-button @click="fetchData">
                <el-icon><Refresh /></el-icon> 刷新
            </el-button>
        </div>

        <!-- 规格表格 -->
        <el-card class="table-card" shadow="never">
            <el-table :data="tableData" border style="width: 100%" v-loading="loading">
                <el-table-column prop="id" label="ID" width="80" align="center" />
                <el-table-column prop="title" label="规格名称" min-width="200" />
                <el-table-column label="规格值" min-width="400">
                    <template #default="scope">
                        <el-tag
                            v-for="(v, i) in (scope.row.values || [])"
                            :key="i"
                            size="small"
                            style="margin-right: 4px; margin-bottom: 4px"
                        >
                            {{ v.specValue || v }}
                        </el-tag>
                        <span v-if="!scope.row.values || scope.row.values.length === 0" class="empty-tip">暂无规格值</span>
                    </template>
                </el-table-column>
                <el-table-column prop="createTime" label="创建时间" width="170" />
                <el-table-column label="操作" width="200" fixed="right" align="center">
                    <template #default="scope">
                        <el-button type="primary" size="small" link @click="handleEdit(scope.row)">
                            <el-icon><Edit /></el-icon> 编辑
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
                    @size-change="fetchData"
                    @current-change="fetchData"
                />
            </div>
        </el-card>

        <!-- 新增/编辑弹窗 -->
        <el-dialog
            v-model="dialogVisible"
            :title="dialogTitle"
            width="600px"
            :close-on-click-modal="false"
        >
            <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
                <el-form-item label="规格名称" prop="title">
                    <el-input v-model="form.title" placeholder="如：颜色、尺码、内存" maxlength="50" show-word-limit />
                </el-form-item>
                <el-form-item label="规格值">
                    <div class="spec-values">
                        <el-tag
                            v-for="(val, i) in form.values"
                            :key="i"
                            closable
                            size="small"
                            @close="removeValue(i)"
                            style="margin-right: 6px; margin-bottom: 6px"
                        >
                            {{ typeof val === 'string' ? val : val.specValue }}
                        </el-tag>
                        <el-input
                            v-if="valueInputVisible"
                            ref="valueInputRef"
                            v-model="valueInput"
                            size="small"
                            style="width: 120px"
                            @keyup.enter="addValue"
                            @blur="addValue"
                        />
                        <el-button v-else size="small" :icon="Plus" @click="showValueInput">添加规格值</el-button>
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
import { ref, reactive, onMounted, nextTick } from 'vue'
import { Plus, Refresh, Edit, Delete } from '@element-plus/icons-vue'
import { getSpecList, addSpec, updateSpec, deleteSpec } from '~/api/spec'
import { toast, showModal } from '~/composables/util'

const tableData = ref([])
const loading = ref(false)

const pager = reactive({
    pageNum: 1,
    pageSize: 10,
    total: 0,
})

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增规格')
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)

const form = reactive({
    id: null,
    title: '',
    values: [],
})

const rules = {
    title: [{ required: true, message: '请输入规格名称', trigger: 'blur' }],
}

// 规格值输入
const valueInputVisible = ref(false)
const valueInput = ref('')
const valueInputRef = ref(null)

function showValueInput() {
    valueInputVisible.value = true
    nextTick(() => valueInputRef.value?.focus?.())
}

function addValue() {
    const val = valueInput.value?.trim()
    if (!val) { valueInputVisible.value = false; return }
    if (form.values.find(v => (typeof v === 'string' ? v : v.specValue) === val)) {
        valueInputVisible.value = false
        return
    }
    form.values.push(val)
    valueInput.value = ''
    valueInputVisible.value = false
}

function removeValue(i) {
    form.values.splice(i, 1)
}

// 加载数据
async function fetchData() {
    loading.value = true
    try {
        const params = { pageNum: pager.pageNum, pageSize: pager.pageSize }
        const data = await getSpecList(params)
        tableData.value = data.list || []
        pager.total = data.totalCount || 0
    } catch (e) {
        console.error('获取规格列表失败', e)
    } finally {
        loading.value = false
    }
}

// 新增
function handleAdd() {
    isEdit.value = false
    dialogTitle.value = '新增规格'
    form.id = null
    form.title = ''
    form.values = []
    dialogVisible.value = true
}

// 编辑
function handleEdit(row) {
    isEdit.value = true
    dialogTitle.value = '编辑规格'
    form.id = row.id
    form.title = row.title
    form.values = (row.values || []).map(v => (typeof v === 'string' ? v : v.specValue))
    dialogVisible.value = true
}

// 提交
async function handleSubmit() {
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return

    submitLoading.value = true
    try {
        const payload = {
            title: form.title,
            values: form.values.map(v => (typeof v === 'string' ? v : v.specValue)),
        }

        if (isEdit.value) {
            await updateSpec(form.id, payload)
            toast('修改成功')
        } else {
            await addSpec(payload)
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
    showModal(`确定要删除规格「${row.title}」吗？删除后关联商品的规格数据将受影响。`, 'warning', '删除确认')
        .then(async () => {
            try {
                await deleteSpec(row.id)
                toast('删除成功')
                fetchData()
            } catch (e) {
                console.error('删除失败', e)
            }
        })
        .catch(() => {})
}

onMounted(() => {
    fetchData()
})
</script>

<style scoped>
.spec-page {
    padding: 0;
}

.toolbar {
    margin-bottom: 16px;
    display: flex;
    gap: 8px;
}

.table-card {
    border: none;
}

.pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
}

.spec-values {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
}

.empty-tip {
    color: #c0c4cc;
    font-size: 13px;
}
</style>
