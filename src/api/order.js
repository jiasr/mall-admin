import axios from '~/axios'

// 获取订单列表
export function getOrderList(params) {
    return axios.get("/mall/v1/order/admin/list", { params })
}

// 获取订单各状态数量统计（左侧状态栏角标）
export function getOrderStatusCount() {
    return axios.get("/mall/v1/order/admin/status-count")
}

// 获取订单详情
export function getOrderDetail(orderNo) {
    return axios.get("/mall/v1/order/admin/detail", { params: { orderNo } })
}

// 获取订单小票打印数据
export function getPrintTicket(orderNo) {
    return axios.get(`/mall/v1/order/admin/print/${orderNo}`)
}

// 更新订单状态（发货等）
export function processOrder(orderNo, data) {
    return axios.post(`/mall/v1/order/admin/process/${orderNo}`, data)
}

// 删除订单（软删除，进回收站）
export function deleteOrder(orderNo) {
    return axios.post(`/mall/v1/order/admin/delete/${orderNo}`)
}

// 回收站订单列表
export function getRecycleList(params) {
    return axios.get("/mall/v1/order/admin/recycle/list", { params })
}

// 回收站恢复订单
export function restoreOrder(orderNo) {
    return axios.post(`/mall/v1/order/admin/recycle/restore/${orderNo}`)
}

// 回收站彻底删除订单
export function purgeOrder(orderNo) {
    return axios.post(`/mall/v1/order/admin/recycle/purge/${orderNo}`)
}

// 退款
export function refundOrder(data) {
    return axios.post("/mall/v1/order/admin/refund", data)
}
