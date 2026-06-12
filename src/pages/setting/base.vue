<template>
    <div class="setting-page">
        <!-- 基础设置 -->
        <el-card shadow="never">
            <template #header>
                <span class="section-title"><el-icon><Tools /></el-icon> 基础设置</span>
            </template>
            <el-form :model="form" label-width="100px" style="max-width: 600px">
                <el-form-item label="商城名称">
                    <el-input v-model="form.site_name" placeholder="请输入商城名称" />
                </el-form-item>
                <el-form-item label="客服电话">
                    <el-input v-model="form.service_phone" placeholder="请输入客服电话" />
                </el-form-item>
                <el-form-item label="客服邮箱">
                    <el-input v-model="form.service_email" placeholder="请输入客服邮箱" />
                </el-form-item>
                <el-form-item label="商城Logo">
                    <div class="logo-upload-wrap">
                        <!-- 预览 -->
                        <div v-if="form.logo" class="logo-preview-box">
                            <div class="logo-preview-img" :style="{ backgroundImage: 'url(' + imgUrl(form.logo) + ')' }"></div>
                            <div class="logo-preview-overlay">
                                <el-button type="danger" :icon="Delete" circle size="small" @click="form.logo = ''" />
                            </div>
                        </div>
                        <!-- 上传区 -->
                        <el-upload
                            class="logo-uploader"
                            action="#"
                            :show-file-list="false"
                            :auto-upload="false"
                            accept="image/*"
                            :before-upload="() => false"
                            @change="handleLogoChange"
                            drag
                        >
                            <el-icon :size="32"><Plus /></el-icon>
                            <span class="logo-upload-text">拖拽或点击上传</span>
                            <span class="logo-upload-hint">建议尺寸 200x60</span>
                        </el-upload>
                    </div>
                </el-form-item>
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
            <el-form :model="form" label-width="100px" style="max-width: 600px">
                <el-form-item label="允许注册">
                    <el-switch v-model="form.allow_register" />
                    <span class="form-tip">关闭后用户无法自主注册</span>
                </el-form-item>
                <el-form-item label="注册需审核">
                    <el-switch v-model="form.register_need_audit" />
                    <span class="form-tip">开启后注册需管理员审核</span>
                </el-form-item>
                <el-form-item label="启用分销">
                    <el-switch v-model="form.enable_distribution" />
                    <span class="form-tip">开启后可申请分销员</span>
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
import { useStore } from 'vuex'
import { Plus, Delete, Tools, Lock } from '@element-plus/icons-vue'
import { toast, imgUrl } from '~/composables/util'
import { getSetting, saveSetting } from '~/api/setting'
import { useImageUpload } from '~/composables/useImageUpload'

const store = useStore()
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
    const oldLogo = form.logo
    const result = await handleUpload(file.raw, 'system')
    if (result?.url) {
        form.logo = result.url
        toast('Logo 上传成功', 'success')
        // 删除旧 Logo
        if (oldLogo && result.object_name) {
            try {
                const { deleteImage } = await import('~/api/setting')
                // 从旧 URL 提取 object_name
                const oldKey = oldLogo.startsWith('/') ? oldLogo.split('/').slice(2).join('/') : ''
                if (oldKey) {
                    await deleteImage(oldKey)
                }
            } catch { /* 旧图删除失败不影响主流程 */ }
        }
    }
}

async function handleSave() {
    saving.value = true
    try {
        await saveSetting({ ...form })
        store.commit('SET_SITE_CONFIG', {
            site_name: form.site_name || '后台管理系统',
            logo: form.logo || '',
        })
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
    max-width: 800px;
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

.logo-upload-wrap {
    display: flex;
    align-items: center;
    gap: 16px;
}

.logo-preview-box {
    position: relative;
    width: 200px;
    height: 80px;
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    overflow: hidden;
    background: #fafafa;
}

.logo-preview-img {
    width: 100%;
    height: 100%;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center center;
}

.logo-preview-overlay {
    position: absolute;
    top: 4px;
    right: 4px;
    opacity: 0;
    transition: opacity 0.2s;
}

.logo-preview-box:hover .logo-preview-overlay {
    opacity: 1;
}

.logo-uploader {
    cursor: pointer;
    border: 1px dashed #dcdfe6;
    border-radius: 6px;
    width: 200px;
    height: 80px;
    transition: border-color 0.2s;
    background: #fafafa;
}

.logo-uploader:hover { border-color: #409eff; }

.logo-uploader .el-upload-dragger {
    border: none;
    border-radius: 0;
    background: transparent;
    padding: 0;
    width: 200px;
    height: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
}

.logo-upload-text {
    font-size: 12px;
    color: #606266;
}

.logo-upload-hint {
    font-size: 11px;
    color: #c0c4cc;
}

.form-tip {
    margin-left: 10px;
    font-size: 12px;
    color: #909399;
}
</style>
