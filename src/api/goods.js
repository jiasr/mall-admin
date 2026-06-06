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
