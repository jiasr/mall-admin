/**
 * 图片上传 Composable
 * 使用 MinIO 直传方案：获取预签名 URL -> 直接 PUT 到 MinIO -> 确认上传
 */
import { ref } from 'vue'
import { toast } from '~/composables/util'
import { getUploadCredential, confirmUpload } from '~/api/setting'

export function useImageUpload() {
    const uploading = ref(false)
    const progress = ref(0)

    /**
     * 单文件上传
     * @param {File} file - 文件对象
     * @param {string} scene - 场景标识: product/system/avatar/banner/editor
     * @returns {Promise<string>} - 返回公网 URL
     */
    async function handleUpload(file, scene = 'product') {
        if (!file) return ''

        uploading.value = true
        progress.value = 0

        try {
            // 1. 获取上传凭证
            const credData = await getUploadCredential(scene, file.name)
            const credential = credData?.credentials?.[0]
            if (!credential) {
                throw new Error('获取上传凭证失败')
            }

            const { upload_url, public_url, object_name } = credential

            // 2. 直传 MinIO
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest()
                xhr.open('PUT', upload_url, true)
                xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')

                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        progress.value = Math.round((e.loaded / e.total) * 90)
                    }
                }

                xhr.onload = () => {
                    if (xhr.status === 200 || xhr.status === 204) {
                        resolve()
                    } else {
                        reject(new Error(`上传失败: HTTP ${xhr.status}`))
                    }
                }

                xhr.onerror = () => reject(new Error('网络错误，上传失败'))
                xhr.send(file)
            })

            progress.value = 95

            // 3. 确认上传
            await confirmUpload(object_name)

            progress.value = 100
            toast('上传成功', 'success')
            return public_url

        } catch (e) {
            console.error('图片上传失败:', e)
            toast('图片上传失败: ' + (e.message || '未知错误'), 'error')
            return ''
        } finally {
            uploading.value = false
            progress.value = 0
        }
    }

    /**
     * 批量上传
     * @param {File[]} files - 文件数组
     * @param {string} scene - 场景标识
     * @returns {Promise<string[]>} - 返回公网 URL 数组
     */
    async function handleBatchUpload(files, scene = 'product') {
        if (!files || files.length === 0) return []

        uploading.value = true
        progress.value = 0

        const urls = []

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const url = await handleSingleFileInBatch(file, scene)
                if (url) {
                    urls.push(url)
                }
                progress.value = Math.round(((i + 1) / files.length) * 100)
            }

            if (urls.length > 0) {
                toast(`成功上传 ${urls.length}/${files.length} 个文件`, 'success')
            }
        } catch (e) {
            console.error('批量上传失败:', e)
        } finally {
            uploading.value = false
            progress.value = 0
        }

        return urls
    }

    async function handleSingleFileInBatch(file, scene) {
        try {
            const credData = await getUploadCredential(scene, file.name)
            const credential = credData?.credentials?.[0]
            if (!credential) return ''

            const { upload_url, public_url, object_name } = credential

            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest()
                xhr.open('PUT', upload_url, true)
                xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
                xhr.onload = () => {
                    if (xhr.status === 200 || xhr.status === 204) resolve()
                    else reject(new Error(`HTTP ${xhr.status}`))
                }
                xhr.onerror = () => reject(new Error('网络错误'))
                xhr.send(file)
            })

            await confirmUpload(object_name)
            return public_url
        } catch (e) {
            console.error('文件上传失败:', file.name, e)
            return ''
        }
    }

    return {
        uploading,
        progress,
        handleUpload,
        handleBatchUpload,
    }
}
