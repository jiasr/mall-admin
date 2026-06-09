<template>
    <div class="setting-page">
        <el-card shadow="never">
            <template #header>
                <span class="section-title">基础设置</span>
            </template>
            <el-form :model="form" label-width="120px" style="max-width: 600px">
                <el-form-item label="商城名称">
                    <el-input v-model="form.siteName" placeholder="请输入商城名称" />
                </el-form-item>
                <el-form-item label="商城Logo">
                    <el-upload
                        class="avatar-uploader"
                        action="#"
                        :show-file-list="false"
                        :auto-upload="false"
                        accept="image/*"
                        @change="handleLogoChange"
                    >
                        <el-avatar v-if="form.logo" :src="form.logo" :size="64" shape="square" />
                        <el-icon v-else :size="32"><Plus /></el-icon>
                    </el-upload>
                </el-form-item>
                <el-form-item label="客服电话">
                    <el-input v-model="form.servicePhone" placeholder="请输入客服电话" />
                </el-form-item>
                <el-form-item label="客服邮箱">
                    <el-input v-model="form.serviceEmail" placeholder="请输入客服邮箱" />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" :loading="saving" @click="handleSave">保存设置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <el-card shadow="never" style="margin-top: 20px">
            <template #header>
                <span class="section-title">注册与访问</span>
            </template>
            <el-form :model="form" label-width="120px" style="max-width: 600px">
                <el-form-item label="允许注册">
                    <el-switch v-model="form.allowRegister" />
                    <span class="form-tip">关闭后用户将无法自主注册</span>
                </el-form-item>
                <el-form-item label="注册需审核">
                    <el-switch v-model="form.registerNeedAudit" />
                    <span class="form-tip">开启后用户注册需管理员审核</span>
                </el-form-item>
                <el-form-item label="启用分销">
                    <el-switch v-model="form.enableDistribution" />
                    <span class="form-tip">开启后用户可申请成为分销员</span>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" :loading="saving" @click="handleSave">保存设置</el-button>
                </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { toast } from '~/composables/util'
import axios from '~/axios'

const saving = ref(false)

const form = reactive({
    siteName: '',
    logo: '',
    servicePhone: '',
    serviceEmail: '',
    allowRegister: true,
    registerNeedAudit: false,
    enableDistribution: true,
})

async function loadSetting() {
    try {
        const data = await axios.get('/v1/admin/setting/get')
        if (data) {
            Object.assign(form, data)
        }
    } catch {
        // 后端未提供接口时使用默认值
    }
}

function handleLogoChange(file) {
    // 本地预览
    const reader = new FileReader()
    reader.onload = (e) => {
        form.logo = e.target.result
    }
    reader.readAsDataURL(file.raw)
}

async function handleSave() {
    saving.value = true
    try {
        await axios.post('/v1/admin/setting/save', form)
        toast('保存成功', 'success')
    } catch {
        toast('保存失败，请稍后重试', 'error')
    } finally {
        saving.value = false
    }
}

onMounted(() => {
    loadSetting()
})
</script>

<style scoped>
.setting-page {
    max-width: 900px;
}

.section-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
}

.avatar-uploader {
    cursor: pointer;
    border: 1px dashed #dcdfe6;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    transition: border-color 0.2s;
}

.avatar-uploader:hover {
    border-color: #409eff;
}

.form-tip {
    margin-left: 12px;
    font-size: 12px;
    color: #909399;
}
</style>
