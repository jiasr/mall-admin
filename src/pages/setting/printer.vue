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
                        <!-- 启用开关（最上边） -->
                        <div class="enable-row">
                            <el-switch v-model="enableds[b.brand]" />
                            <span class="form-tip">启用后该品牌打印机可接收打印任务</span>
                        </div>

                        <!-- 账号配置 -->
                        <el-form v-if="configs[b.brand]" :model="configs[b.brand]" label-width="110px" class="brand-form">
                            <el-form-item v-for="f in b.configFields" :key="f.key" :label="f.label">
                                <el-input
                                    v-model="configs[b.brand][f.key]"
                                    :type="f.type"
                                    :autocomplete="f.type === 'password' ? 'new-password' : 'off'"
                                    :placeholder="'请输入' + f.label"
                                />
                            </el-form-item>
                            <el-form-item>
                                <el-button type="primary" :loading="saving" @click="handleSave(b.brand)">
                                    保存配置
                                </el-button>
                            </el-form-item>
                        </el-form>

                        <!-- 打印策略 -->
                        <div class="strategy-section">
                            <el-divider content-position="left">打印策略</el-divider>
                            <el-form label-width="110px" class="brand-form">
                                <el-form-item label="打印策略">
                                    <el-radio-group v-model="configs[b.brand].printStrategy">
                                        <el-radio label="default">默认设备</el-radio>
                                        <el-radio label="round_robin">轮询</el-radio>
                                    </el-radio-group>
                                    <span class="form-tip">轮询：多台设备轮流打印，均衡出票量</span>
                                </el-form-item>
                                <el-form-item v-if="configs[b.brand].printStrategy === 'default'" label="默认设备">
                                    <el-select v-model="configs[b.brand].defaultSn" placeholder="选择默认打印设备" style="width: 260px">
                                        <el-option
                                            v-for="d in devices[b.brand]"
                                            :key="d.sn"
                                            :label="(d.name || d.sn) + ' (' + d.sn + ')'"
                                            :value="d.sn"
                                        />
                                    </el-select>
                                    <span class="form-tip">未选择时使用列表第一台启用设备</span>
                                </el-form-item>
                            </el-form>
                        </div>

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

                        <!-- 飞鹅回调配置（打印/扫码两个 Tab） -->
                        <div v-if="configs[b.brand]" class="callback-section">
                            <el-divider content-position="left">飞鹅回调配置</el-divider>
                            <el-tabs v-model="callbackTab[b.brand]">
                                <el-tab-pane label="打印结果回调" name="print">
                                    <el-form label-width="110px" class="brand-form">
                                        <el-form-item label="回调地址">
                                            <el-input
                                                v-model="configs[b.brand].backurl"
                                                placeholder="https://您的域名/v1/printer/callback/feie"
                                            />
                                            <div class="callback-tip">
                                                <p>完整地址：<code>https://您的域名/v1/printer/callback/feie</code>——选中复制后，只需把「您的域名」换成自己的域名，填入飞鹅平台与本页即可。</p>
                                            </div>
                                        </el-form-item>
                                        <el-form-item label="验证Token">
                                            <el-input
                                                v-model="configs[b.brand].verifyToken"
                                                placeholder="飞鹅下载的验证文件名随机串，如 f3EQ6NkGls1Y5RXF"
                                            />
                                        </el-form-item>
                                        <el-form-item v-if="verifyUrl(b.brand, 'print')" label="验证地址">
                                            <div class="callback-tip">
                                                <p>将该地址填入飞鹅平台完成域名验证（系统自动返回验证内容，无需上传文件）：</p>
                                                <p><code>{{ verifyUrl(b.brand, 'print') }}</code></p>
                                            </div>
                                        </el-form-item>
                                        <el-form-item label="回调说明">
                                            <div class="callback-tip">
                                                <p>飞鹅回调需要「平台登记」和「本页携带」两步配合，缺一不可：</p>
                                                <p><b>1. 平台登记</b>：登录飞鹅云平台，在「打印结果回调」处填写本地址（域名须 ICP 备案，不支持 IP/端口/短链），并按提示填写上面的验证 Token 完成域名验证。不登记的话，平台不会向该地址推送任何结果。</p>
                                                <p><b>2. 本页携带（关键）</b>：飞鹅要求每次打印任务必须携带回调地址参数（backurl）才会推送结果——仅平台登记、这里不填，打印请求不会携带该参数，打印状态将一直停在「已提交」。本页保存后，每次打印（自动/手动/测试）都会自动携带。</p>
                                                <p><b>3. 两处填同一个地址</b>；不填则不接收回调，无法确认打印机是否真正出票。</p>
                                            </div>
                                        </el-form-item>
                                    </el-form>
                                </el-tab-pane>
                                <el-tab-pane label="扫码回调" name="scan">
                                    <el-form label-width="110px" class="brand-form">
                                        <el-form-item label="回调地址">
                                            <el-input
                                                v-model="configs[b.brand].scanBackurl"
                                                placeholder="https://您的域名/v1/printer/callback/feie/scan"
                                            />
                                            <div class="callback-tip">
                                                <p>完整地址：<code>https://您的域名/v1/printer/callback/feie/scan</code>——选中复制后，只需把「您的域名」换成自己的域名，填入飞鹅平台即可。</p>
                                            </div>
                                        </el-form-item>
                                        <el-form-item label="验证Token">
                                            <el-input
                                                v-model="configs[b.brand].scanVerifyToken"
                                                placeholder="飞鹅下载的验证文件名随机串（与打印回调的 Token 不同）"
                                            />
                                        </el-form-item>
                                        <el-form-item v-if="verifyUrl(b.brand, 'scan')" label="验证地址">
                                            <div class="callback-tip">
                                                <p>将该地址填入飞鹅平台完成域名验证（系统自动返回验证内容，无需上传文件）：</p>
                                                <p><code>{{ verifyUrl(b.brand, 'scan') }}</code></p>
                                            </div>
                                        </el-form-item>
                                        <el-form-item label="回调说明">
                                            <div class="callback-tip">
                                                <p>扫码一体机/带扫码枪的打印机扫码后，飞鹅主动推送扫码数据到本地址：</p>
                                                <p><b>1. 平台登记</b>：登录飞鹅云平台，在「扫码回调」处填写本地址（域名须 ICP 备案），并按提示填写上面的验证 Token 完成域名验证。</p>
                                                <p><b>2. 扫码回调由飞鹅主动推送，无需携带额外参数</b>；不填则不接收扫码数据。</p>
                                            </div>
                                        </el-form-item>
                                    </el-form>
                                </el-tab-pane>
                            </el-tabs>
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
import { Printer, Plus } from '@element-plus/icons-vue'
import { toast } from '~/composables/util'
import { getPrinterBrands, getPrinterConfig, savePrinterConfig, testPrinter } from '~/api/printer'

