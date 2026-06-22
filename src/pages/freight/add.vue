<template>
    <div class="freight-edit-page">
        <el-card shadow="never">
            <template #header>
                <span class="section-title">
                    <el-icon><Tickets /></el-icon>
                    {{ isEdit ? '编辑运费模板' : '新增运费模板' }}
                </span>
            </template>

            <el-form ref="formRef" :model="form" :rules="rules" label-width="140px" class="freight-form" style="max-width: 700px">

                <el-divider content-position="left">基本信息</el-divider>

                <el-form-item label="模板名称" prop="name">
                    <el-input v-model="form.name" placeholder="例：江浙沪8元、标准运费" maxlength="50" />
                </el-form-item>

                <el-form-item label="计费方式" prop="pricing_type">
                    <el-radio-group v-model="form.pricing_type">
                        <el-radio :value="0">固定运费</el-radio>
                        <el-radio :value="1">按件收费</el-radio>
                    </el-radio-group>
                    <span class="form-tip">
                        {{ form.pricing_type === 0 ? '每单统一收取固定金额，不随件数变化' : '首件X元 + 续件Y元/件，买越多运费越高' }}
                    </span>
                </el-form-item>

                <!-- 固定运费 -->
                <template v-if="form.pricing_type === 0">
                    <el-form-item label="固定运费" prop="fixed_fee">
                        <el-input-number v-model="form.fixed_fee" :min="0" :step="100" :precision="0" />
                        <span class="form-tip">单位：分（如 800 = 8元）</span>
                    </el-form-item>
                </template>

                <!-- 按件收费 -->
                <template v-if="form.pricing_type === 1">
                    <el-form-item label="首件数量" prop="first_unit">
                        <el-input-number v-model="form.first_unit" :min="1" :step="1" />
                    </el-form-item>
                    <el-form-item label="首件费用" prop="first_fee">
                        <el-input-number v-model="form.first_fee" :min="0" :step="100" :precision="0" />
                        <span class="form-tip">单位：分（如 1000 = 10元）</span>
                    </el-form-item>
                    <el-form-item label="续件数量" prop="continue_unit">
                        <el-input-number v-model="form.continue_unit" :min="1" :step="1" />
                    </el-form-item>
                    <el-form-item label="续件费用" prop="continue_fee">
                        <el-input-number v-model="form.continue_fee" :min="0" :step="100" :precision="0" />
                        <span class="form-tip">单位：分（如 500 = 5元）</span>
                    </el-form-item>
                </template>

                <el-divider content-position="left">包邮设置</el-divider>

                <el-form-item label="满额包邮">
                    <el-input-number v-model="form.free_threshold" :min="0" :step="1000" :precision="0" />
                    <span class="form-tip">订单满该金额（分）免运费，0=不启用包邮</span>
                </el-form-item>

                <el-form-item label="设为默认">
                    <el-switch v-model="form.is_default" />
                    <span class="form-tip">启用后新商品默认使用此模板</span>
                </el-form-item>

                <el-divider content-position="left">地区规则（可选）
                    <span class="text-muted" style="font-size:12px;font-weight:normal">
                        不同省份可单独定价，未设置的省份使用上方默认值
                    </span>
                </el-divider>

                <!-- 地区规则 -->
                <div class="region-section">
                    <div class="region-toolbar">
                        <el-button type="primary" size="small" @click="openRegionDialog">添加地区规则</el-button>
                        <el-button size="small" @click="clearAllRegions">清空所有</el-button>
                    </div>

                    <el-table :data="regions" size="small" border style="width:100%;margin-top:10px" max-height="400">
                        <el-table-column prop="regionName" label="省份" width="120" />
                        <el-table-column label="包邮" width="70">
                            <template #default="{ $index }">
                                <el-checkbox v-model="regions[$index].isFree" @change="regions[$index].isFree = $event ? 1 : 0" />
                            </template>
                        </el-table-column>
                        <el-table-column label="固定运费(分)" v-if="form.pricing_type === 0">
                            <template #default="{ $index }">
                                <el-input-number v-model="regions[$index].fixedFee" :min="0" :step="100" size="small" :precision="0" />
                            </template>
                        </el-table-column>
                        <el-table-column label="首费(分)" v-if="form.pricing_type === 1">
                            <template #default="{ $index }">
                                <el-input-number v-model="regions[$index].firstFee" :min="0" :step="100" size="small" :precision="0" />
                            </template>
                        </el-table-column>
                        <el-table-column label="续费(分)" v-if="form.pricing_type === 1">
                            <template #default="{ $index }">
                                <el-input-number v-model="regions[$index].continueFee" :min="0" :step="100" size="small" :precision="0" />
                            </template>
                        </el-table-column>
                        <el-table-column label="包邮门槛(分)">
                            <template #default="{ $index }">
                                <el-input-number v-model="regions[$index].freeThreshold" :min="0" :step="1000" size="small" :precision="0" />
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="70">
                            <template #default="{ $index }">
                                <el-button type="danger" link size="small" @click="regions.splice($index, 1)">删除</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </el-form>
        </el-card>

        <!-- 底部固定操作栏 -->
        <div class="bottom-bar">
            <el-button @click="$router.back()">取消</el-button>
            <el-button type="primary" :loading="saving" @click="handleSubmit">
                {{ isEdit ? '保存修改' : '创建模板' }}
            </el-button>
        </div>

        <!-- 选择省份弹窗 -->
        <el-dialog v-model="regionDialogVisible" title="选择省份" width="600px">
            <el-checkbox :indeterminate="isIndeterminate" v-model="checkAll" @change="handleCheckAll">
                全选
            </el-checkbox>
            <div style="border-top:1px solid #eee;padding-top:12px;margin-top:8px">
                <el-checkbox-group v-model="selectedProvinces">
                    <el-checkbox v-for="p in provinceList" :key="p.code" :value="p.code" :label="p.name" class="province-item" />
                </el-checkbox-group>
            </div>
            <template #footer>
                <el-button @click="regionDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="confirmAddRegions">添加</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Tickets } from '@element-plus/icons-vue'
