<template>
    <div class="setting-page">
        <!-- 基础设置 -->
        <el-card shadow="never">
            <template #header>
                <span class="section-title"><el-icon><Tools /></el-icon> 基础设置</span>
            </template>
            <el-form :model="form" label-width="100px">
                <el-row :gutter="40">
                    <el-col :xs="24" :sm="12" :xl="8">
                        <el-form-item label="商城名称">
                            <el-input v-model="form.site_name" placeholder="请输入商城名称" />
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :xl="8">
                        <el-form-item label="客服电话">
                            <el-input v-model="form.service_phone" placeholder="请输入客服电话" />
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :xl="8">
                        <el-form-item label="客服邮箱">
                            <el-input v-model="form.service_email" placeholder="请输入客服邮箱" />
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :xl="24">
                        <el-form-item label="商城Logo">
                            <div class="logo-upload-area">
                                <el-avatar v-if="form.logo" :src="form.logo" :size="64" shape="square" />
                                <el-upload
                                    class="avatar-uploader"
                                    action="#"
                                    :show-file-list="false"
                                    :auto-upload="false"
                                    accept="image/*"
                                    :before-upload="() => false"
                                    @change="handleLogoChange"
                                    drag
                                >
                                    <el-icon :size="24"><UploadFilled /></el-icon>
                                    <span style="font-size:12px;color:#909399">拖拽上传</span>
                                </el-upload>
                                <span class="upload-tip">建议 200x60</span>
                            </div>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item>
                    <el-button type="primary" :loading="saving" @click="handleSave">保存设置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 注册与访问 -->
        <el-card shadow="never" class="mt-5">
            <template #header>
                <span class="section-title"><el-icon><Lock /></el-icon> 注册与访问</span>
            </template>
            <el-form :model="form" label-width="100px">
                <el-row :gutter="40">
                    <el-col :xs="24" :sm="8">
                        <el-form-item label="允许注册">
                            <el-switch v-model="form.allow_register" />
                            <span class="form-tip">关闭后用户无法自主注册</span>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="8">
                        <el-form-item label="注册需审核">
                            <el-switch v-model="form.register_need_audit" />
                            <span class="form-tip">开启后注册需管理员审核</span>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="8">
                        <el-form-item label="启用分销">
                            <el-switch v-model="form.enable_distribution" />
                            <span class="form-tip">开启后可申请分销员</span>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item>
                    <el-button type="primary" :loading="saving" @click="handleSave">保存设置</el-button>
                </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { UploadFilled, Tools, Lock } from '@element-plus/icons-vue'
import { toast } from '~/composables/util'
import { getSetting, saveSetting } from '~/api/setting'
import { useImageUpload } from '~/composables/useImageUpload'

const saving = ref(false)
const { handleUpload } = useImageUpload()

const form = reactive({
    site_name: '',
    logo: '',
    service_phone: '',
    service_email: '',
    allow_register: true,
    register_need_audit: false,
    enable_distribution: true,
})

async function loadSetting() {
    try {
        const data = await getSetting()
        if (data) {
            Object.keys(form).forEach(key => {
                if (data[key] !== undefined) {
                    form[key] = data[key]
                }
            })
        }
    } catch { /* 使用默认值 */ }
}

async function handleLogoChange(file) {
    if (!file?.raw) return
    const url = await handleUpload(file.raw, 'system')
    if (url) {
        form.logo = url
        toast('Logo 上传成功', 'success')
    }
}

async function handleSave() {
    saving.value = true
    try {
        await saveSetting({ ...form })
        toast('保存成功', 'success')
    } catch {
        toast('保存失败，请稍后重试', 'error')
    } finally {
        saving.value = false
    }
}

onMounted(() => { loadSetting() })
</script>

<style scoped>
.setting-page {
    max-width: 1200px;
}

.mt-5 { margin-top: 20px; }

.section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.logo-upload-area {
    display: flex;
    align-items: center;
    gap: 12px;
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

.avatar-uploader .el-upload-dragger {
    border: none;
    border-radius: 0;
    background: transparent;
    padding: 0;
    width: 64px;
    height: 64px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
}

.avatar-uploader:hover { border-color: #409eff; }

.upload-tip {
    font-size: 12px;
    color: #909399;
}

.form-tip {
    margin-left: 10px;
    font-size: 12px;
    color: #909399;
}
</style>
