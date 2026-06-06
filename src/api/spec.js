import axios from '~/axios'

// 获取规格列表
export function getSpecList(params) {
    return axios.get("/v1/goods/admin/spec/list", { params })
}

// 新增规格
export function addSpec(data) {
    return axios.post("/v1/goods/admin/spec/add", data)
}

// 更新规格
export function updateSpec(id, data) {
    return axios.post(`/v1/goods/admin/spec/update/${id}`, data)
}

// 删除规格
export function deleteSpec(id) {
    return axios.post(`/v1/goods/admin/spec/delete/${id}`)
}
