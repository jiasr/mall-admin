<template>
    <div class="agreement-page">
        <el-card shadow="never">
            <template #header>
                <span class="section-title"><el-icon><Document /></el-icon> 用户协议与隐私政策</span>
            </template>

            <el-tabs v-model="activeTab" type="card">
                <!-- 用户协议 -->
                <el-tab-pane label="用户协议" name="agreement">
                    <el-form :model="form" label-width="80px">
                        <el-form-item label="标题">
                            <el-input v-model="form.agreement.title" placeholder="请输入标题" style="max-width: 400px" />
                        </el-form-item>
                        <el-form-item label="版本号">
                            <el-input v-model="form.agreement.version" placeholder="如 1.0" style="max-width: 200px" />
                        </el-form-item>
                        <el-form-item label="内容">
                            <div class="editor-wrapper">
                                <Toolbar :editor="agreementEditorRef" :defaultConfig="toolbarConfig" mode="default" />
                                <Editor
                                    :defaultConfig="editorConfig"
                                    mode="default"
                                    v-model="form.agreement.content"
                                    @onCreated="(e) => onEditorCreated(e, 'agreement')"
                                />
                            </div>
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" :loading="saving" @click="handleSave('agreement')">保存用户协议</el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <!-- 关于我们 -->
                <el-tab-pane label="关于我们" name="about">
                    <el-form :model="form" label-width="80px">
                        <el-form-item label="标题">
                            <el-input v-model="form.about.title" placeholder="请输入标题" style="max-width: 400px" />
                        </el-form-item>
                        <el-form-item label="版本号">
                            <el-input v-model="form.about.version" placeholder="如 1.0" style="max-width: 200px" />
                        </el-form-item>
                        <el-form-item label="内容">
                            <div class="editor-wrapper">
                                <Toolbar :editor="aboutEditorRef" :defaultConfig="toolbarConfig" mode="default" />
                                <Editor
                                    :defaultConfig="editorConfig"
                                    mode="default"
                                    v-model="form.about.content"
                                    @onCreated="(e) => onEditorCreated(e, 'about')"
                                />
                            </div>
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" :loading="saving" @click="handleSave('about')">保存关于我们</el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <!-- 隐私政策 -->
                <el-tab-pane label="隐私政策" name="privacy">
                    <el-form :model="form" label-width="80px">
                        <el-form-item label="标题">
                            <el-input v-model="form.privacy.title" placeholder="请输入标题" style="max-width: 400px" />
                        </el-form-item>
                        <el-form-item label="版本号">
                            <el-input v-model="form.privacy.version" placeholder="如 1.0" style="max-width: 200px" />
                        </el-form-item>
                        <el-form-item label="内容">
                            <div class="editor-wrapper">
                                <Toolbar :editor="privacyEditorRef" :defaultConfig="toolbarConfig" mode="default" />
                                <Editor
                                    :defaultConfig="editorConfig"
                                    mode="default"
                                    v-model="form.privacy.content"
                                    @onCreated="(e) => onEditorCreated(e, 'privacy')"
                                />
                            </div>
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" :loading="saving" @click="handleSave('privacy')">保存隐私政策</el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>
            </el-tabs>
        </el-card>
    </div>
</template>

<script setup>
import { reactive, ref, shallowRef, onMounted } from 'vue'
import { Document } from '@element-plus/icons-vue'
import { toast } from '~/composables/util'
import { useImageUpload } from '~/composables/useImageUpload'
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { getAgreementList, saveAgreement } from '~/api/agreement'

const saving = ref(false)
const activeTab = ref('agreement')
const { handleUpload } = useImageUpload()

const form = reactive({
    agreement: { id: null, type: 'agreement', title: '', content: '', version: '1.0' },
    privacy: { id: null, type: 'privacy', title: '', content: '', version: '1.0' },
    about: { id: null, type: 'about', title: '', content: '', version: '1.0' },
})

const agreementEditorRef = shallowRef()
const privacyEditorRef = shallowRef()
const aboutEditorRef = shallowRef()

const toolbarConfig = {
    excludeKeys: ['group-video'],
}

const editorConfig = {
    placeholder: '请输入内容...',
    MENU_CONF: {
        uploadImage: {
            async customUpload(file, insertFn) {
                const result = await handleUpload(file, 'editor')
                if (result?.url) {
                    insertFn(result.url, file.name, result.url)
                }
            },
        },
    },
}

function onEditorCreated(editor, key) {
    if (key === 'agreement') {
        agreementEditorRef.value = editor
    } else if (key === 'privacy') {
        privacyEditorRef.value = editor
    } else {
        aboutEditorRef.value = editor
    }
    const editorEl = editor.getEditableContainer()
    if (editorEl) {
        editorEl.style.cssText = 'word-break:break-word;overflow-wrap:break-word;'
    }
}

async function loadAgreement() {
    try {
        const data = await getAgreementList({ pageIndex: 1, pageSize: 100 })
        const list = (data && data.list) || []
        for (const item of list) {
            if (item.type === 'agreement') {
                form.agreement = { id: item.id, type: 'agreement', title: item.title, content: item.content, version: item.version }
            } else if (item.type === 'privacy') {
                form.privacy = { id: item.id, type: 'privacy', title: item.title, content: item.content, version: item.version }
            } else if (item.type === 'about') {
                form.about = { id: item.id, type: 'about', title: item.title, content: item.content, version: item.version }
            }
        }
    } catch { /* 使用默认值 */ }
}

async function handleSave(key) {
    saving.value = true
    try {
        const item = form[key]
        await saveAgreement({
            id: item.id,
            type: item.type,
            title: item.title,
            content: item.content,
            version: item.version,
            status: 1,
        })
        toast('保存成功', 'success')
        // 刷新以更新 id
        await loadAgreement()
    } catch {
        toast('保存失败，请稍后重试', 'error')
    } finally {
        saving.value = false
    }
}

onMounted(() => { loadAgreement() })
</script>

<style scoped>
.section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.editor-wrapper {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    width: 100%;
}

.editor-wrapper :deep(.w-e-toolbar) {
    border-bottom: 1px solid #dcdfe6;
    border-radius: 4px 4px 0 0;
}

.editor-wrapper :deep(.w-e-text-container) {
    min-height: 400px;
}
</style>
