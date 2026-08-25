<template>
    <div class="printer-page">
        <el-card shadow="never">
            <template #header>
                <span class="section-title"><el-icon><Printer /></el-icon> 小票机配置</span>
            </template>

            <el-tabs v-if="brands.length" v-model="activeTab" @tab-change="handleTabChange">
                <el-tab-pane
                    v-for="b in brands"
                    :key="b.brand"
                    :label="b.name"
                    :name="b.brand"
                >
                    <!-- 未接入品牌占位 -->
                    <el-empty v-if="!b.available" description="该品牌尚未接入，敬请期待" />

                    <template v-else>
                        <!-- 账号配置 -->
                        <el-form v-if="configs[b.brand]" :model="configs[b.brand]" label-width="110px" class="brand-form">
                            <el-form-item v-for="f in b.configFields" :key="f.key" :label="f.label">
                                <el-input
                                    v-model="configs[b.brand][f.key]"
                                    :type="pwdVisible[b.brand]?.[f.key] ? 'text' : f.type"
                                    :autocomplete="f.type === 'password' ? 'new-password' : 'off'"
                                    :placeholder="f.type === 'password' && configs[b.brand][f.key] === MASKED ? '已配置，留空则不修改' : '请输入' + f.label"
                                >
                                    <template v-if="f.type === 'password'" #suffix>
                                        <el-icon class="pwd-eye" @click="togglePwd(b.brand, f.key)">
                                            <View v-if="pwdVisible[b.brand]?.[f.key]" />
                                            <Hide v-else />
                                        </el-icon>
                                    </template>
                                </el-input>
                            </el-form-item>
                            <el-form-item label="启用">
                                <el-switch v-model="enableds[b.brand]" />
                                <span class="form-tip">启用后该品牌打印机可接收打印任务</span>
                            </el-form-item>
                            <el-form-item>
                                <el-button type="primary" :loading="saving" @click="handleSave(b.brand)">
                                    保存配置
                                </el-button>
                            </el-form-item>
                        </el-form>

                        <!-- 打印机列表 -->
                        <div class="device-section">
                            <div class="device-header">
                                <span class="device-title">打印机列表</span>
                                <el-button type="primary" size="small" :icon="Plus" @click="addDevice(b.brand)">
                                    添加打印机
                                </el-button>
                            </div>
                            <el-table :data="devices[b.brand]" border size="small" empty-text="暂无打印机，请先添加">
                                <el-table-column
                                    v-for="f in b.deviceFields"
                                    :key="f.key"
                                    :label="f.label"
                                    :prop="f.key"
                                    min-width="120"
                                >
                                    <template #default="{ row }">
                                        <el-input v-model="row[f.key]" size="small" placeholder="请输入" />
                                    </template>
                                </el-table-column>
                                <el-table-column label="状态" width="90" align="center">
                                    <template #default="{ row }">
                                        <el-switch v-model="row.status" :active-value="1" :inactive-value="0" />
                                    </template>
                                </el-table-column>
                                <el-table-column label="操作" width="80" align="center">
                                    <template #default="{ $index }">
                                        <el-button link type="danger" size="small" @click="removeDevice(b.brand, $index)">
                                            删除
                                        </el-button>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </div>

                        <!-- 测试打印 -->
                        <div class="test-section">
                            <el-divider content-position="left">测试打印</el-divider>
                            <div class="test-row">
                                <el-select v-model="testSns[b.brand]" placeholder="选择打印机" style="width: 220px">
                                    <el-option
                                        v-for="d in devices[b.brand]"
                                        :key="d.sn"
                                        :label="(d.name || d.sn) + ' (' + d.sn + ')'"
                                        :value="d.sn"
                                    />
                                </el-select>
                                <el-button type="warning" :loading="testing" @click="handleTest(b.brand)">
                                    发送测试打印
                                </el-button>
                            </div>
                            <div class="test-tip">保存配置后点击，打印机将输出一张测试小票验证连通性</div>
                        </div>
                    </template>
                </el-tab-pane>
            </el-tabs>
        </el-card>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onActivated } from 'vue'
