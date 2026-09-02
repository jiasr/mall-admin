import axios from '~/axios'

// ==================== 角色管理 ====================

export function getRoleList() {
    return axios.post("/mall/v1/admin/role/list")
}

export function createRole(data) {
    return axios.post("/mall/v1/admin/role/create", data)
}

export function updateRole(data) {
    return axios.post("/mall/v1/admin/role/update", data)
}

export function deleteRole(id) {
    return axios.post("/mall/v1/admin/role/delete", { id })
}

// ==================== 角色菜单分配 ====================

export function getRoleMenus(role_id) {
    return axios.post("/mall/v1/admin/role/menus", { role_id })
}

export function setRoleMenus(role_id, menu_ids) {
    return axios.post("/mall/v1/admin/role/set_menus", { role_id, menu_ids })
}

// ==================== 菜单管理 ====================

export function getMenuList() {
    return axios.post("/mall/v1/admin/menu/list")
}

export function getMenuTree() {
    return axios.post("/mall/v1/admin/menu/tree")
}

export function createMenu(data) {
    return axios.post("/mall/v1/admin/menu/create", data)
}

export function updateMenu(data) {
    return axios.post("/mall/v1/admin/menu/update", data)
}

export function deleteMenu(id) {
    return axios.post("/mall/v1/admin/menu/delete", { id })
}

// 保存菜单拖拽排序（整树全量，items: [{id, parent_id, sort_order}]）
export function saveMenuSort(data) {
    return axios.post("/mall/v1/admin/menu/save_sort", data)
}

// ==================== 管理员用户管理 ====================

export function getAdminUserList() {
    return axios.post("/mall/v1/admin/user/list")
}

export function createAdminUser(data) {
    return axios.post("/mall/v1/admin/user/create", data)
}

export function updateAdminUser(data) {
    return axios.post("/mall/v1/admin/user/update", data)
}

export function deleteAdminUser(id) {
    return axios.post("/mall/v1/admin/user/delete", { id })
}
