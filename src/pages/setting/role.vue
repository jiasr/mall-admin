<template>
    <div class="role-page">
        <el-tabs v-model="activeTab" type="border-card" class="role-tabs">
            <!-- ==================== Tab 1: 角色管理 ==================== -->
            <el-tab-pane label="角色管理" name="role">
                <div class="toolbar">
                    <el-button type="primary" @click="openRoleDialog()">
                        <el-icon><Plus /></el-icon> 新增角色
                    </el-button>
                </div>
                <el-table :data="roleList" stripe size="default" v-loading="roleLoading" style="width: 100%"
                    :header-cell-style="{ background: '#f5f7fa', color: '#303133' }">
                    <el-table-column prop="id" label="ID" width="70" align="center" />
                    <el-table-column prop="name" label="角色名称" min-width="140">
                        <template #default="scope">
                            <span class="role-name-cell">{{ scope.row.name }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="description" label="描述" min-width="220" show-overflow-tooltip />
                    <el-table-column label="状态" width="90" align="center">
                        <template #default="scope">
                            <el-tag v-if="scope.row.status === 1" type="success" size="small" effect="plain">启用</el-tag>
                            <el-tag v-else type="danger" size="small" effect="plain">禁用</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="create_time" label="创建时间" width="170" align="center" />
                    <el-table-column label="操作" width="260" fixed="right" align="center">
                        <template #default="scope">
                            <el-button type="primary" size="small" link @click="openRoleMenuDialog(scope.row)">
                                <el-icon><Key /></el-icon> 权限
                            </el-button>
                            <el-button type="warning" size="small" link @click="openRoleDialog(scope.row)">
                                <el-icon><Edit /></el-icon> 编辑
                            </el-button>
                            <el-button
                                v-if="scope.row.id !== 1"
                                type="danger"
                                size="small"
                                link
                                @click="handleRoleDelete(scope.row)"
                            >
                                <el-icon><Delete /></el-icon> 删除
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-tab-pane>

            <!-- ==================== Tab 2: 菜单管理 ==================== -->
            <el-tab-pane label="菜单管理" name="menu">
                <div class="menu-layout">
                    <!-- 左侧：菜单树 -->
                    <div class="menu-tree-panel">
                        <div class="panel-header">
                            <span class="panel-title">菜单结构</span>
                            <el-button-group size="small">
                                <el-button type="primary" @click="openMenuDialog()">
                                    <el-icon><Plus /></el-icon> 顶级
                                </el-button>
                                <el-button @click="loadMenuData">
                                    <el-icon><Refresh /></el-icon>
                                </el-button>
                            </el-button-group>
                        </div>
                        <div class="panel-body">
                            <el-tree
                                :data="menuTreeData"
                                node-key="id"
                                default-expand-all
                                highlight-current
                                :props="{ label: 'name', children: 'children' }"
                                @node-click="handleMenuTreeNodeClick"
                            >
                                <template #default="{ node, data }">
                                    <div class="menu-tree-node">
                                        <span class="menu-tree-name">{{ data.name }}</span>
                                        <span class="menu-tree-path">{{ data.frontpath }}</span>
                                        <span class="menu-tree-actions" @click.stop>
                                            <el-button type="primary" size="small" link
                                                @click="openMenuDialog(data)">
                                                <el-icon><Plus /></el-icon>
                                            </el-button>
                                            <el-button type="warning" size="small" link
                                                @click="openMenuDialog(data, 'edit')">
                                                <el-icon><Edit /></el-icon>
                                            </el-button>
                                            <el-button type="danger" size="small" link
                                                @click="handleMenuDelete(data)">
                                                <el-icon><Delete /></el-icon>
                                            </el-button>
                                        </span>
                                    </div>
                                </template>
                            </el-tree>
                        </div>
                    </div>

                    <!-- 右侧：菜单详情 -->
                    <div class="menu-detail-panel">
                        <div class="panel-header">
                            <span class="panel-title">{{ selectedMenu ? '菜单详情' : '选择一个菜单查看详情' }}</span>
                        </div>
                        <div class="panel-body">
                            <template v-if="selectedMenu">
                                <el-descriptions :column="1" border size="small">
                                    <el-descriptions-item label="ID">{{ selectedMenu.id }}</el-descriptions-item>
                                    <el-descriptions-item label="菜单名称">{{ selectedMenu.name }}</el-descriptions-item>
                                    <el-descriptions-item label="路由路径">
                                        <el-tag size="small" type="info">{{ selectedMenu.frontpath || '(无)' }}</el-tag>
                                    </el-descriptions-item>
                                    <el-descriptions-item label="图标">{{ selectedMenu.icon || '(无)' }}</el-descriptions-item>
                                    <el-descriptions-item label="权限标识">
                                        <el-tag v-if="selectedMenu.permission" size="small" type="warning">{{ selectedMenu.permission }}</el-tag>
                                        <span v-else class="text-muted">(无)</span>
                                    </el-descriptions-item>
                                    <el-descriptions-item label="排序">{{ selectedMenu.sort_order }}</el-descriptions-item>
                                    <el-descriptions-item label="可见">
                                        <el-tag v-if="selectedMenu.visible === 1" size="small" type="success">是</el-tag>
                                        <el-tag v-else size="small" type="info">否</el-tag>
                                    </el-descriptions-item>
                                    <el-descriptions-item label="创建时间">{{ selectedMenu.create_time }}</el-descriptions-item>
                                </el-descriptions>
                                <div style="margin-top: 16px; display: flex; gap: 8px;">
                                    <el-button type="primary" size="small" @click="openMenuDialog(selectedMenu, 'edit')">
                                        <el-icon><Edit /></el-icon> 编辑
                                    </el-button>
                                    <el-button type="danger" size="small" @click="handleMenuDelete(selectedMenu)">
                                        <el-icon><Delete /></el-icon> 删除
                                    </el-button>
                                </div>
                            </template>
                            <el-empty v-else description="点击左侧菜单项查看详情" :image-size="80" />
                        </div>
                    </div>
                </div>
            </el-tab-pane>

            <!-- ==================== Tab 3: 管理员管理 ==================== -->
            <el-tab-pane label="管理员管理" name="user">
                <div class="toolbar">
                    <el-button type="primary" @click="openUserDialog()">
                        <el-icon><Plus /></el-icon> 新增管理员
                    </el-button>
                </div>
                <el-table :data="userList" stripe size="default" v-loading="userLoading" style="width: 100%"
                    :header-cell-style="{ background: '#f5f7fa', color: '#303133' }">
                    <el-table-column prop="id" label="ID" width="70" align="center" />
                    <el-table-column prop="username" label="用户名" min-width="130" />
                    <el-table-column label="所属角色" min-width="140" align="center">
                        <template #default="scope">
                            <el-tag v-if="scope.row.role_name" type="primary" size="small" effect="plain">
                                {{ scope.row.role_name }}
                            </el-tag>
                            <el-tag v-else type="info" size="small" effect="plain">未分配</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="状态" width="90" align="center">
                        <template #default="scope">
                            <el-tag v-if="scope.row.status === 1" type="success" size="small" effect="plain">启用</el-tag>
                            <el-tag v-else type="danger" size="small" effect="plain">禁用</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="create_time" label="创建时间" width="170" align="center" />
                    <el-table-column label="操作" width="200" fixed="right" align="center">
                        <template #default="scope">
                            <el-button type="warning" size="small" link @click="openUserDialog(scope.row)">
                                <el-icon><Edit /></el-icon> 编辑
                            </el-button>
                            <el-button
                                v-if="scope.row.id !== 1"
                                type="danger"
                                size="small"
                                link
                                @click="handleUserDelete(scope.row)"
                            >
                                <el-icon><Delete /></el-icon> 删除
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-tab-pane>
        </el-tabs>

        <!-- ==================== 角色新增/编辑弹窗 ==================== -->
        <el-dialog
            v-model="roleDialogVisible"
            :title="roleForm.id ? '编辑角色' : '新增角色'"
            width="460px"
            destroy-on-close
        >
            <el-form :model="roleForm" label-width="80px" label-position="top">
                <el-form-item label="角色名称" required>
                    <el-input v-model="roleForm.name" placeholder="请输入角色名称" maxlength="32" />
                </el-form-item>
                <el-form-item label="描述">
                    <el-input
                        v-model="roleForm.description"
                        type="textarea"
                        placeholder="请输入角色描述"
                        maxlength="200"
                        :rows="3"
                    />
                </el-form-item>
                <el-form-item v-if="roleForm.id && roleForm.id !== 1" label="状态">
                    <el-switch
                        v-model="roleForm.status"
                        :active-value="1"
                        :inactive-value="0"
                        active-text="启用"
                        inactive-text="禁用"
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="roleDialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="roleSubmitting" @click="handleRoleSave">确定</el-button>
            </template>
        </el-dialog>

        <!-- ==================== 角色权限分配弹窗 ==================== -->
        <el-dialog
            v-model="roleMenuDialogVisible"
            :title="'分配权限 — ' + currentRoleName"
            width="540px"
            destroy-on-close
        >
            <div class="perm-dialog-tip">
                <el-icon><InfoFilled /></el-icon>
                勾选菜单后，子菜单将自动选中；取消父菜单会同时取消所有子菜单。
            </div>
            <el-tree
                ref="menuTreeRef"
                :data="allMenus"
                show-checkbox
                node-key="id"
                :default-checked-keys="checkedMenuIds"
                :props="{ label: 'name', children: 'child' }"
                default-expand-all
                check-strictly
            />
            <template #footer>
                <el-button @click="roleMenuDialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="roleMenuSubmitting" @click="handleRoleMenuSave">保存权限</el-button>
            </template>
        </el-dialog>

        <!-- ==================== 菜单新增/编辑弹窗 ==================== -->
        <el-dialog
            v-model="menuDialogVisible"
            :title="menuFormTitle"
            width="480px"
            destroy-on-close
        >
            <el-form :model="menuForm" label-width="80px" label-position="top">
                <el-form-item label="菜单名称" required>
                    <el-input v-model="menuForm.name" placeholder="请输入菜单名称" maxlength="32" />
                </el-form-item>
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item label="路由路径">
                            <el-input v-model="menuForm.frontpath" placeholder="如 /goods/list" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="图标">
                            <el-input v-model="menuForm.icon" placeholder="Element Plus 图标名" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item label="权限标识">
                            <el-input v-model="menuForm.permission" placeholder="如 goods:add" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="排序号">
                            <el-input-number v-model="menuForm.sort_order" :min="0" :max="999" style="width: 100%" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item label="是否可见">
                    <el-switch
                        v-model="menuForm.visible"
                        :active-value="1"
                        :inactive-value="0"
                        active-text="可见"
                        inactive-text="隐藏"
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="menuDialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="menuSubmitting" @click="handleMenuSave">确定</el-button>
            </template>
        </el-dialog>

        <!-- ==================== 管理员新增/编辑弹窗 ==================== -->
        <el-dialog
            v-model="userDialogVisible"
            :title="userForm.id ? '编辑管理员' : '新增管理员'"
            width="460px"
            destroy-on-close
        >
            <el-form :model="userForm" label-width="80px" label-position="top">
                <el-form-item label="用户名" required>
                    <el-input v-model="userForm.username" placeholder="请输入用户名" maxlength="32" />
                </el-form-item>
                <el-form-item :label="userForm.id ? '新密码' : '密码'" :required="!userForm.id">
                    <el-input
                        v-model="userForm.password"
                        type="password"
                        show-password
                        :placeholder="userForm.id ? '留空则不修改' : '请输入密码'"
                        maxlength="32"
                    />
                </el-form-item>
                <el-form-item label="所属角色">
                    <el-select v-model="userForm.role_id" placeholder="请选择角色" clearable style="width: 100%">
                        <el-option
                            v-for="r in roleList"
                            :key="r.id"
                            :label="r.name"
                            :value="r.id"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item v-if="userForm.id && userForm.id !== 1" label="状态">
                    <el-switch
                        v-model="userForm.status"
                        :active-value="1"
                        :inactive-value="0"
                        active-text="启用"
                        inactive-text="禁用"
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="userDialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="userSubmitting" @click="handleUserSave">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { Plus, Edit, Delete, Key, Refresh, InfoFilled } from '@element-plus/icons-vue'
import {
    getRoleList, createRole, updateRole, deleteRole,
    getRoleMenus, setRoleMenus,
    getMenuList, getMenuTree, createMenu, updateMenu, deleteMenu,
    getAdminUserList, createAdminUser, updateAdminUser, deleteAdminUser,
} from '~/api/role'
import { toast, showModal } from '~/composables/util'

const activeTab = ref('role')

// ==================== 角色管理 ====================
const roleList = ref([])
const roleLoading = ref(false)

async function loadRoleList() {
    roleLoading.value = true
    try {
        const data = await getRoleList()
        roleList.value = data.list || []
    } catch (e) {
        console.error('加载角色列表失败', e)
    } finally {
        roleLoading.value = false
    }
}

const roleDialogVisible = ref(false)
const roleSubmitting = ref(false)
const roleForm = reactive({ id: null, name: '', description: '', status: 1 })

function openRoleDialog(row) {
    if (row) {
        roleForm.id = row.id
        roleForm.name = row.name
        roleForm.description = row.description
        roleForm.status = row.status
    } else {
        roleForm.id = null
        roleForm.name = ''
        roleForm.description = ''
        roleForm.status = 1
    }
    roleDialogVisible.value = true
}

async function handleRoleSave() {
    if (!roleForm.name.trim()) {
        toast('请输入角色名称', 'warning')
        return
    }
    roleSubmitting.value = true
    try {
        if (roleForm.id) {
            await updateRole({ id: roleForm.id, name: roleForm.name, description: roleForm.description, status: roleForm.status })
            toast('编辑成功', 'success')
        } else {
            await createRole({ name: roleForm.name, description: roleForm.description })
            toast('新增成功', 'success')
        }
        roleDialogVisible.value = false
        loadRoleList()
    } catch (e) {
        console.error('保存角色失败', e)
    } finally {
        roleSubmitting.value = false
    }
}

async function handleRoleDelete(row) {
    try {
        await showModal(`确定要删除角色"${row.name}"吗？`, 'error', '删除确认')
        await deleteRole(row.id)
        toast('删除成功', 'success')
        loadRoleList()
    } catch (e) {
        if (e !== 'cancel') console.error('删除角色失败', e)
    }
}

// ==================== 角色权限分配 ====================
const roleMenuDialogVisible = ref(false)
const roleMenuSubmitting = ref(false)
const currentRoleId = ref(null)
const currentRoleName = ref('')
const allMenus = ref([])
const checkedMenuIds = ref([])
const menuTreeRef = ref(null)

async function openRoleMenuDialog(row) {
    currentRoleId.value = row.id
    currentRoleName.value = row.name
    try {
        const [menuData, roleMenuData] = await Promise.all([
            getMenuTree(),
            getRoleMenus(row.id),
        ])
        allMenus.value = menuData.tree || []
        checkedMenuIds.value = roleMenuData.menu_ids || []
    } catch (e) {
        console.error('加载权限数据失败', e)
    }
    roleMenuDialogVisible.value = true
}

async function handleRoleMenuSave() {
    roleMenuSubmitting.value = true
    try {
        const checkedKeys = menuTreeRef.value.getCheckedKeys()
        const halfCheckedKeys = menuTreeRef.value.getHalfCheckedKeys()
        const allKeys = [...checkedKeys, ...halfCheckedKeys]
        await setRoleMenus(currentRoleId.value, allKeys)
        toast('权限保存成功', 'success')
        roleMenuDialogVisible.value = false
    } catch (e) {
        console.error('保存权限失败', e)
    } finally {
        roleMenuSubmitting.value = false
    }
}

// ==================== 菜单管理 ====================
const menuTreeData = ref([])
const menuLoading = ref(false)
const selectedMenu = ref(null)

async function loadMenuData() {
    menuLoading.value = true
    try {
        const data = await getMenuList()
        menuTreeData.value = buildMenuTree(data.list || [])
    } catch (e) {
        console.error('加载菜单失败', e)
    } finally {
        menuLoading.value = false
    }
}

function buildMenuTree(flatList) {
    const map = {}
    const roots = []
    flatList.forEach(item => {
        map[item.id] = { ...item, children: [] }
    })
    flatList.forEach(item => {
        if (item.parent_id === 0 || !map[item.parent_id]) {
            roots.push(map[item.id])
        } else {
            map[item.parent_id].children.push(map[item.id])
        }
    })
    // 按 sort_order 排序
    const sortTree = (nodes) => {
        nodes.sort((a, b) => a.sort_order - b.sort_order)
        nodes.forEach(n => { if (n.children.length) sortTree(n.children) })
    }
    sortTree(roots)
    return roots
}

function handleMenuTreeNodeClick(data) {
    selectedMenu.value = data
}

const menuDialogVisible = ref(false)
const menuSubmitting = ref(false)
const menuForm = reactive({
    id: null, name: '', frontpath: '', icon: '',
    parent_id: 0, sort_order: 0, permission: '', visible: 1,
})

const menuFormTitle = computed(() => {
    if (menuForm.id) return '编辑菜单'
    if (menuForm.parent_id > 0) return '新增子菜单'
    return '新增顶级菜单'
})

function openMenuDialog(row, mode) {
    if (row && mode === 'edit') {
        Object.assign(menuForm, {
            id: row.id, name: row.name, frontpath: row.frontpath,
            icon: row.icon, parent_id: row.parent_id, sort_order: row.sort_order,
            permission: row.permission, visible: row.visible,
        })
    } else if (row) {
        Object.assign(menuForm, {
            id: null, name: '', frontpath: '', icon: '',
            parent_id: row.id, sort_order: 0, permission: '', visible: 1,
        })
    } else {
        Object.assign(menuForm, {
            id: null, name: '', frontpath: '', icon: '',
            parent_id: 0, sort_order: 0, permission: '', visible: 1,
        })
    }
    menuDialogVisible.value = true
}

async function handleMenuSave() {
    if (!menuForm.name.trim()) {
        toast('请输入菜单名称', 'warning')
        return
    }
    menuSubmitting.value = true
    try {
        const payload = {
            name: menuForm.name, frontpath: menuForm.frontpath,
            icon: menuForm.icon, parent_id: menuForm.parent_id,
            sort_order: menuForm.sort_order, permission: menuForm.permission,
            visible: menuForm.visible,
        }
        if (menuForm.id) {
            payload.id = menuForm.id
            await updateMenu(payload)
            toast('编辑成功', 'success')
        } else {
            await createMenu(payload)
            toast('新增成功', 'success')
        }
        menuDialogVisible.value = false
        selectedMenu.value = null
        loadMenuData()
    } catch (e) {
        console.error('保存菜单失败', e)
    } finally {
        menuSubmitting.value = false
    }
}

async function handleMenuDelete(row) {
    try {
        await showModal('确定要删除该菜单吗？子菜单也会一并删除！', 'error', '删除确认')
        await deleteMenu(row.id)
        toast('删除成功', 'success')
        if (selectedMenu.value && selectedMenu.value.id === row.id) {
            selectedMenu.value = null
        }
        loadMenuData()
    } catch (e) {
        if (e !== 'cancel') console.error('删除菜单失败', e)
    }
}

// ==================== 管理员管理 ====================
const userList = ref([])
const userLoading = ref(false)

async function loadUserList() {
    userLoading.value = true
    try {
        const data = await getAdminUserList()
        userList.value = data.list || []
    } catch (e) {
        console.error('加载管理员列表失败', e)
    } finally {
        userLoading.value = false
    }
}

const userDialogVisible = ref(false)
const userSubmitting = ref(false)
const userForm = reactive({
    id: null, username: '', password: '', role_id: null, status: 1,
})

function openUserDialog(row) {
    if (row) {
        Object.assign(userForm, {
            id: row.id, username: row.username, password: '',
            role_id: row.role_id, status: row.status,
        })
    } else {
        Object.assign(userForm, {
            id: null, username: '', password: '', role_id: null, status: 1,
        })
    }
    userDialogVisible.value = true
}

async function handleUserSave() {
    if (!userForm.username.trim()) {
        toast('请输入用户名', 'warning')
        return
    }
    if (!userForm.id && !userForm.password) {
        toast('请输入密码', 'warning')
        return
    }
    userSubmitting.value = true
    try {
        if (userForm.id) {
            const data = { id: userForm.id, username: userForm.username, role_id: userForm.role_id, status: userForm.status }
            if (userForm.password) data.password = userForm.password
            await updateAdminUser(data)
            toast('编辑成功', 'success')
        } else {
            await createAdminUser({
                username: userForm.username, password: userForm.password,
                role_id: userForm.role_id, status: userForm.status,
            })
            toast('新增成功', 'success')
        }
        userDialogVisible.value = false
        loadUserList()
    } catch (e) {
        console.error('保存管理员失败', e)
    } finally {
        userSubmitting.value = false
    }
}

async function handleUserDelete(row) {
    try {
        await showModal(`确定要删除管理员"${row.username}"吗？`, 'error', '删除确认')
        await deleteAdminUser(row.id)
        toast('删除成功', 'success')
        loadUserList()
    } catch (e) {
        if (e !== 'cancel') console.error('删除管理员失败', e)
    }
}

// 切换 Tab 时自动加载数据
watch(activeTab, (name) => {
    if (name === 'role') loadRoleList()
    else if (name === 'menu') loadMenuData()
    else if (name === 'user') {
        loadUserList()
        loadRoleList()
    }
})

onMounted(() => {
    loadRoleList()
})
</script>

<style scoped>
.role-page {
    height: calc(100vh - 100px);
    min-height: 500px;
}

.role-tabs {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.role-tabs :deep(.el-tabs__content) {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
}

.toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
}

.role-name-cell {
    font-weight: 500;
    color: #303133;
}

/* ========== 菜单管理：左右分栏 ========== */
.menu-layout {
    display: flex;
    gap: 20px;
    height: 100%;
    min-height: 420px;
}

.menu-tree-panel {
    width: 380px;
    flex-shrink: 0;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.menu-detail-panel {
    flex: 1;
    min-width: 0;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background: #f5f7fa;
    border-bottom: 1px solid #e4e7ed;
}

.panel-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
}

.panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
}

/* 菜单树节点 */
.menu-tree-node {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding-right: 8px;
    gap: 12px;
}

.menu-tree-name {
    font-weight: 500;
    white-space: nowrap;
}

.menu-tree-path {
    color: #909399;
    font-size: 12px;
    font-family: monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
}

.menu-tree-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 0.2s;
}

.menu-tree-node:hover .menu-tree-actions {
    opacity: 1;
}

.text-muted {
    color: #c0c4cc;
    font-size: 13px;
}

/* 权限分配提示 */
.perm-dialog-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    margin-bottom: 12px;
    background: #ecf5ff;
    border: 1px solid #d9ecff;
    border-radius: 4px;
    font-size: 13px;
    color: #409eff;
}

/* ========== 树形控件美化 ========== */
:deep(.el-tree) {
    font-size: 14px;
}

:deep(.el-tree-node__content) {
    height: 36px;
    border-radius: 4px;
}

:deep(.el-tree-node__content:hover) {
    background-color: #f0f2f5;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
    background-color: #ecf5ff;
}
</style>
