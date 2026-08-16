<template>
    <div class="files-page">
        <el-card shadow="never" class="files-card">
            <template #header>
                <div class="files-header">
                    <span class="section-title"><el-icon><FolderOpened /></el-icon> 文件管理</span>
                    <el-button @click="$router.push('/setting/objectsto')">返回配置</el-button>
                </div>
            </template>

            <div class="files-body">
                <div class="files-sidebar">
                    <div class="sidebar-title">文件夹</div>
                    <el-tree
                        ref="treeRef"
                        :data="treeData"
                        :props="treeProps"
                        node-key="prefix"
                        :load="loadNode"
                        lazy
                        highlight-current
                        :expand-on-click-node="false"
                        @node-click="handleNodeClick"
                    >
                        <template #default="{ data }">
                            <span class="tree-node">
                                <el-icon><Folder /></el-icon>
                                <span>{{ data.label || '根目录' }}</span>
                            </span>
                        </template>
                    </el-tree>
                </div>

                <div class="files-content">
                    <div class="content-toolbar">
                        <el-breadcrumb separator="/">
                            <el-breadcrumb-item><a href="javascript:;" @click="browse('')">根目录</a></el-breadcrumb-item>
                            <el-breadcrumb-item v-for="(p, i) in pathParts" :key="i">
                                <a v-if="i < pathParts.length - 1" href="javascript:;" @click="browse(pathParts.slice(0, i + 1).join('/') + '/')">{{ p }}</a>
                                <span v-else>{{ p }}</span>
                            </el-breadcrumb-item>
                        </el-breadcrumb>
                        <div class="toolbar-actions">
                            <span v-if="currentPrefix" class="current-path">{{ currentPrefix }}</span>
                            <span class="file-count" v-if="!loading">{{ files.length }} 个文件</span>
                        </div>
                    </div>

                    <div v-if="subfolders.length > 0" class="subfolder-bar">
                        <div v-for="f in subfolders" :key="f" class="subfolder-item" @click="browse(f)">
                            <el-icon :size="20" color="#409eff"><Folder /></el-icon>
                            <span>{{ getFolderName(f) }}</span>
                        </div>
                    </div>

                    <div class="table-wrap">
                        <el-table v-show="files.length > 0" :data="files" stripe size="small" style="width: 100%" @row-click="handlePreview">
                            <el-table-column label="文件名" min-width="280">
                                <template #default="scope">
                                    <div class="file-cell">
                                        <el-icon><component :is="getFileIcon(scope.row.key)" /></el-icon>
                                        <span>{{ getFileName(scope.row.key) }}</span>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="大小" width="120">
                                <template #default="scope">{{ formatSize(scope.row.size) }}</template>
                            </el-table-column>
                            <el-table-column label="修改时间" width="180">
                                <template #default="scope">{{ scope.row.last_modified }}</template>
                            </el-table-column>
                    </el-table>

                        <el-empty v-show="!loading && subfolders.length === 0 && files.length === 0" description="此文件夹为空" />
                    </div>
                </div>
            </div>
        </el-card>

        <!-- 文件预览对话框 -->
        <el-dialog v-model="previewVisible" :title="previewFileName" width="720px" top="5vh" destroy-on-close>
            <div class="preview-body">
                <img v-if="previewIsImage" :src="previewUrl" class="preview-image" @click="previewUrl = previewUrl" />
                <div v-else class="preview-placeholder">
                    <el-icon :size="48"><Document /></el-icon>
                    <p>{{ previewFileName }}</p>
                    <p class="preview-size">{{ formatSize(previewFileSize) }}</p>
                    <el-button type="primary" @click="openInNewTab">在新标签页打开</el-button>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import { FolderOpened, Folder, Document, PictureFilled, VideoCamera } from '@element-plus/icons-vue'
import { toast } from '~/composables/util'
import axios from '~/axios'

// ====== Storage config cache ======
const baseUrl = ref('')

async function loadBaseUrl() {
    try {
        const res = await axios.get('/mall/v1/admin/storage/get')
        if (res) {
            const ep = res.public_endpoint || res.endpoint || ''
            const bucket = res.bucket_name || ''
            if (ep && bucket) {
                baseUrl.value = ep + '/' + bucket
            }
        }
    } catch { /* ignore */ }
}

function getFileUrl(key) {
    return baseUrl.value ? baseUrl.value + '/' + key : ''
}

// ====== Tree & file list ======
const treeRef = ref(null)
const loading = ref(false)
const currentPrefix = ref('')
const files = ref([])
const subfolders = ref([])

const treeData = ref([
    { label: '根目录', prefix: '', leaf: false },
])

