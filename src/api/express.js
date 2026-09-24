import axios from '~/axios'

// ========== 快递（微信物流助手）账号管理 ==========

// 账号列表
export function getExpressAccountList(params) {
    return axios.get("/mall/v1/express/account/list", { params })
}

// 绑定（新增）账号
export function bindExpressAccount(data) {
    return axios.post("/mall/v1/express/account/bind", data)
}

// 更新账号（名称/状态/密码）
export function updateExpressAccount(data) {
    return axios.post("/mall/v1/express/account/update", data)
}

// 从微信同步已绑定的物流账号
export function syncExpressAccount() {
    return axios.post("/mall/v1/express/account/sync")
}

// 微信物流助手支持的快递公司列表（getAllDelivery）
export function getExpressDeliveryList() {
    return axios.get("/mall/v1/express/delivery/list")
}

// 查询物流轨迹（微信物流助手 path/get；中通传 deliveryId=zto）
export function getExpressTrack(params) {
    return axios.get("/mall/v1/express/track", { params })
}

// 删除账号
export function deleteExpressAccount(id) {
    return axios.post(`/mall/v1/express/account/delete/${id}`)
}
