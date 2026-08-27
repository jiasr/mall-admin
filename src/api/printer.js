import axios from '~/axios'

// ========== 小票机（云打印机）API ==========

// 支持的品牌列表（含表单字段定义）
export function getPrinterBrands() {
    return axios.get('/mall/v1/admin/printer/brands')
}

// 读取品牌配置
export function getPrinterConfig(brand) {
    return axios.get(`/mall/v1/admin/printer/${brand}`)
}

// 保存品牌配置（config + devices + enabled）
export function savePrinterConfig(brand, data) {
    return axios.post(`/mall/v1/admin/printer/${brand}`, data)
}

// 测试打印
export function testPrinter(brand, sn) {
    return axios.post(`/mall/v1/admin/printer/${brand}/test`, { sn })
}

// 打印订单小票（云打印，飞鹅设备出票；sn 不传时按配置策略选设备）
export function printTicket(orderNo, sn = '') {
    return axios.post('/mall/v1/admin/printer/feie/print', { orderNo, sn })
}
