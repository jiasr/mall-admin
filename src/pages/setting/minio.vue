<template>
    <div class="minio-setting-page">
        <!-- MinIO 存储配置 -->
        <el-card shadow="never">
            <template #header>
                <div class="card-header-row">
                    <span class="section-title">MinIO 存储配置</span>
                    <el-button type="success" :loading="testing" @click="handleTestConnection">
                        <el-icon><Connection /></el-icon> 测试连接
                    </el-button>
                </div>
            </template>
            <el-form :model="form" label-width="150px" style="max-width: 650px">
                <el-form-item label="API 地址">
                    <el-input v-model="form.minio_endpoint" placeholder="如 127.0.0.1:9000" />
                    <span class="form-tip">MinIO 服务 API 端口</span>
                </el-form-item>
                <el-form-item label="Access Key">
                    <el-input v-model="form.minio_access_key" placeholder="MinIO Access Key" />
                </el-form-item>
                <el-form-item label="Secret Key">
                    <el-input v-model="form.minio_secret_key" placeholder="MinIO Secret Key" show-password />
                </el-form-item>
                <el-form-item label="Bucket 名称">
                    <el-input v-model="form.minio_bucket_name" placeholder="如 mall-images" />
                </el-form-item>
                <el-form-item label="公网访问地址">
                    <el-input v-model="form.minio_public_endpoint" placeholder="如 http://你的IP:9000" />
                    <span class="form-tip">用于前端直接展示图片的公网 URL 前缀</span>
                </el-form-item>
                <el-form-item label="启用 HTTPS">
                    <el-switch v-model="form.minio_secure" />
                    <span class="form-tip">如果 MinIO 配置了 SSL 证书则开启</span>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" :loading="saving" @click="handleSave">保存配置</el-button>
                    <el-button @click="handleReset">恢复默认</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 上传限制 -->
        <el-card shadow="never" style="margin-top: 20px">
            <template #header>
                <span class="section-title">上传限制</span>
            </template>
            <el-form :model="form" label-width="150px" style="max-width: 650px">
                <el-form-item label="最大文件大小(MB)">
                    <el-input-number v-model="form.upload_max_size" :min="1" :max="100" :step="1" />
                    <span class="form-tip">单文件上传大小限制</span>
                </el-form-item>
                <el-form-item label="允许的文件类型">
                    <el-input v-model="form.upload_allowed_types" placeholder="如 jpg,jpeg,png,gif,webp" />
                    <span class="form-tip">逗号分隔的文件扩展名</span>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" :loading="saving" @click="handleSave">保存配置</el-button>
                </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { Connection } from '@element-plus/icons-vue'
import { toast } from '~/composables/util'
import { getSetting, saveSetting } from '~/api/setting'

const saving = ref(false)
const testing = ref(false)

const defaultForm = {
    minio_endpoint: '127.0.0.1:9000',
    minio_access_key: 'minioadmin',
    minio_secret_key: 'minioadmin',
    minio_bucket_name: 'mall-images',
    minio_secure: false,
    minio_public_endpoint: 'http://127.0.0.1:9000',
    upload_max_size: 10,
    upload_allowed_types: 'jpg,jpeg,png,gif,webp,bmp',
}

const form = reactive({ ...defaultForm })

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
    } catch {
        // 后端未提供接口时使用默认值
    }
}

async function handleSave() {
    saving.value = true
    try {
        const payload = { ...form }
        await saveSetting(payload)
        toast('保存成功', 'success')
    } catch {
        toast('保存失败，请稍后重试', 'error')
    } finally {
        saving.value = false
    }
}

function handleReset() {
    Object.keys(defaultForm).forEach(key => {
        form[key] = defaultForm[key]
    })
    toast('已恢复默认值，请点击保存', 'info')
}

async function handleTestConnection() {
    testing.value = true
    try {
        // 先保存当前 MinIO 配置，确保后端使用最新配置
        const minioConfig = {}
        Object.keys(form).forEach(key => {
            if (key.startsWith('minio_')) {
                minioConfig[key] = form[key]
            }
        })
        await saveSetting(minioConfig)

        // 请求一个测试上传凭证来验证 MinIO 连接
        const { getUploadCredential } = await import('~/api/setting')
        await getUploadCredential('system', 'test.jpg')
        toast('MinIO 连接成功！', 'success')
    } catch (e) {
        toast('MinIO 连接失败，请检查配置: ' + (e.message || ''), 'error')
    } finally {
        testing.value = false
    }
}

onMounted(() => {
    loadSetting()
})
</script>

<style scoped>
.minio-setting-page {
    max-width: 900px;
}

.section-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
}

.card-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.form-tip {
    margin-left: 12px;
    font-size: 12px;
    color: #909399;
}
</style>
