import axios from '~/axios'

// 获取优惠券列表
export function getCouponList(params) {
    return axios.get("/v1/coupon/admin/list", { params })
}

// 新增优惠券
export function addCoupon(data) {
    return axios.post("/v1/coupon/admin/add", data)
}

// 更新优惠券
export function updateCoupon(id, data) {
    return axios.post(`/v1/coupon/admin/update/${id}`, data)
}

// 删除优惠券
export function deleteCoupon(id) {
    return axios.post(`/v1/coupon/admin/delete/${id}`)
}
