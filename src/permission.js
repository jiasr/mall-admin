import { router, addRoutes } from "~/router";
import { getToken } from "~/composables/auth";
import { toast, showFullLoading, hideFullLoading } from "~/composables/util";
import store from "./store";


// 全局前置守卫
let hasGetInfo = false;
router.beforeEach(async (to, from, next) => {
  // 显示loading
  showFullLoading();

  const token = getToken();

  // 没有登录，强制跳转回登录页
  if (!token && to.path != "/login") {
    toast("请先登录", "error");
    return next({ path: "/login" });
  }

  // 防止重复登录
  if (token && to.path == "/login") {
    toast("请勿重复登录", "error");
    return next({ path: from.path ? from.path : "/" });
  }

  // 如果用户登录了，自动获取用户信息，并存储在vuex当中
  let hasNewRoutes = false;
  if (token && !hasGetInfo) {
    let menus = [];
    try {
      const info = await store.dispatch("getinfo");
      menus = info.menus || [];
    } catch (e) {
      // getinfo 失败（如登录过期）时跳回登录页，避免路由初始化崩溃
      return next({ path: "/login" });
    }
    hasGetInfo = true;
    //动态添加路由
    hasNewRoutes = addRoutes(menus);

    // 加载站点配置（名称+logo）
    try {
      const { getSetting, getStorageSetting } = await import('~/api/setting')
      const [siteData, storageData] = await Promise.all([
        getSetting(),
        getStorageSetting(),
      ])
      if (siteData) {
        store.commit('SET_SITE_CONFIG', {
          site_name: siteData.site_name || '后台管理系统',
          logo: siteData.logo || '',
        })
      }
      // 存储图片基础URL，用于相对路径转完整URL
      if (storageData) {
        const baseUrl = storageData.public_endpoint || storageData.endpoint || ''
        if (baseUrl) {
          store.commit('SET_IMAGE_BASE_URL', baseUrl)
        }
      }
    } catch { /* 使用默认值 */ }
  }

  // 设置页面标题
  const siteName = store.state.siteConfig.site_name || '后台管理系统';
  let title = (to.meta.title ? to.meta.title : siteName) + "-" + siteName;
  document.title = title;

  hasNewRoutes ? next({ path: to.path, query: to.query, hash: to.hash, replace: true }) : next();
});

// 全局后置守卫
router.afterEach((to, from) => hideFullLoading());
