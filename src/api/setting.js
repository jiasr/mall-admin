import axios from '~/axios'

// ========== 系统设置 API ==========

// 获取系统设置
export function getSetting() {
    return axios.get('/v1/admin/setting/get')
}

// 保存系统设置
export function saveSetting(data) {
    return axios.post('/v1/admin/setting/save', data)
}

// ========== 对象存储配置 API（独立表） ==========

// 获取存储配置
export function getStorageSetting() {
    return axios.get('/v1/admin/storage/get')
}

// 保存存储配置
export function saveStorageSetting(data) {
    return axios.post('/v1/admin/storage/save', data)
}

// ========== 图片上传 API ==========

// 获取上传凭证
export function getUploadCredential(scene, filename, count = 1) {
    return axios.post('/v1/upload/credential', { scene, filename, count })
}

// 确认上传完成
export function confirmUpload(objectName) {
    return axios.post('/v1/upload/confirm', { object_name: objectName })
}

// 删除图片
export function deleteImage(objectName) {
    return axios.post('/v1/upload/delete', { object_name: objectName })
}

// 测试存储连接
export function testConnection() {
    return axios.post('/v1/upload/test')
}
