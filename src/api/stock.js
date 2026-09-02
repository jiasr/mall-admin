import axios from '~/axios'

// 库存商品列表
export function getStockGoodsList(params) {
    return axios.get("/mall/v1/stock/goods/list", { params })
}

// 库存商品详情
export function getStockGoodsDetail(id) {
    return axios.get("/mall/v1/stock/goods/detail", { params: { id } })
}

// 按条码查询库存商品
export function getStockGoodsByBarcode(barcode) {
    return axios.get("/mall/v1/stock/goods/by-barcode", { params: { barcode } })
}

// 删除库存商品（级联删除关联资源）
export function deleteStockGoods(id) {
    return axios.post("/mall/v1/stock/goods/delete", { id })
}

// 入库单列表
export function getStockInList(params) {
    return axios.get("/mall/v1/stock/in/list", { params })
}

// 入库单详情
export function getStockInDetail(id) {
    return axios.get("/mall/v1/stock/in/detail", { params: { id } })
}

// 库存流水列表
export function getStockLogList(params) {
    return axios.get("/mall/v1/stock/log/list", { params })
}
