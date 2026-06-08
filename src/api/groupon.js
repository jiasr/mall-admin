import axios from '~/axios'

// ========== 团购活动管理 ==========

// 获取团购活动列表
export function getGrouponList(params) {
    return axios.get("/v1/groupon/admin/list", { params })
}

// 获取团购活动详情
export function getGrouponDetail(id) {
    return axios.get("/v1/groupon/admin/detail", { params: { id } })
}

// 新增团购活动
export function addGroupon(data) {
    return axios.post("/v1/groupon/admin/add", data)
}

// 更新团购活动
export function updateGroupon(id, data) {
    return axios.post(`/v1/groupon/admin/update/${id}`, data)
}

// 删除团购活动
export function deleteGroupon(id) {
    return axios.post(`/v1/groupon/admin/delete/${id}`)
}

// 结束团购活动（手动提前结束）
export function stopGroupon(id) {
    return axios.post(`/v1/groupon/admin/stop/${id}`)
}

// ========== 团购订单管理 ==========

// 获取团购订单列表（按团编号维度查看）
export function getGrouponOrderList(params) {
    return axios.get("/v1/groupon/admin/order/list", { params })
}

// 获取单个团的详细信息（含参团用户）
export function getGrouponGroupDetail(groupId) {
    return axios.get("/v1/groupon/admin/group/detail", { params: { groupId } })
}

// ========== 商品快捷查询（选品用） ==========

// 获取商品简单列表（用于选择团购商品）
export function getGoodsSimpleList(params) {
    return axios.get("/mall/v1/goods/list", { params })
}