const brands = ref([])
const activeTab = ref('')
const saving = ref(false)
const testing = ref(false)
const configs = reactive({})
const devices = reactive({})
const enableds = reactive({})
const testSns = reactive({})
const callbackTab = reactive({})

async function loadConfig(brand) {
    try {
        const data = await getPrinterConfig(brand)
        const result = data && data.data ? data.data : data
        if (!result || result.success === false) {
            toast(result?.message || '读取配置失败', 'error')
            return
        }
        const info = result.data || result
        configs[brand] = { printStrategy: 'default', backurl: '', verifyToken: '', scanBackurl: '', scanVerifyToken: '', ...(info.config || {}) }
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

// 由回调地址 + 验证Token 推导飞鹅域名验证文件地址（type: print=打印回调 scan=扫码回调）
function verifyUrl(brand, type = 'print') {
    const cfg = configs[brand] || {}
    const backurl = type === 'scan' ? cfg.scanBackurl : cfg.backurl
    const token = type === 'scan' ? cfg.scanVerifyToken : cfg.verifyToken
    if (!backurl || !token) return ''
    return backurl.replace(/\/[^/]*$/, '/feieyun_verify_' + token + '.txt')
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
            callbackTab[b.brand] = 'print'
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
    width: 100%;
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

.enable-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
}

.callback-section {
    margin-top: 8px;
}

.form-tip {
    margin-left: 10px;
    font-size: 12px;
    color: #909399;
}

.strategy-section {
    margin-top: 8px;
}

.callback-tip {
    font-size: 12px;
    line-height: 1.9;
    color: #909399;
}

.callback-tip code {
    padding: 1px 4px;
    border-radius: 3px;
    background: #f4f4f5;
    color: #409eff;
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