import { toast } from '~/composables/util'
import { addFreightTemplate, updateFreightTemplate, getFreightTemplateDetail, getRegionList, saveRegionList } from '~/api/freight'

const router = useRouter()
const route = useRoute()

const isEdit = ref(false)
const editId = ref(null)
const saving = ref(false)
const formRef = ref(null)

// 表单数据（金额单位：分）
const form = reactive({
    name: '',
    pricing_type: 1,
    fixed_fee: 800,
    first_unit: 1,
    first_fee: 1000,
    continue_unit: 1,
    continue_fee: 500,
    free_threshold: 0,
    is_default: false,
})

const rules = {
    name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
    pricing_type: [{ required: true, message: '请选择计费方式' }],
}

// 地区规则
const regions = ref([])

// 省份选择弹窗
const regionDialogVisible = ref(false)
const checkAll = ref(false)
const isIndeterminate = ref(false)
const selectedProvinces = ref([])

const provinceList = [
    { code: '110000', name: '北京市' }, { code: '120000', name: '天津市' },
    { code: '130000', name: '河北省' }, { code: '140000', name: '山西省' },
    { code: '150000', name: '内蒙古' }, { code: '210000', name: '辽宁省' },
    { code: '220000', name: '吉林省' }, { code: '230000', name: '黑龙江省' },
    { code: '310000', name: '上海市' }, { code: '320000', name: '江苏省' },
    { code: '330000', name: '浙江省' }, { code: '340000', name: '安徽省' },
    { code: '350000', name: '福建省' }, { code: '360000', name: '江西省' },
    { code: '370000', name: '山东省' }, { code: '410000', name: '河南省' },
    { code: '420000', name: '湖北省' }, { code: '430000', name: '湖南省' },
    { code: '440000', name: '广东省' }, { code: '450000', name: '广西' },
    { code: '460000', name: '海南省' }, { code: '500000', name: '重庆市' },
    { code: '510000', name: '四川省' }, { code: '520000', name: '贵州省' },
    { code: '530000', name: '云南省' }, { code: '540000', name: '西藏' },
    { code: '610000', name: '陕西省' }, { code: '620000', name: '甘肃省' },
    { code: '630000', name: '青海省' }, { code: '640000', name: '宁夏' },
    { code: '650000', name: '新疆' }, { code: '710000', name: '台湾省' },
    { code: '810000', name: '香港' }, { code: '820000', name: '澳门' },
]

