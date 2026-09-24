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

// 运单管理列表（可按订单号/运单号/物流公司筛选）
export function getWaybillList(params) {
    return axios.get("/mall/v1/express/waybill/list", { params })
}

// 获取电子面单（微信返回面单 HTML；中通返回面单图片）
export function getWaybillPrint(orderNo) {
    return axios.get("/mall/v1/express/waybill/print", { params: { orderNo } })
}

// 模拟更新运单状态（仅沙盒 TEST 运力，actionType 见微信文档）
export function testUpdateWaybill(orderNo, actionType) {
    return axios.post("/mall/v1/express/waybill/test-update", { orderNo, actionType })
}

// 取消运单（向物流渠道撤销 + 订单恢复为待发货；force=1 时渠道失败也仅本地回滚）
export function cancelExpressWaybill(orderNo, force = 0) {
    return axios.post("/mall/v1/express/waybill/cancel", { orderNo, force })
}

// 删除账号
export function deleteExpressAccount(id) {
    return axios.post(`/mall/v1/express/account/delete/${id}`)
}
