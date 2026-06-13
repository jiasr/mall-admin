/**
 * 图片上传 Composable
 * 使用服务端代理上传：文件发后端 -> 后端上传到 MinIO -> 返回 URL
 * 自动压缩图片（最大 1920px，JPEG 质量 0.8）
 */
import { ref } from 'vue'
import { toast } from '~/composables/util'
import { proxyUpload } from '~/api/setting'

/** 压缩图片（客户端 Canvas 压缩，减小上传体积） */
function compressImage(file, maxWidth = 1920, quality = 0.8) {
    return new Promise((resolve, reject) => {
        // 非图片或小于 100KB 的图片不压缩
        if (!file.type.startsWith('image/') || file.size < 100 * 1024) {
            return resolve(file)
        }

        const img = new Image()
        const url = URL.createObjectURL(file)

        img.onload = () => {
            URL.revokeObjectURL(url)

            let { width, height } = img
            // 等比缩放
            if (width > maxWidth) {
                height = Math.round(height * (maxWidth / width))
                width = maxWidth
            }

            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, width, height)

            canvas.toBlob((blob) => {
                if (!blob) return reject(new Error('压缩失败'))

                // 保留原始文件名，修改后缀为 .jpg（压缩后统一转 JPEG）
                const name = file.name.replace(/\.[^.]+$/, '.jpg')
                const compressed = new File([blob], name, { type: 'image/jpeg' })

                // 压缩后反而更大就别压缩了（极小图片）
                if (compressed.size >= file.size) return resolve(file)
                resolve(compressed)
            }, 'image/jpeg', quality)
        }

        img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error('图片加载失败'))
        }

        img.src = url
    })
}

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
            // 1. 压缩图片
            const compressed = await compressImage(file)
            if (compressed !== file) {
                console.log(`图片已压缩: ${(file.size / 1024).toFixed(0)}KB -> ${(compressed.size / 1024).toFixed(0)}KB`)
            }

            // 2. 上传到后端（后端转存 MinIO），带进度
            const uploadPromise = proxyUpload(compressed, scene, (e) => {
                if (e.total) {
                    progress.value = Math.round((e.loaded / e.total) * 100)
                }
            })

            // 同时更新模拟进度（防止进度条卡住）
            const simInterval = setInterval(() => {
                if (progress.value < 90) progress.value += 5
            }, 300)

            const res = await uploadPromise
            clearInterval(simInterval)

            console.log('[upload] raw res.data:', JSON.stringify(res?.data))
            const inner = res?.data?.data || res?.data || {}
            const publicUrl = inner.public_url
            const objectName = inner.object_name
            if (!publicUrl) {
                console.error('[upload] public_url 为空, res.data:', res?.data)
                throw new Error(inner.message || '上传失败')
            }

            progress.value = 100
            toast('上传成功', 'success')
            return { url: publicUrl, object_name: objectName }

        } catch (e) {
            console.error('图片上传失败:', e)
            toast('图片上传失败: ' + (e.message || '未知错误'), 'error')
            return { url: '', object_name: '' }
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
            const compressed = await compressImage(file)
            const res = await proxyUpload(compressed, scene)
            if (!res?.success || !res?.data?.public_url) return ''
            return res.data.public_url
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
