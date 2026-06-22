import axios from '~/axios'

// ========== 运费模板管理 ==========

export function getFreightTemplateList(params) {
    return axios.get("/mall/v1/order/admin/freight/template/list", { params })
}

export function getFreightTemplateDetail(id) {
    return axios.get("/mall/v1/order/admin/freight/template/detail", { params: { id } })
}

export function addFreightTemplate(data) {
    return axios.post("/mall/v1/order/admin/freight/template/add", data)
}

export function updateFreightTemplate(id, data) {
    return axios.post(`/mall/v1/order/admin/freight/template/update/${id}`, data)
}

export function deleteFreightTemplate(id) {
    return axios.post(`/mall/v1/order/admin/freight/template/delete/${id}`)
}

export function setDefaultFreightTemplate(id) {
    return axios.post(`/mall/v1/order/admin/freight/template/set-default/${id}`)
}

// ========== 地区规则管理 ==========

export function getRegionList(templateId) {
    return axios.get("/mall/v1/order/admin/freight/region/list", { params: { templateId } })
}

export function saveRegionList(data) {
    return axios.post("/mall/v1/order/admin/freight/region/save", data)
}
