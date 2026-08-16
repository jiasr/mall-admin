import axios from '~/axios'

// 获取用户列表（分页）
export function getUserList(params) {
    return axios.get("/mall/v1/user/admin/list", { params })
}

// 获取用户详情
export function getUserDetail(id) {
    return axios.get("/mall/v1/user/admin/detail", { params: { id } })
}

// 禁用/启用用户
export function toggleUserStatus(id, status) {
    return axios.post(`/mall/v1/user/admin/status/${id}`, { status })
}

// 删除用户
export function deleteUser(id) {
    return axios.post(`/mall/v1/user/admin/delete/${id}`)
}

// 获取用户的收货地址列表（复用小程序地址接口）
export function getUserAddresses(userid) {
    return axios.get("/mall/v1/address/list", { params: { userid } })
}
