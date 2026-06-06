import axios from '~/axios'

// 获取分类树
export function getCategoryTree() {
    return axios.get("/mall/v1/goodscatalog/tree")
}

// 新增分类
export function addCategory(data) {
    return axios.post("/mall/v1/goodscatalog/add", data)
}

// 更新分类
export function updateCategory(id, data) {
    return axios.post(`/mall/v1/goodscatalog/update/${id}`, data)
}

// 删除分类
export function deleteCategory(id) {
    return axios.post(`/mall/v1/goodscatalog/delete/${id}`)
}

// 移动分类
export function moveCategory(data) {
    return axios.post("/mall/v1/goodscatalog/move", data)
}