import { Printer, Plus, View, Hide } from '@element-plus/icons-vue'
import { toast } from '~/composables/util'
import { getPrinterBrands, getPrinterConfig, savePrinterConfig, testPrinter } from '~/api/printer'

const MASKED = '******'

const brands = ref([])
const activeTab = ref('')
const saving = ref(false)
const testing = ref(false)
const configs = reactive({})
const devices = reactive({})
const enableds = reactive({})
const testSns = reactive({})
// 密码字段明文/密文切换状态（按品牌+字段 key 记录）
const pwdVisible = reactive({})

function togglePwd(brand, key) {
    if (!pwdVisible[brand]) pwdVisible[brand] = {}
    pwdVisible[brand][key] = !pwdVisible[brand][key]
}

async function loadConfig(brand) {
    try {
        const data = await getPrinterConfig(brand)
        const result = data && data.data ? data.data : data
        if (!result || result.success === false) {
            toast(result?.message || '读取配置失败', 'error')
            return
        }
        const info = result.data || result
        configs[brand] = { ...(info.config || {}) }
        devices[brand] = (info.devices || []).map(d => ({ ...d }))
        enableds[brand] = !!info.enabled
        if (!testSns[brand] && devices[brand].length) {
            testSns[brand] = devices[brand][0].sn
        }
    } catch {
        toast('读取配置失败', 'error')
    }
}

function handleTabChange(brand) {
    if (brand && configs[brand] === undefined) {
        loadConfig(brand)
    }
}

async function handleSave(brand) {
    saving.value = true
    try {
        const data = await savePrinterConfig(brand, {
            config: configs[brand] || {},
            devices: devices[brand] || [],
            enabled: enableds[brand],
        })
        const result = data && data.data ? data.data : data
        if (result && result.success === false) {
            toast(result.message || '保存失败', 'error')
        } else {
            toast('保存成功', 'success')
            loadConfig(brand)
        }
    } catch {
        toast('保存失败，请稍后重试', 'error')
    } finally {
        saving.value = false
    }
}

function addDevice(brand) {
    if (!devices[brand]) devices[brand] = []
    devices[brand].push({ sn: '', name: '', status: 1 })
}

function removeDevice(brand, index) {
    devices[brand].splice(index, 1)
}

async function handleTest(brand) {
    const sn = testSns[brand]
    if (!sn) {
        toast('请先添加打印机并保存配置', 'warning')
        return
    }
    testing.value = true
    try {
        const data = await testPrinter(brand, sn)
        const result = data && data.data ? data.data : data
        if (result && result.success === false) {
            toast(result.message || '测试打印失败', 'error')
        } else {
            toast(result?.message || '打印指令已发送', 'success')
        }
    } catch {
        toast('测试打印失败，请检查配置', 'error')
    } finally {
        testing.value = false
    }
}

async function loadPage() {
    try {
        const data = await getPrinterBrands()
        const result = data && data.data ? data.data : data
        brands.value = result || []
        // 预初始化各品牌表单对象，避免 el-tabs 立即渲染时 configs[brand] 为 undefined 抛错
        for (const b of brands.value) {
            configs[b.brand] = {}
            devices[b.brand] = []
            enableds[b.brand] = false
        }
        if (brands.value.length) {
            activeTab.value = brands.value[0].brand
            loadConfig(activeTab.value)
        }
    } catch {
        toast('加载品牌列表失败', 'error')
    }
}

// keep-alive 缓存恢复时重新拉取数据（onMounted 只在首次进入时触发）
let isActivated = false
onMounted(loadPage)
onActivated(() => {
    if (isActivated) loadPage()
    isActivated = true
})
</script>

<style scoped>
.printer-page {
    max-width: 900px;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.brand-form {
    max-width: 520px;
}

.form-tip {
    margin-left: 10px;
    font-size: 12px;
    color: #909399;
}

.pwd-eye {
    cursor: pointer;
    color: #909399;
}

.device-section {
    margin-top: 16px;
}

.device-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.device-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
}

.test-section {
    margin-top: 8px;
}

.test-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.test-tip {
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
}
</style>
