import { createStore } from "vuex";
import { login, getinfo } from "~/api/manager";
import { setToken, removeToken } from "~/composables/auth";
const store = createStore({
  state() {
    return {
      // 用户信息
      user: {},
      // 侧边宽度
      asideWidth: "160px",
      siteConfig: { site_name: '后台管理系统', logo: '' },
      imageBaseUrl: '',
      menus: [],
      ruleNames: [],
    };
  },
  mutations: {
    // 记录用户信息
    SET_USERINFO(state, user) {
      state.user = user;
    },
    // 展开/缩起侧边
    handleAsideWidth(state) {
      state.asideWidth = state.asideWidth == "160px" ? "64px" : "160px";
    },
    SET_MENUS(state, menu) {
      state.menus = menu;
    },
    SET_RULENAMES(state, ruleNames) {
      state.ruleNames = ruleNames;
    },
    SET_SITE_CONFIG(state, config) {
      state.siteConfig = config;
    },
    SET_IMAGE_BASE_URL(state, url) {
      state.imageBaseUrl = url;
    },
  },
  actions: {
    // 登录
    login({ commit }, { username, password }) {
      return new Promise((resolve, reject) => {
        login(username, password)
          .then((res) => {
            setToken(res.token);

            resolve(res);
          })
          .catch((err) => reject(err));
      });
    },
    // 获取当前登录用户信息
    getinfo({ commit }) {
      return new Promise((resolve, reject) => {
        getinfo()
          .then((res) => {
            const menus = res.menus || []
            commit("SET_USERINFO", res);
            commit("SET_MENUS", menus);
            commit("SET_RULENAMES", res.ruleNames || []);
            resolve(res);
          })
          .catch((err) => reject(err));
      });
    },
    // 退出登录
    logout({ commit }) {
      // 移除cookie里的token
      removeToken();
      // 清除当前用户状态 vuex
      commit("SET_USERINFO", {});
    },
  },
});

//const  test = "这是一个test文本"
export default store;

