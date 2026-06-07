import axios from '~/axios'

// 获取商品列表
export function getGoodsList(params) {
    return axios.get("/mall/v1/goods/list", { params })
}

// 获取商品详情
export function getGoodsDetail(spuId) {
    return axios.get("/mall/v1/goods/detail", { params: { spuId } })
}

// 新增商品
export function addGoods(data) {
    return axios.post("/mall/v1/goods/admin/goods/add", data)
}

// 更新商品
export function updateGoods(spuId, data) {
    return axios.post(`/mall/v1/goods/admin/goods/update/${spuId}`, data)
}

// 删除商品
export function deleteGoods(spuId) {
    return axios.post(`/mall/v1/goods/admin/goods/delete/${spuId}`)
}

// 上架商品
export function putOnSale(spuId) {
    return axios.post(`/mall/v1/goods/admin/goods/putOnSale/${spuId}`)
}

// 下架商品
export function pullOffSale(spuId) {
    return axios.post(`/mall/v1/goods/admin/goods/pullOffSale/${spuId}`)
}
