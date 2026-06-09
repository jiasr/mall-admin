import axios from '~/axios'

// 获取分销员列表
export function getAgentList(params) {
    return axios.get("/mall/v1/agent/admin/list", { params })
}

// 获取分销员详情
export function getAgentDetail(id) {
    return axios.get("/mall/v1/agent/admin/detail", { params: { id } })
}

// 禁用/启用分销员
export function toggleAgentStatus(id, status) {
    return axios.post(`/mall/v1/agent/admin/status/${id}`, { status })
}

// 删除分销员
export function deleteAgent(id) {
    return axios.post(`/mall/v1/agent/admin/delete/${id}`)
}