function openRegionDialog() {
    selectedProvinces.value = []
    checkAll.value = false
    isIndeterminate.value = false
    regionDialogVisible.value = true
}

function handleCheckAll(val) {
    selectedProvinces.value = val ? provinceList.map(p => p.code) : []
    isIndeterminate.value = false
}

function confirmAddRegions() {
    if (selectedProvinces.value.length === 0) {
        toast('请至少选择一个省份', 'warning')
        return
    }
    const existingCodes = new Set(regions.value.map(r => r.regionCode))
    for (const code of selectedProvinces.value) {
        if (!existingCodes.has(code)) {
            const p = provinceList.find(x => x.code === code)
            regions.value.push({
                regionCode: code,
                regionName: p ? p.name : code,
                isFree: 0,
                fixedFee: null,
                firstFee: null,
                continueFee: null,
                freeThreshold: null,
            })
        }
    }
    regionDialogVisible.value = false
}

function clearAllRegions() {
    regions.value = []
}

// 提交
async function handleSubmit() {
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return

    saving.value = true
    try {
        const payload = {
            ...form,
            is_default: form.is_default ? 1 : 0,
        }

        let templateId
        if (isEdit.value) {
            await updateFreightTemplate(editId.value, payload)
            templateId = editId.value
        } else {
            const res = await addFreightTemplate(payload)
            templateId = res && res.id
        }

        // 保存地区规则
        if (templateId && regions.value.length > 0) {
            await saveRegionList({ templateId, regions: regions.value })
        }

        toast(isEdit.value ? '模板已更新' : '模板已创建', 'success')
        router.push('/freight/list')
    } catch (e) {
        console.error(e)
    } finally {
        saving.value = false
    }
}

// 编辑模式加载
onMounted(async () => {
    const id = route.query.id
    if (id) {
        isEdit.value = true
        editId.value = Number(id)
        try {
            const data = await getFreightTemplateDetail(editId.value) || {}
            Object.assign(form, {
                name: data.name || '',
                pricing_type: data.pricing_type ?? 1,
                fixed_fee: data.fixed_fee ?? 800,
                first_unit: data.first_unit ?? 1,
                first_fee: data.first_fee ?? 1000,
                continue_unit: data.continue_unit ?? 1,
                continue_fee: data.continue_fee ?? 500,
                free_threshold: data.free_threshold ?? 0,
                is_default: data.is_default === 1,
            })
            if (data.regions) {
                regions.value = data.regions.map(r => ({
                    regionCode: r.region_code || r.regionCode,
                    regionName: r.region_name || r.regionName,
                    isFree: r.is_free || r.isFree || 0,
                    fixedFee: r.fixed_fee ?? r.fixedFee ?? null,
                    firstFee: r.first_fee ?? r.firstFee ?? null,
                    continueFee: r.continue_fee ?? r.continueFee ?? null,
                    freeThreshold: r.free_threshold ?? r.freeThreshold ?? null,
                }))
            }
        } catch (e) {
            console.error(e)
        }
    }
})
</script>

<style scoped>
.freight-form { margin-bottom: 80px; }
.form-tip { display: block; font-size: 12px; color: #999; margin-top: 4px; }
.text-muted { color: #999; }
.bottom-bar {
    position: fixed; bottom: 0; left: 240px; right: 0;
    padding: 12px 24px; background: #fff;
    border-top: 1px solid #e4e7ed;
    display: flex; justify-content: flex-end; gap: 12px;
    z-index: 10;
}
.region-section { margin-bottom: 20px; }
.region-toolbar { display: flex; gap: 8px; align-items: center; }
.province-item {
    width: 100px; margin-right: 8px;
    margin-bottom: 8px;
}
</style>
