<template>
    <div class="f-menu" :style="{ width: $store.state.asideWidth }">
        <el-menu :default-active="defaultActive" unique-opened :collapse="isCollapse" default-active="2"
            class="border-0" @select="handleSelect" :collapse-transition="false">

            <template v-for="(item, index) in asideMenus" :key="index">
                <el-sub-menu v-if="item.child && item.child.length > 0" :index="item.name">
                    <template #title>
                        <el-icon>
                            <component :is="item.icon"></component>
                        </el-icon>
                        <span>{{ item.name }}</span>
                    </template>
                    <el-menu-item v-for="(item2, index2) in item.child" :key="index2" :index="item2.frontpath">
                        <el-icon>
                            <component :is="item2.icon"></component>
                        </el-icon>
                        <span>{{ item2.name }}</span>
                    </el-menu-item>
                </el-sub-menu>

                <el-menu-item v-else :index="item.frontpath">
                    <el-icon>
                        <component :is="item.icon"></component>
                    </el-icon>
                    <span>{{ item.name }}</span>
                </el-menu-item>
            </template>
        </el-menu>
    </div>
</template>
<script setup>
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useStore } from 'vuex';
const router = useRouter()
const store = useStore()
const route = useRoute()

// 默认选中
const defaultActive = ref(route.path)

// 是否折叠
const isCollapse = computed(() => !(store.state.asideWidth == '160px'))

// 侧边栏显示名映射：过长菜单名缩短展示，完整名通过 title 悬浮提示
const asideMenus = computed(() => {
    const menus = store.state.menus || []
    // 后端已按 sort_order 排序，前端直接使用
    return menus
})

const handleSelect = (e) => {
    router.push(e)
}
</script>
<style>
.f-menu {
    transition: all 0.3s;
    overflow-y: auto;
    overflow-x: hidden;
    @apply bg-light-50;
}

.f-menu::-webkit-scrollbar {
    width: 0px;
}
</style>