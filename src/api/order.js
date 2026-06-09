import axios from '~/axios'

// 获取订单列表
export function getOrderList(params) {
    return axios.get("/v1/order/admin/list", { params })
}

// 获取订单详情
export function getOrderDetail(orderNo) {
    return axios.get("/v1/order/admin/detail", { params: { orderNo } })
}

// 更新订单状态（发货等）
export function processOrder(orderNo, data) {
    return axios.post(`/v1/order/admin/process/${orderNo}`, data)
}

// 删除订单
export function deleteOrder(orderNo) {
    return axios.post(`/v1/order/admin/delete/${orderNo}`)
}
