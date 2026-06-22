<template>
    <div class="freight-page">
        <el-card shadow="never">
            <template #header>
                <span class="section-title"><el-icon><Tickets /></el-icon> 运费模板管理</span>
            </template>

            <el-alert type="info" :closable="false" show-icon class="mb-5">
                <template #title>
                    运费模板用于计算快递配送的运费。每个模板可设置计费方式、包邮条件和各地区差异化价格。
                    <el-link type="primary" @click="showHelp = true" class="ml-2">查看帮助</el-link>
                </template>
            </el-alert>

            <!-- 操作栏 -->
            <div class="mb-5 flex-between">
                <el-button type="primary" @click="$router.push('/freight/add')">
                    <el-icon><Plus /></el-icon> 新增运费模板
                </el-button>
            </div>

            <!-- 表格 -->
            <el-table :data="list" v-loading="loading" style="width: 100%">
                <el-table-column prop="id" label="ID" width="60" />
                <el-table-column prop="name" label="模板名称" min-width="160" />
                <el-table-column label="计费方式" width="120">
                    <template #default="{ row }">
                        <el-tag :type="row.pricing_type === 0 ? 'success' : 'primary'" size="small">
                            {{ row.pricing_type === 0 ? '固定运费' : '按件收费' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="默认价格" width="120">
                    <template #default="{ row }">
                        <span v-if="row.pricing_type === 0">
                            &yen;{{ (row.fixed_fee / 100).toFixed(2) }}
                        </span>
                        <span v-else>
                            首件&yen;{{ (row.first_fee / 100).toFixed(2) }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column label="包邮门槛" width="120">
                    <template #default="{ row }">
                        <span v-if="row.free_threshold > 0">
                            满&yen;{{ (row.free_threshold / 100).toFixed(2) }}
                        </span>
                        <span v-else class="text-muted">不启用</span>
                    </template>
                </el-table-column>
                <el-table-column label="默认" width="80">
                    <template #default="{ row }">
                        <el-tag v-if="row.is_default" type="danger" size="small">默认</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="create_time" label="创建时间" width="170" />
                <el-table-column label="操作" width="220" fixed="right">
                    <template #default="{ row }">
                        <el-button type="primary" link size="small" @click="$router.push('/freight/add?id=' + row.id)">
                            编辑
                        </el-button>
                        <el-button v-if="!row.is_default" type="warning" link size="small" @click="handleSetDefault(row)">
                            设为默认
                        </el-button>
                        <el-button type="danger" link size="small" @click="handleDelete(row)">
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="flex-center mt-4">
                <el-pagination
                    v-model:current-page="pageNum"
                    v-model:page-size="pageSize"
                    :total="total"
                    :page-sizes="[10, 20, 50]"
                    layout="total, sizes, prev, pager, next, jumper"
                    @current-change="fetchData"
                    @size-change="fetchData"
                />
            </div>
        </el-card>

        <!-- 帮助弹窗 -->
        <el-dialog v-model="showHelp" title="运费模板帮助说明" width="700px">
            <div class="help-content">
                <h4>计费方式</h4>
                <p><b>固定运费：</b>每单收取固定金额，与商品数量无关。适合大件商品。</p>
                <p><b>按件收费：</b>首件X元 + 续件Y元/件，买的越多运费越高。适合小件商品。</p>

                <h4>包邮条件</h4>
                <p>设置满额包邮门槛后，订单金额达到门槛值免运费。</p>

                <h4>地区规则</h4>
                <p>不同省份可单独定价，未设置的省份使用模板默认值。</p>
                <ul>
                    <li><b>包邮：</b>勾选后该省份运费全免</li>
                    <li><b>固定运费/首费/续费：</b>覆盖模板默认值</li>
                    <li><b>包邮门槛：</b>覆盖模板的包邮门槛</li>
                </ul>

                <h4>完整示例</h4>
                <p>模板：首件10元，续件5元/件，满99元包邮</p>
                <p>新疆：首件18元，续件10元（偏远加价）</p>
                <p>西藏：包邮（地区免邮）</p>
                <p>广东：包邮门槛改为50元</p>
                <p class="text-muted mt-2">更多说明详见帮助文档 doc/配送与运费设置帮助说明.md</p>
            </div>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Tickets } from '@element-plus/icons-vue'
import { toast, showModal } from '~/composables/util'
import { getFreightTemplateList, deleteFreightTemplate, setDefaultFreightTemplate } from '~/api/freight'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(20)
const showHelp = ref(false)

async function fetchData() {
    loading.value = true
    try {
        const res = await getFreightTemplateList({ pageNum: pageNum.value, pageSize: pageSize.value })
        const data = res || {}
        list.value = data.list || []
        total.value = data.total || 0
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

function handleSetDefault(row) {
    showModal('确认将"' + row.name + '"设为默认模板？').then(async () => {
        await setDefaultFreightTemplate(row.id)
        toast('已设为默认模板', 'success')
        fetchData()
    }).catch(() => {})
}

function handleDelete(row) {
    showModal('确认删除"' + row.name + '"？').then(async () => {
        await deleteFreightTemplate(row.id)
        toast('已删除', 'success')
        fetchData()
    }).catch(() => {})
}

onMounted(fetchData)
</script>

<style scoped>
.mb-5 { margin-bottom: 20px; }
.mt-4 { margin-top: 16px; }
.mt-2 { margin-top: 8px; }
.ml-2 { margin-left: 8px; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-center { display: flex; justify-content: center; }
.text-muted { color: #999; }
.help-content { line-height: 1.8; font-size: 14px; }
.help-content h4 { margin: 16px 0 8px; color: #409eff; }
.help-content ul { padding-left: 20px; }
</style>
