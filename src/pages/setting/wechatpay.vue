<template>
    <div class="wechatpay-setting-page">
        <el-card shadow="never">
            <template #header>
                <span class="section-title"><el-icon><Money /></el-icon> 微信支付配置</span>
            </template>

            <el-alert type="info" :closable="false" show-icon class="mb-5">
                <template #title>
                    配置微信支付商户信息后，小程序用户可调起微信支付完成订单支付。
                </template>
            </el-alert>

            <el-form :model="form" label-width="150px" class="pay-form" style="max-width: 650px">
                <el-divider content-position="left"><b>通用配置</b></el-divider>

                <el-form-item label="小程序 AppID">
                    <el-input v-model="form.app_id" placeholder="微信公众平台 → 开发 → 基本配置" />
                </el-form-item>
                <el-form-item label="商户号 (MchID)">
                    <el-input v-model="form.mch_id" placeholder="微信商户平台 → 账户中心" autocomplete="off" />
                </el-form-item>
                <el-form-item label="支付回调 URL">
                    <el-input v-model="form.notify_url" placeholder="https://域名/v1/order/pay/notify" />
                    <span class="form-tip">需公网可访问，用于接收微信支付结果通知</span>
                </el-form-item>

                <el-divider content-position="left"><b>发（商户 → 微信）</b></el-divider>

                <el-form-item label="APIv3 私钥(PEM)">
                    <el-input v-model="form.wechat_private_key" type="textarea" :rows="4" placeholder="对应文件下载包中的 apiclient_key.pem&#10;用记事本打开后全选复制粘贴即可" />
                    <span class="form-tip">商户签名用，请求微信时证明身份</span>
                </el-form-item>
                <el-form-item label="商户证书(PEM)">
                    <el-input v-model="form.wechat_certificate" type="textarea" :rows="4" placeholder="对应文件下载包中的 apiclient_cert.pem&#10;用记事本打开后全选复制粘贴即可" />
                    <span class="form-tip">保存后系统自动提取证书序列号，无需手动填写</span>
                </el-form-item>
                <el-form-item label="证书序列号">
                    <el-input v-model="form.wechat_cert_serial_no" disabled placeholder="保存证书后自动生成" />
                    <span class="form-tip">自动提取，不可编辑</span>
                </el-form-item>

                <el-divider content-position="left"><b>收（微信 → 商户）</b></el-divider>

                <el-form-item label="微信支付公钥">
                    <el-input v-model="form.mch_key" type="textarea" :rows="3" placeholder="商户平台下载的 wechatpay_public_key.pem&#10;从 -----BEGIN PUBLIC KEY----- 到 -----END PUBLIC KEY----- 完整内容" />
                    <span class="form-tip">用于验签，确认回调通知是微信支付发出的</span>
                </el-form-item>
                <el-form-item label="APIv3 密钥">
                    <el-input v-model="form.apiv3_key" placeholder="微信商户平台 → API安全 → APIv3密钥" show-password autocomplete="new-password" />
                    <span class="form-tip">32位随机字符串，用于解密回调通知报文</span>
                </el-form-item>

                <el-divider />

                <el-form-item label="当前环境">
                    <el-tag type="success">正式环境</el-tag>
                    <span class="form-tip">接口地址: api.mch.weixin.qq.com</span>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" :loading="saving" @click="handleSave">保存配置</el-button>
                    <el-tag type="info" style="margin-left: 12px;">保存后需重启后端生效</el-tag>
                </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { Money } from '@element-plus/icons-vue'
import { toast } from '~/composables/util'
import axios from '~/axios'

const saving = ref(false)

const form = reactive({
    app_id: '',
    mch_id: '',
    mch_key: '',
    apiv3_key: '',
    notify_url: '',
    wechat_private_key: '',
    wechat_certificate: '',
    wechat_cert_serial_no: '',
})

async function loadConfig() {
    try {
        const res = await axios.get('/v1/admin/wechatpay/get')
        if (res) {
            Object.keys(form).forEach(key => {
                if (res[key] !== undefined) {
                    form[key] = res[key]
                }
            })
        }
    } catch { /* 使用默认值 */ }
}

async function handleSave() {
    saving.value = true
    try {
        const res = await axios.post('/v1/admin/wechatpay/save', { ...form })
        if (res && res.success !== false) {
            toast('微信支付配置已保存', 'success')
        } else {
            toast('保存失败', 'error')
        }
    } catch {
        toast('保存失败', 'error')
    } finally {
        saving.value = false
    }
}

onMounted(loadConfig)
</script>

<style scoped>
.mb-5 { margin-bottom: 20px; }
.form-tip {
    display: block;
    font-size: 12px;
    color: #999;
    margin-top: 4px;
}
</style>
