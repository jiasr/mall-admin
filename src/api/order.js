import axios from '~/axios'

// 获取订单列表
export function getOrderList(params) {
    return axios.get("/mall/v1/order/admin/list", { params })
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

// 删除订单
export function deleteOrder(orderNo) {
    return axios.post(`/mall/v1/order/admin/delete/${orderNo}`)
}

// 退款
export function refundOrder(data) {
    return axios.post("/mall/v1/order/admin/refund", data)
}
