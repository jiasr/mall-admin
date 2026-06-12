<template>
    <div class="storage-setting-page">
        <el-card shadow="never">
            <template #header>
                <div class="card-header-row">
                    <span class="section-title"><el-icon><Folder /></el-icon> 对象存储配置</span>
                    <el-button type="success" :loading="testing" @click="handleTestConnection">
                        <el-icon><Connection /></el-icon> 测试连接
                    </el-button>
                </div>
            </template>

            <el-alert type="info" :closable="false" show-icon class="mb-5">
                <template #title>
                    配置 S3 兼容的对象存储服务（MinIO / COS / OSS / S3），用于商品图片等文件的上传与访问。
                </template>
            </el-alert>

            <el-form :model="form" label-width="130px" class="storage-form">
                <el-row :gutter="40">
                    <el-col :xs="24" :md="12">
                        <el-form-item label="Endpoint">
                            <el-input v-model="form.endpoint" placeholder="http://82.156.225.136:9000" />
                            <span class="form-tip">存储服务地址</span>
                        </el-form-item>
                        <el-form-item label="Bucket 名称">
                            <el-input v-model="form.bucket_name" placeholder="mall-images1" />
                        </el-form-item>
                        <el-form-item label="Region">
                            <el-input v-model="form.region" placeholder="us-east-1" />
                            <span class="form-tip">MinIO / COS / OSS 传 us-east-1，AWS S3 填真实 Region</span>
                        </el-form-item>
                        <el-form-item label="公网地址">
                            <el-input v-model="form.public_endpoint" placeholder="http://82.156.225.136:9000" />
                            <span class="form-tip">前端图片访问地址</span>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :md="12">
                        <el-form-item label="AccessKey ID">
                            <el-input v-model="form.access_key" placeholder="admin" />
                        </el-form-item>
                        <el-form-item label="AccessKey Secret">
                            <el-input v-model="form.secret_key" placeholder="password123" show-password />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item>
                    <el-button type="primary" :loading="saving" @click="handleSave">保存配置</el-button>
                    <el-button @click="handleReset">恢复默认</el-button>
                </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>

<script setup>
import { reactive, ref, onMounted, onActivated } from 'vue'
import { Connection, Folder } from '@element-plus/icons-vue'
import { toast } from '~/composables/util'
import { getStorageSetting, saveStorageSetting, testConnection } from '~/api/setting'

const saving = ref(false)
const testing = ref(false)

const defaultForm = {
    endpoint: 'http://82.156.225.136:9000',
    access_key: 'admin',
    secret_key: 'password123',
    bucket_name: 'mall-images1',
    region: 'us-east-1',
    public_endpoint: 'http://82.156.225.136:9000',
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
    } catch { /* 使用默认值 */ }
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
    Object.keys(defaultForm).forEach(key => { form[key] = defaultForm[key] })
    toast('已恢复默认值，请点击保存', 'info')
}

async function handleTestConnection() {
    testing.value = true
    try {
        await saveStorageSetting({ ...form })
        const res = await testConnection()
        if (res.success) {
            toast('连接成功！', 'success')
        } else {
            toast('连接失败: ' + (res.message || '未知错误'), 'error')
        }
    } catch (e) {
        toast('连接失败: ' + (e.message || ''), 'error')
    } finally {
        testing.value = false
    }
}

onMounted(() => { loadSetting() })
onActivated(() => { loadSetting() })
</script>

<style scoped>
.storage-setting-page {
    max-width: 900px;
}

.mb-5 { margin-bottom: 20px; }

.storage-form {
    max-width: 100%;
}

.card-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.form-tip {
    margin-left: 10px;
    font-size: 12px;
    color: #909399;
    white-space: nowrap;
}
</style>
