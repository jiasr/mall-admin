<template>
    <div class="express-account-page">
        <el-card shadow="never">
            <template #header>
                <span class="section-title"><el-icon><Van /></el-icon> 快递账号管理</span>
            </template>

            <el-alert type="info" :closable="false" show-icon class="mb-5">
                <template #title>
                    此处管理发货渠道账号，支持两种渠道：
                    <b>微信物流助手</b>（圆通/申通/中通等，绑定后生成电子面单）与
                    <b>中通开放平台</b>（直连中通生成电子面单，需填写开放平台 appKey / appSecret / 电子面单账号）。
                    <el-link type="primary" @click="showHelp = true" class="ml-2">查看帮助</el-link>
                </template>
            </el-alert>

            <!-- 操作栏 -->
            <div class="mb-5 flex-between">
                <div>
                    <el-button type="primary" @click="openBindDialog()">
                        <el-icon><Plus /></el-icon> 添加快递账号
                    </el-button>
                    <el-button @click="handleSync">
                        <el-icon><Refresh /></el-icon> 从微信同步
                    </el-button>
                </div>
                <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width: 140px"
                    @change="fetchData">
                    <el-option label="全部" :value="''" />
                    <el-option label="启用" :value="1" />
                    <el-option label="禁用" :value="0" />
                </el-select>
            </div>

            <!-- 表格 -->
            <el-table :data="list" v-loading="loading" style="width: 100%">
                <el-table-column label="渠道" width="130">
                    <template #default="{ row }">
                        <el-tag :type="row.provider === 'zto' ? 'warning' : 'success'">
                            {{ row.provider === 'zto' ? '中通开放平台' : '微信物流助手' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="delivery_id" label="快递公司ID" width="120" />
                <el-table-column prop="biz_id" label="客户编码" min-width="150" />
                <el-table-column prop="partner_code" label="电子面单账号" min-width="150">
                    <template #default="{ row }">
                        <span v-if="row.provider === 'zto'">{{ row.partner_code || '-' }}</span>
                        <span v-else>-</span>
                    </template>
                </el-table-column>
                <el-table-column prop="account_name" label="账号别名" min-width="150" />
                <el-table-column label="状态" width="100">
                    <template #default="{ row }">
                        <el-switch
                            :model-value="row.status === 1"
                            @change="(v) => handleToggleStatus(row, v)"
                        />
                    </template>
                </el-table-column>
                <el-table-column prop="create_time" label="创建时间" width="170" />
                <el-table-column label="操作" width="160" fixed="right">
                    <template #default="{ row }">
                        <el-button type="primary" link size="small" @click="openBindDialog(row)">
                            编辑
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

        <!-- 添加 / 编辑弹窗 -->
        <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑快递账号' : '添加快递账号'" width="560px">
            <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" autocomplete="off">
                <el-form-item label="渠道" prop="provider">
                    <el-radio-group v-model="form.provider">
                        <el-radio label="wechat">微信物流助手</el-radio>
                        <el-radio label="zto">中通开放平台</el-radio>
                    </el-radio-group>
                </el-form-item>

                <!-- 微信渠道字段 -->
                <template v-if="form.provider === 'wechat'">
                    <el-form-item label="快递公司" prop="deliveryId">
                        <el-select
                            v-model="form.deliveryId"
                            filterable
                            allow-create
                            default-first-option
                            placeholder="选择或输入快递公司ID（如 YTO）"
                            style="width: 100%"
                        >
                            <el-option
                                v-for="c in deliveryCompanies"
                                :key="c.id"
                                :label="`${c.id} - ${c.name}`"
                                :value="c.id"
                            />
                        </el-select>
                        <span class="form-tip">微信物流助手中的快递公司编码，如 YTO（圆通）、STO（申通）、ZTO（中通）。可手动输入。</span>
                    </el-form-item>
                    <el-form-item label="账号类型" prop="accountType">
                        <el-select v-model="form.accountType" style="width: 100%">
                            <el-option :value="1" label="月结账号（顺丰/EMS 等，biz_id 为月结卡号）" />
                            <el-option :value="2" label="网点账号（圆通/中通/韵达/极兔等，biz_id 为网点编码）" />
                            <el-option :value="3" label="手机号（按寄件人手机号下单）" />
                        </el-select>
                        <span class="form-tip">不同快递公司支持的账号类型不同，选错会导致微信返回 40097。以快递公司要求为准。</span>
                    </el-form-item>
                    <el-form-item label="客户编码" prop="bizId">
                        <el-input v-model="form.bizId" placeholder="快递公司分配的客户编码 biz_id" />
                    </el-form-item>
                </template>

                <!-- 中通渠道字段 -->
                <template v-else>
                    <el-form-item label="appKey" prop="appKey">
                        <el-input v-model="form.appKey" placeholder="中通开放平台 appKey" />
                    </el-form-item>
                    <el-form-item label="appSecret" prop="appSecret">
                        <el-input
                            v-model="form.appSecret"
                            type="password"
                            show-password
                            autocomplete="new-password"
                            :placeholder="isEdit ? '留空则不修改' : '中通开放平台 appSecret'"
                        />
                    </el-form-item>
                    <el-form-item label="电子面单账号" prop="partnerCode">
                        <el-input v-model="form.partnerCode" placeholder="如 D36_360320735712101" />
                        <span class="form-tip">开放平台「商家授权网点授权」里的电子面单账号（partnerCode）。授权模式下无需 partnerKey 密码。</span>
                    </el-form-item>
                    <el-form-item label="环境" prop="env">
                        <el-radio-group v-model="form.env">
                            <el-radio label="sandbox">沙箱</el-radio>
                            <el-radio label="prod">生产</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item label="客户编码" prop="customerId">
                        <el-input v-model="form.customerId" placeholder="中通客户编码（对应 accountInfo.customerId）" />
                        <span class="form-tip">开放平台「商家授权网点授权」里的客户编码（customerId），中通必填。</span>
                    </el-form-item>
                    <el-form-item label="电子面单密码" prop="partnerKey">
                        <el-input
                            v-model="form.partnerKey"
                            type="password"
                            show-password
                            autocomplete="new-password"
                            :placeholder="isEdit ? '留空则不修改' : '电子面单密码（授权模式可留空）'"
                        />
                        <span class="form-tip">accountInfo.accountPassword。授权模式下通常无需填写。</span>
                    </el-form-item>
                    <el-form-item label="面单类型" prop="partnerType">
                        <el-input v-model="form.partnerType" placeholder="partnerType，默认 1" />
                        <span class="form-tip">中通电子面单类型 partnerType（accountInfo 同级），常见值 1。若下单报 S202 可尝试 2 或其他。</span>
                    </el-form-item>
                </template>

                <el-form-item label="账号别名" prop="accountName">
                    <el-input v-model="form.accountName" autocomplete="off" placeholder="便于识别的名称，如：中通-主账号" />
                </el-form-item>
                <el-form-item v-if="form.provider === 'wechat'" label="密码" prop="password">
                    <el-input
                        v-model="form.password"
                        type="password"
                        show-password
                        autocomplete="new-password"
                        :placeholder="isEdit ? '留空则不修改密码' : '快递账号密码'"
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="saving" @click="handleSubmit">保存</el-button>
            </template>
        </el-dialog>

        <!-- 帮助弹窗 -->
        <el-dialog v-model="showHelp" title="快递账号管理帮助" width="640px">
            <div class="help-content">
                <h4>两种发货渠道</h4>
                <p><b>微信物流助手</b>：需先在微信侧绑定快递公司账号，本系统从微信同步后可一键生成电子面单。</p>
                <p><b>中通开放平台</b>：直连中通开放平台下单。在开放平台「应用信息」获取 appKey/appSecret（沙箱/生产各一对），在「商家授权网点授权」获取电子面单账号 partnerCode，填入本页即可。下单走中通官方网关，返回运单号。</p>
                <h4>如何获取中通凭证？</h4>
                <p>登录开放平台 → 应用 → 应用详情：appKey/appSecret 在「应用信息」；电子面单账号（partnerCode）在「商家授权网点授权」列表。沙箱联调用沙箱 appKey/appSecret + 环境选"沙箱"。</p>
                <p class="text-muted mt-2">更多说明详见《中通开放平台接入文档》。</p>
            </div>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Van, Refresh } from '@element-plus/icons-vue'
import { toast, showModal } from '~/composables/util'
import {
    getExpressAccountList,
    bindExpressAccount,
    updateExpressAccount,
    syncExpressAccount,
    deleteExpressAccount,
} from '~/api/express'

// 微信物流常见快递公司（仅供下拉参考，允许手动输入其他）
const deliveryCompanies = [
    { id: 'YTO', name: '圆通速递' },
    { id: 'STO', name: '申通快递' },
    { id: 'ZTO', name: '中通快递' },
    { id: 'YD', name: '韵达速递' },
    { id: 'SF', name: '顺丰速运' },
    { id: 'EMS', name: '中国邮政EMS' },
    { id: 'HTKY', name: '百世快递' },
    { id: 'JD', name: '京东物流' },
    { id: 'DBL', name: '德邦快递' },
    { id: 'JTSD', name: '极兔速递' },
    { id: 'ZJS', name: '宅急送' },
    { id: 'POSTB', name: '邮政标准' },
]

const loading = ref(false)
const list = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(20)
const statusFilter = ref('')
const showHelp = ref(false)

const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const saving = ref(false)
const formRef = ref(null)

const form = reactive({
    deliveryId: '',
    bizId: '',
    accountName: '',
    password: '',
    accountType: 1,
    // 中通渠道字段
    provider: 'wechat',
    appKey: '',
    appSecret: '',
    partnerCode: '',
    customerId: '',
    partnerKey: '',
    partnerType: '1',
    env: 'sandbox',
})

// 中通渠道不需要原微信字段必填，整体改为手动校验
const rules = {}

async function fetchData() {
    loading.value = true
    try {
        const res = await getExpressAccountList({
            pageNum: pageNum.value,
            pageSize: pageSize.value,
            status: (statusFilter.value == null || statusFilter.value === '') ? '' : statusFilter.value,
        })
        const data = res || {}
        list.value = data.list || []
        total.value = data.total || 0
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

function openBindDialog(row) {
    if (row) {
        isEdit.value = true
        editId.value = row.id
        Object.assign(form, {
            deliveryId: row.delivery_id || '',
            bizId: row.biz_id || '',
            accountName: row.account_name || '',
            password: '',
            accountType: row.account_type || 1,
            provider: row.provider || 'wechat',
            appKey: row.app_key || '',
            appSecret: '',
            partnerCode: row.partner_code || '',
            customerId: row.customer_id || '',
            partnerKey: '',
            partnerType: row.partner_type || '1',
            env: row.env || 'sandbox',
        })
    } else {
        isEdit.value = false
        editId.value = null
        Object.assign(form, {
            deliveryId: '', bizId: '', accountName: '', password: '', accountType: 1,
            provider: 'wechat', appKey: '', appSecret: '', partnerCode: '', customerId: '', partnerKey: '', partnerType: '1', env: 'sandbox',
        })
    }
    dialogVisible.value = true
}

async function handleSubmit() {
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return
    // 渠道必填校验
    if (form.provider === 'wechat') {
        if (!form.deliveryId || !form.bizId) {
            toast('请填写快递公司ID和客户编码', 'error')
            return
        }
    } else {
        if (!form.appKey || !form.partnerCode) {
            toast('中通渠道请填写 appKey 与电子面单账号', 'error')
            return
        }
    }
    saving.value = true
    try {
        const payload = {
            provider: form.provider,
            accountName: form.accountName,
            deliveryId: form.deliveryId,
            bizId: form.bizId,
            password: form.password,
            accountType: form.accountType,
            appKey: form.appKey,
            appSecret: form.appSecret,
            partnerCode: form.partnerCode,
            customerId: form.customerId,
            partnerKey: form.partnerKey,
            partnerType: form.partnerType,
            env: form.env,
        }
        if (isEdit.value) {
            payload.id = editId.value
            await updateExpressAccount(payload)
            toast('已更新账号', 'success')
        } else {
            await bindExpressAccount(payload)
            toast('添加成功', 'success')
        }
        dialogVisible.value = false
        fetchData()
    } catch (e) {
        console.error(e)
    } finally {
        saving.value = false
    }
}

async function handleToggleStatus(row, val) {
    try {
        await updateExpressAccount({ id: row.id, status: val ? 1 : 0 })
        row.status = val ? 1 : 0
        toast(val ? '已启用' : '已禁用', 'success')
    } catch (e) {
        console.error(e)
        row.status = val ? 0 : 1
    }
}

function handleDelete(row) {
    showModal('确认删除该快递账号？删除后该账号将不可用于发货。').then(async () => {
        await deleteExpressAccount(row.id)
        toast('已删除', 'success')
        fetchData()
    }).catch(() => {})
}

async function handleSync() {
    try {
        const res = await syncExpressAccount()
        const data = res || {}
        toast(`同步完成：微信返回 ${data.synced || 0} 条，新增 ${data.added || 0} 条，共 ${data.total || 0} 条`, 'success')
        fetchData()
    } catch (e) {
        console.error(e)
    }
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
.form-tip { display: block; font-size: 12px; color: #999; margin-top: 4px; }
.help-content { line-height: 1.8; font-size: 14px; }
.help-content h4 { margin: 16px 0 8px; color: #409eff; }
</style>
