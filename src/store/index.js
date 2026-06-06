import { createStore } from "vuex";
import { login, getinfo } from "~/api/manager";
import { setToken, removeToken } from "~/composables/auth";
const store = createStore({
  state() {
    return {
      // 用户信息
      remoteurl : "http://localhost:8560",
      user: {},
      // 侧边宽度
      asideWidth: "250px",
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
      state.asideWidth = state.asideWidth == "250px" ? "64px" : "250px";
    },
    SET_MENUS(state, menu) {
      state.menus = menu;
    },
    SET_RULENAMES(state, ruleNames) {
      state.ruleNames = ruleNames;
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
            console.log(res);
            // 确保前端页面所需的菜单存在（若后端未返回则自动补上）
            const menus = res.menus || []
            const findMenu = (arr, path) => {
              for (const item of arr) {
                if (item.frontpath === path) return true
                if (item.child && item.child.length) {
                  if (findMenu(item.child, path)) return true
                }
              }
              return false
            }
            // 补上规格管理
            if (!findMenu(menus, '/spec/list')) {
              const goodsMenu = menus.find(m => m.name === '商品管理' || (m.child && m.child.some(c => c.name === '商品管理' || c.name === '商品列表')))
              if (goodsMenu && goodsMenu.child) {
                goodsMenu.child.push({
                  name: '规格管理',
                  frontpath: '/spec/list',
                  icon: 'Setting',
                })
              } else {
                menus.push({
                  name: '规格管理',
                  frontpath: '/spec/list',
                  icon: 'Setting',
                })
              }
            }
            // 补上优惠券管理
            if (!findMenu(menus, '/coupon/list')) {
              menus.push({
                name: '优惠券管理',
                frontpath: '/coupon/list',
                icon: 'Ticket',
              })
            }
            commit("SET_USERINFO", res);
            commit("SET_MENUS", menus);
            commit("SET_RULENAMES", res.ruleNames);
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