const treeProps = { label: 'label', children: 'children', isLeaf: 'leaf' }

const pathParts = computed(() => {
    if (!currentPrefix.value) return []
    return currentPrefix.value.split('/').filter(Boolean)
})

function getFileName(key) {
    return key.split('/').pop()
}

function getFolderName(path) {
    return path.replace(/\/$/, '').split('/').pop()
}

function getFileIcon(key) {
    const ext = key.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'PictureFilled'
    if (['mp4', 'avi', 'mov', 'mkv', 'flv'].includes(ext)) return 'VideoCamera'
    return 'Document'
}

function formatSize(bytes) {
    if (!bytes || bytes === 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    let i = 0
    let size = bytes
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
    return size.toFixed(i > 0 ? 1 : 0) + ' ' + units[i]
}

async function loadNode(node, resolve) {
    const prefix = node.data?.prefix || ''
    try {
        const res = await axios.get('/mall/v1/admin/storage/files', { params: { prefix } })
        if (res?.success) {
            resolve((res.data.folders || []).map(f => ({
                label: f.replace(/\/$/, '').split('/').pop(),
                prefix: f,
                leaf: false,
            })))
        } else { resolve([]) }
    } catch { resolve([]) }
}

let _browseTick = 0

async function browse(prefix) {
    const tick = ++_browseTick
    currentPrefix.value = prefix
    loading.value = true
    files.value = []
    subfolders.value = []
    try {
        const res = await axios.get('/mall/v1/admin/storage/files', { params: { prefix } })
        // 丢弃过期响应（用户已切换到其他目录）
        if (tick !== _browseTick) return
        if (res?.success) {
            console.log('browse result:', currentPrefix.value, res.data.files?.length, 'files')
            files.value = res.data.files || []
            subfolders.value = res.data.folders || []
        }
    } catch { toast('加载文件列表失败', 'error') }
    finally {
        if (tick === _browseTick) loading.value = false
    }
}

function handleNodeClick(data) {
    if (data?.prefix !== undefined) browse(data.prefix)
}

// ====== Preview ======
const previewVisible = ref(false)
const previewFileName = ref('')
const previewFileSize = ref(0)
const previewUrl = ref('')
const previewIsImage = computed(() => {
    const ext = previewFileName.value.split('.').pop()?.toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)
})

function handlePreview(row) {
    previewFileName.value = getFileName(row.key)
    previewFileSize.value = row.size
    previewUrl.value = getFileUrl(row.key)
    previewVisible.value = true
}

function openInNewTab() {
    window.open(previewUrl.value, '_blank')
}

// ====== (上传/删除功能已移除，仅用于浏览) ======

onMounted(async () => {
    await loadBaseUrl()
    browse('')
})
onActivated(() => {
    browse(currentPrefix.value)
})
</script>

<style scoped>
.files-card { min-height: 500px; }

.files-header {
    display: flex; align-items: center; justify-content: space-between;
}

.section-title {
    display: flex; align-items: center; gap: 6px;
    font-size: 16px; font-weight: 600; color: #303133;
}

.files-body { display: flex; gap: 16px; }

.files-sidebar {
    flex-shrink: 0; width: 200px;
    border-right: 1px solid #ebeef5; padding-right: 12px;
}

.sidebar-title {
    font-size: 13px; font-weight: 600; color: #606266;
    margin-bottom: 8px; padding-left: 4px;
}

.tree-node { display: flex; align-items: center; gap: 4px; font-size: 13px; }

.files-content { flex: 1; overflow: hidden; }

.content-toolbar {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #ebeef5;
}

.file-count { font-size: 12px; color: #909399; }
.current-path { font-size: 12px; color: #909399; margin-right: 8px; }

.subfolder-bar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }

.subfolder-item {
    display: flex; align-items: center; gap: 4px;
    padding: 6px 10px; border: 1px solid #ebeef5; border-radius: 4px;
    cursor: pointer; font-size: 13px; color: #606266; transition: all 0.2s;
}

.subfolder-item:hover { border-color: #409eff; color: #409eff; background: #ecf5ff; }

.file-cell { display: flex; align-items: center; gap: 6px; cursor: pointer; }

.preview-body { display: flex; justify-content: center; max-height: 70vh; overflow: auto; }

.preview-image { max-width: 100%; max-height: 65vh; object-fit: contain; border-radius: 4px; }

.preview-placeholder {
    display: flex; flex-direction: column; align-items: center;
    gap: 12px; padding: 40px 0; color: #909399;
}

.preview-size { font-size: 12px; color: #909399; }
</style>
