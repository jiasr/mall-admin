import request from "~/axios";

// 获取公告列表
export function getNoticeList(params) {
    return request.get("/v1/notice/admin/list", { params });
}

// 新增公告
export function addNotice(data) {
    return request.post("/v1/notice/admin/add", data);
}

// 编辑公告
export function updateNotice(id, data) {
    return request.post(`/v1/notice/admin/update/${id}`, data);
}

// 删除公告
export function deleteNotice(id) {
    return request.post(`/v1/notice/admin/delete/${id}`);
}
