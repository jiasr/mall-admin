<template>
    <div class="admin-layout">
        <!-- 顶部 Header -->
        <header class="admin-header">
            <f-header />
        </header>

        <!-- 下方：左侧菜单 + 右侧内容 -->
        <div class="admin-body">
            <aside class="admin-aside" :style="{ width: $store.state.asideWidth }">
                <f-menu></f-menu>
            </aside>
            <main class="admin-main">
                <router-view v-slot="{ Component }">
                    <transition name="fade">
                        <keep-alive :max="10">
                            <component :is="Component"></component>
                        </keep-alive>
                    </transition>
                </router-view>
            </main>
        </div>
    </div>
</template>

<script setup>
import FHeader from './components/FHeader.vue';
import FMenu from './components/FMenu.vue';
</script>

<style>
.admin-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
}

.admin-header {
    flex-shrink: 0;
    height: 60px;
}

.admin-body {
    display: flex;
    flex: 1;
    overflow: hidden;
}

.admin-aside {
    flex-shrink: 0;
    overflow-y: auto;
    overflow-x: hidden;
    border-right: 1px solid #e4e7ed;
    background: #f5f7fa;
    transition: width 0.2s;
}

.admin-aside::-webkit-scrollbar {
    width: 4px;
}

.admin-main {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 16px;
    background: #f0f2f5;
}

.fade-enter-from { opacity: 0; }
.fade-enter-to { opacity: 1; }
.fade-leave-from { opacity: 1; }
.fade-leave-to { opacity: 0; }
.fade-enter-active,
.fade-leave-active { transition: all .3s; }
.fade-enter-active { transition-delay: .3s; }
</style>
