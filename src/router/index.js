import { createRouter, createWebHashHistory } from "vue-router";

import Admin from "~/layouts/admin.vue";
import Index from "~/pages/index.vue";
import Login from "~/pages/login.vue";
import NotFound from "~/pages/404.vue";
import GoodList from "~/pages/goods/list.vue";
import GoodsAdd from "~/pages/goods/add.vue";
import CategoryList from "~/pages/category/list.vue";
import SpecList from "~/pages/spec/list.vue";
import CouponList from "~/pages/coupon/list.vue";
import GrouponList from "~/pages/groupon/list.vue";
import GrouponAdd from "~/pages/groupon/add.vue";
import GrouponOrder from "~/pages/groupon/order.vue";
import OrderList from "~/pages/order/list.vue";
import UserList from "~/pages/user/list.vue";
import AgentList from "~/pages/agent/list.vue";
import SettingBase from "~/pages/setting/base.vue";
import UserList from "~/pages/user/list.vue";

/* const routes = [
    {
        path:"/",
        component:Admin,
        // 子路由
        children:[]
    },
{
    path:"/login",
    component:Login,
    meta:{
        title:"登录页"
    }
},{
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
}] */

//默认路由,所有用户共享
const routes = [
  {
    path: "/",
    name: "admin",
    component: Admin,
  },
  {
    path: "/login",
    component: Login,
    meta: {
      title: "登录页",
    },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: NotFound,
  },
];

//动态匹配添加路由
const asyncRoutes = [
  {
    path: "/",
    name: "/",
    component: Index,
    meta: {
      title: "后台首页",
    },
  },
  {
    path: "/goods/list",
    name: "/goods/list",
    component: GoodList,
    meta: {
      title: "商品管理",
    },
  },
  {
    path: "/goods/add",
    name: "/goods/add",
    component: GoodsAdd,
    meta: {
      title: "添加商品",
    },
  },
  {
    path: "/category/list",
    name: "/category/list",
    component: CategoryList,
    meta: {
      title: "分类列表",
    },
  },
  {
    path: "/spec/list",
    name: "/spec/list",
    component: SpecList,
    meta: {
      title: "规格管理",
    },
  },
  {
    path: "/coupon/list",
    name: "/coupon/list",
    component: CouponList,
    meta: {
      title: "优惠券管理",
    },
  },
  {
    path: "/groupon/list",
    name: "/groupon/list",
    component: GrouponList,
    meta: {
      title: "团购管理",
    },
  },
  {
    path: "/groupon/add",
    name: "/groupon/add",
    component: GrouponAdd,
    meta: {
      title: "添加团购",
    },
  },
  {
    path: "/groupon/order",
    name: "/groupon/order",
    component: GrouponOrder,
    meta: {
      title: "团购订单",
    },
  },
  {
    path: "/order/list",
    name: "/order/list",
    component: OrderList,
    meta: {
      title: "订单管理",
    },
  },
  {
    path: "/user/list",
    name: "/user/list",
    component: UserList,
    meta: {
      title: "用户管理",
    },
  },
  {
    path: "/agent/list",
    name: "/agent/list",
    component: AgentList,
    meta: {
      title: "分销员管理",
    },
  },
  {
    path: "/setting/base",
    name: "/setting/base",
    component: SettingBase,
    meta: {
      title: "基础设置",
    },
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

//动态添加路由方法
export function addRoutes(menus) {
  //是否有新的路由
  let hasNewRoutes = false;
  const findAndAddRoutesByMenus = (arr) => {
    arr.forEach((e) => {
      let item = asyncRoutes.find((o) => o.path == e.frontpath);
      if (item && !router.hasRoute(item.path)) {
        router.addRoute("admin", item);
        hasNewRoutes = true;
      }
      //子路由
      if (e.child && e.child.length > 0) {
        findAndAddRoutesByMenus(e.child);
      }
    });
  };
  findAndAddRoutesByMenus(menus)

  // 注册所有 asyncRoutes（包括后端菜单中没有的，如 /goods/add）
  // 这样通过 $router.push 导航到的页面也能正常访问
  asyncRoutes.forEach((item) => {
    if (!router.hasRoute(item.path)) {
      router.addRoute("admin", item);
      hasNewRoutes = true;
    }
  });

  // console.log("获取路由",router.getRoutes());
  return hasNewRoutes;
}
