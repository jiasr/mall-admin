# mall-admin 接口文档

> 前端项目：mall-admin  
> 后端地址：<addRess>  baseURL：`/api`（通过 Vite proxy 代理到 `http://localhost:8560`）  
> 认证方式：请求头携带 `token` 字段（从 Cookie 读取）

---

## 目录

- [接口规范](#接口规范)
- [管理员认证](#管理员认证)
- [后台仪表盘](#后台仪表盘)
- [商品管理](#商品管理)
- [分类管理](#分类管理)
- [规格管理](#规格管理)
- [优惠券管理](#优惠券管理)
- [团购管理](#团购管理)
- [订单管理](#订单管理)
- [用户管理](#用户管理)
- [分销员管理](#分销员管理)
- [公告管理](#公告管理)
- [后台设置](#后台设置)

---

## 接口规范

### 请求地址拼接规则

前端 axios 配置了 `baseURL: "/api"`，所有接口路径会自动拼接为：

```
/api + 接口路径
```

Vite 代理规则（`vite.config.js`）：

| 前端请求前缀 | 代理目标 | 重写规则 |
|-------------|----------|---------|
| `/api/admin` | `http://localhost:8560` | 去掉 `/api/admin` |
| `/api/mall` | `http://localhost:8560` | 去掉 `/api/mall` |

### 统一响应格式

后端返回两种格式，前端 axios 拦截器已做兼容处理：

**格式一（admin 接口）：**

```json
{
  "data": { ... }
}
```

**格式二（mall 接口）：**

```json
{
  "flag": true,
  "resData": { ... },
  "exceptionMsg": ""
}
```

---

## 管理员认证

### 登录

`POST /mall/v1/admin/login`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**响应数据：**

```json
{
  "token": "xxx"
}
```

---

### 获取当前登录用户信息（含菜单）

`POST /mall/v1/admin/getinfo`

**请求参数：** 无（token 从请求头自动携带）

**响应数据：**

```json
{
  "data": {
    "menus": [
      {
        "name": "商品管理",
        "frontpath": "/goods/list",
        "icon": "Goods",
        "child": [
          { "name": "分类管理", "frontpath": "/category/list", "icon": "List" }
        ]
      }
    ],
    "ruleNames": ["superadmin"],
    "username": "admin",
    ...
  }
}
```

---

### 退出登录

`POST /mall/v1/admin/logout`

---

### 修改密码

`POST /mall/v1/admin/updatepassword`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| oldpassword | string | 是 | 旧密码 |
| password | string | 是 | 新密码 |
| repassword | string | 是 | 确认新密码 |

---

## 后台仪表盘

### 获取统计数据

`GET /v1/admin/dashboard/stats`

**响应数据：**

```json
{
  "payOrderCount": 128,
  "orderCount": 256,
  "salesAmount": 12345600,
  "newUserCount": 35,
  "goodsCount": 520
}
```

> 金额单位：分（前端展示需 `/100` 转为元）

---

## 商品管理

### 获取商品列表

`GET /mall/v1/goods/list`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pageNum | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 10 |
| keyword | string | 否 | 搜索关键词 |
| categoryId | number | 否 | 分类 ID |
| isPutOnSale | number | 否 | 上架状态：1 上架，0 下架 |

**响应数据：**

```json
{
  "list": [
    {
      "spuId": "1001",
      "title": "商品标题",
      "thumb": "图片URL",
      "price": 299900,
      "originPrice": 399900,
      "isPutOnSale": 1,
      "soldNum": 100,
      "spuStockQuantity": 500
    }
  ],
  "totalCount": 100
}
```

---

### 获取商品详情

`GET /mall/v1/goods/detail?spuId=xxx`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| spuId | string | 是 | 商品 SPU ID |

---

### 新增商品

`POST /mall/v1/goods/admin/goods/add`

**请求参数：** 商品完整信息（JSON Body）

---

### 更新商品

`POST /mall/v1/goods/admin/goods/update/{spuId}`

**路径参数：** `spuId`  
**请求参数：** 商品完整信息（JSON Body）

---

### 删除商品

`POST /mall/v1/goods/admin/goods/delete/{spuId}`

**路径参数：** `spuId`

---

### 上架商品

`POST /mall/v1/goods/admin/goods/putOnSale/{spuId}`

**路径参数：** `spuId`

---

### 下架商品

`POST /mall/v1/goods/admin/goods/pullOffSale/{spuId}`

**路径参数：** `spuId`

---

## 分类管理

### 获取分类树

`GET /mall/v1/goodscatalog/tree`

**响应数据：**

```json
[
  {
    "id": 1,
    "name": "电子产品",
    "children": [
      { "id": 2, "name": "手机", "children": [] }
    ]
  }
]
```

---

### 新增分类

`POST /mall/v1/goodscatalog/add`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 分类名称 |
| parentId | number | 否 | 父分类 ID，顶级为 0 |

---

### 更新分类

`POST /mall/v1/goodscatalog/update/{id}`

**路径参数：** `id`  
**请求参数：** 同新增分类

---

### 删除分类

`POST /mall/v1/goodscatalog/delete/{id}`

**路径参数：** `id`

---

### 移动分类

`POST /mall/v1/goodscatalog/move`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 要移动的分类 ID |
| targetId | number | 是 | 目标父分类 ID |

---

## 规格管理

### 获取规格列表

`GET /v1/goods/admin/spec/list`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pageNum | number | 否 | 页码 |
| pageSize | number | 否 | 每页条数 |
| keyword | string | 否 | 搜索关键词 |

---

### 新增规格

`POST /v1/goods/admin/spec/add`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 规格名称 |
| value | string | 是 | 规格值（逗号分隔） |

---

### 更新规格

`POST /v1/goods/admin/spec/update/{id}`

**路径参数：** `id`

---

### 删除规格

`POST /v1/goods/admin/spec/delete/{id}`

**路径参数：** `id`

---

## 优惠券管理

### 获取优惠券列表

`GET /v1/coupon/admin/list`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pageNum | number | 否 | 页码 |
| pageSize | number | 否 | 每页条数 |
| keyword | string | 否 | 搜索关键词 |

---

### 新增优惠券

`POST /v1/coupon/admin/add`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 优惠券名称 |
| type | number | 是 | 类型：1 满减，2 折扣 |
| value | number | 是 | 优惠值（分） |
| minAmount | number | 否 | 最低消费金额（分） |
| total | number | 是 | 发放总量 |
| startTime | string | 是 | 开始时间 |
| endTime | string | 是 | 结束时间 |

---

### 更新优惠券

`POST /v1/coupon/admin/update/{id}`

**路径参数：** `id`

---

### 删除优惠券

`POST /v1/coupon/admin/delete/{id}`

**路径参数：** `id`

---

## 团购管理

### 获取团购活动列表

`GET /v1/groupon/admin/list`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pageNum | number | 否 | 页码 |
| pageSize | number | 否 | 每页条数 |
| status | number | 否 | 状态：0 未开始，1 进行中，2 已结束 |

---

### 获取团购活动详情

`GET /v1/groupon/admin/detail?id=xxx`

---

### 新增团购活动

`POST /v1/groupon/admin/add`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| goodsId | string | 是 | 关联商品 ID |
| grouponPrice | number | 是 | 团购价（分） |
| minNum | number | 是 | 成团最低人数 |
| maxNum | number | 否 | 成团最高人数 |
| startTime | string | 是 | 开始时间 |
| endTime | string | 是 | 结束时间 |

---

### 更新团购活动

`POST /v1/groupon/admin/update/{id}`

---

### 删除团购活动

`POST /v1/groupon/admin/delete/{id}`

---

### 结束团购活动（手动提前结束）

`POST /v1/groupon/admin/stop/{id}`

---

### 获取团购订单列表

`GET /v1/groupon/admin/order/list`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pageNum | number | 否 | 页码 |
| pageSize | number | 否 | 每页条数 |
| grouponId | number | 否 | 团购活动 ID |

---

### 获取团购详情（含参团用户）

`GET /v1/groupon/admin/group/detail?groupId=xxx`

---

## 订单管理

### 获取订单列表

`GET /v1/order/admin/list`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pageNum | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 10 |
| orderNo | string | 否 | 订单号模糊搜索 |
| consignee | string | 否 | 收货人姓名 |
| phone | string | 否 | 收货人手机号 |
| status | number | 否 | 订单状态 |

**订单状态枚举：**

| 值 | 说明 |
|----|------|
| -1 | 已取消 |
| 0 | 待付款 |
| 1 | 待发货 |
| 2 | 已发货 |
| 3 | 已签收 |
| 4 | 已完成 |

**响应数据：**

```json
{
  "list": [
    {
      "orderNo": "2024010112345",
      "consignee": "张三",
      "phone": "13800000000",
      "address": "收货地址",
      "totalAmount": 299900,
      "payAmount": 299900,
      "status": 1,
      "createTime": "2024-01-01 12:00:00",
      "orderItemList": [
        {
          "title": "商品名称",
          "image": "图片URL",
          "price": 299900,
          "num": 1,
          "specInfo": [{ "specValue": "红色" }]
        }
      ]
    }
  ],
  "totalCount": 50
}
```

---

### 获取订单详情

`GET /v1/order/admin/detail?orderNo=xxx`

**路径参数：** `orderNo`（通过 query 传递）

---

### 订单发货

`POST /v1/order/admin/process/{orderNo}`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| shippingCompany | string | 是 | 物流公司名称 |
| shippingNo | string | 是 | 物流单号 |

---

### 删除订单

`POST /v1/order/admin/delete/{orderNo}`

---

## 用户管理

### 获取用户列表

`GET /v1/user/admin/list`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pageNum | number | 否 | 页码 |
| pageSize | number | 否 | 每页条数 |
| nickname | string | 否 | 昵称模糊搜索 |
| phone | string | 否 | 手机号 |
| status | number | 否 | 状态：1 正常，0 禁用 |

**响应数据：**

```json
{
  "list": [
    {
      "id": 1,
      "nickname": "用户昵称",
      "phone": "13800000000",
      "email": "user@example.com",
      "sex": 1,
      "avatar": "头像URL",
      "status": 1,
      "createTime": "2024-01-01 12:00:00"
    }
  ],
  "totalCount": 100
}
```

---

### 获取用户详情

`GET /v1/user/admin/detail?id=xxx`

---

### 禁用/启用用户

`POST /v1/user/admin/status/{id}`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | number | 是 | 1 启用，0 禁用 |

---

### 删除用户

`POST /v1/user/admin/delete/{id}`

---

## 分销员管理

### 获取分销员列表

`GET /v1/agent/admin/list`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pageNum | number | 否 | 页码 |
| pageSize | number | 否 | 每页条数 |
| nickname | string | 否 | 昵称模糊搜索 |
| status | number | 否 | 状态：1 正常，0 禁用 |

**响应数据：**

```json
{
  "list": [
    {
      "id": 1,
      "nickname": "分销员昵称",
      "phone": "13800000000",
      "avatar": "头像URL",
      "subCount": 15,
      "totalCommission": 500000,
      "availableCommission": 200000,
      "withdrawnCommission": 300000,
      "status": 1,
      "createTime": "2024-01-01 12:00:00"
    }
  ],
  "totalCount": 20
}
```

> 佣金金额单位：分

---

### 获取分销员详情

`GET /v1/agent/admin/detail?id=xxx`

---

### 禁用/启用分销员

`POST /v1/agent/admin/status/{id}`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | number | 是 | 1 启用，0 禁用 |

---

### 删除分销员

`POST /v1/agent/admin/delete/{id}`

---

## 公告管理

### 获取公告列表

`GET /v1/notice/admin/list`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pageNum | number | 否 | 页码 |
| pageSize | number | 否 | 每页条数 |

---

### 新增公告

`POST /v1/notice/admin/add`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 公告标题 |
| content | string | 是 | 公告内容 |

---

### 编辑公告

`POST /v1/notice/admin/update/{id}`

---

### 删除公告

`POST /v1/notice/admin/delete/{id}`

---

## 后台设置

### 获取设置

`GET /v1/admin/setting/get`

**响应数据：**

```json
{
  "siteName": "商城名称",
  "logo": "Logo图片URL",
  "servicePhone": "400-000-0000",
  "serviceEmail": "service@example.com",
  "allowRegister": true,
  "registerNeedAudit": false,
  "enableDistribution": true
}
```

---

### 保存设置

`POST /v1/admin/setting/save`

**请求参数：** 同获取设置接口的响应字段
