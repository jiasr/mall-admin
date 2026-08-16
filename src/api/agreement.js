import axios from '~/axios'

// ========== 用户协议与隐私政策 API ==========

// 分页查询所有协议
export function getAgreementList(params) {
    return axios.get('/mall/v1/admin/agreement/list', { params })
}

// 新增或更新协议
export function saveAgreement(data) {
    return axios.post('/mall/v1/admin/agreement/save', data)
}

// 删除协议
export function deleteAgreement(id) {
    return axios.post('/mall/v1/admin/agreement/delete', { id })
}
