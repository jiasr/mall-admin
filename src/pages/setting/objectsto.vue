<template>
    <div class="storage-setting-page">
        <!-- 对象存储配置 -->
        <el-card shadow="never">
            <template #header>
                <div class="card-header-row">
                    <span class="section-title">对象存储配置</span>
                    <el-button type="success" :loading="testing" @click="handleTestConnection">
                        <el-icon><Connection /></el-icon> 测试连接
                    </el-button>
                </div>
            </template>

            <el-alert
                type="info"
                :closable="false"
                show-icon
                style="margin-bottom: 20px"
            >
                <template #title>
                    配置 S3 兼容的对象存储服务（如 MinIO / Ceph / SeaweedFS 等），用于商品图片等文件的上传与访问。
                </template>
            </el-alert>

            <el-form :model="form" label-width="150px" style="max-width: 650px">
                <el-form-item label="Endpoint">
                    <el-input v-model="form.endpoint" placeholder="如 http://127.0.0.1:9000" />
                    <span class="form-tip">S3 兼容存储的服务地址</span>
                </el-form-item>
                <el-form-item label="AccessKey ID">
                    <el-input v-model="form.access_key" placeholder="AccessKey ID" />
                </el-form-item>
                <el-form-item label="AccessKey Secret">
                    <el-input v-model="form.secret_key" placeholder="AccessKey Secret" show-password />
                </el-form-item>
                <el-form-item label="Bucket 名称">
                    <el-input v-model="form.bucket_name" placeholder="如 mall-images" />
                </el-form-item>
                <el-form-item label="Region">
                    <el-input v-model="form.region" placeholder="如 us-east-1" />
                    <span class="form-tip">S3 Region，默认为 us-east-1</span>
                </el-form-item>
                <el-form-item label="公网访问地址">
                    <el-input v-model="form.public_endpoint" placeholder="如 http://82.156.225.136:9000/mall-images" />
                    <span class="form-tip">前端访问图片的公网地址前缀，留空则使用 Endpoint</span>
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
                    <el-button @click="handleReset">恢复默认</el-button>
                </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { Connection } from '@element-plus/icons-vue'
import { toast } from '~/composables/util'
import { getStorageSetting, saveStorageSetting, testConnection } from '~/api/setting'

const saving = ref(false)
const testing = ref(false)

const defaultForm = {
    endpoint: 'http://127.0.0.1:9000',
    access_key: '',
    secret_key: '',
    bucket_name: 'mall-images',
    region: 'us-east-1',
    public_endpoint: 'http://127.0.0.1:9000',
    upload_max_size: 10,
    upload_allowed_types: 'jpg,jpeg,png,gif,webp,bmp',
}

const form = reactive({ ...defaultForm })

async function loadSetting() {
    try {
        const data = await getStorageSetting()
        if (data) {
            Object.keys(form).forEach(key => {
                if (data[key] !== undefined && data[key] !== null) {
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
        await saveStorageSetting({ ...form })
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
        // 先保存当前配置，确保后端使用最新配置
        await saveStorageSetting({ ...form })

        // 调用后端测试连接
        const res = await testConnection()
        if (res.success) {
            toast('连接成功！', 'success')
        } else {
            toast('连接失败: ' + (res.message || '未知错误'), 'error')
        }
    } catch (e) {
        toast('连接失败，请检查配置: ' + (e.message || ''), 'error')
    } finally {
        testing.value = false
    }
}

onMounted(() => {
    loadSetting()
})
</script>

<style scoped>
.storage-setting-page {
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
