<template>
  <div class="menu-management-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">{{ t("menu.title") }}</span>
          <div class="actions">
            <el-button
              type="primary"
              @click="handleCreateMenu"
              v-perms="['super_admin']"
            >
              {{ t("menu.create") }}
            </el-button>
            <el-button @click="handleImportMenus" v-perms="['super_admin']">
              {{ t("menu.import") }}
            </el-button>
            <el-button @click="handleExportMenus" v-perms="['super_admin']">
              {{ t("menu.export") }}
            </el-button>
            <el-button
              @click="handleBatchDelete"
              :disabled="selectedMenus.length === 0"
              v-perms="['super_admin']"
            >
              {{ t("menu.batchDelete") }}
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索区域 -->
      <div class="search-container">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-input
              v-model="searchForm.search"
              :placeholder="t('menu.search')"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #suffix>
                <el-icon @click="handleSearch">
                  <Search />
                </el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="6">
            <el-select
              v-model="searchForm.is_active"
              clearable
              :placeholder="t('menu.isActive')"
              @change="handleSearch"
            >
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select
              v-model="searchForm.parent_id"
              clearable
              filterable
              :placeholder="t('menu.parentId')"
              @change="handleSearch"
            >
              <el-option label="顶级菜单" :value="0" />
              <el-option
                v-for="item in menuOptions"
                :key="item.id"
                :label="item.title || item.name"
                :value="item.id"
              />
            </el-select>
          </el-col>
          <el-col :span="6">
            <div class="search-buttons">
              <el-button type="primary" @click="handleSearch">
                {{ t("menu.search") }}
              </el-button>
              <el-button @click="resetSearch">{{
                t("menu.refresh")
              }}</el-button>
              <el-button type="text" @click="toggleDisplayMode">
                {{ isTreeMode ? t("menu.allMenus") : t("menu.menuTree") }}
              </el-button>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 表格区域 -->
      <div v-loading="tableLoading" class="table-container">
        <el-table
          v-if="!isTreeMode"
          ref="tableRef"
          :data="menuList"
          row-key="id"
          border
          highlight-current-row
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column
            prop="id"
            :label="t('menu.id')"
            width="80"
            sortable
          />
          <el-table-column :label="t('menu.name')" min-width="150">
            <template #default="{ row }">
              <div class="menu-name">
                <el-icon v-if="row.icon" class="menu-icon">
                  <component :is="row.icon" />
                </el-icon>
                <span>{{ row.title || row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="path"
            :label="t('menu.path')"
            min-width="150"
          />
          <el-table-column
            prop="component"
            :label="t('menu.component')"
            min-width="180"
          />
          <el-table-column prop="code" :label="t('menu.code')" width="120" />
          <el-table-column
            prop="rank"
            :label="t('menu.rank')"
            width="80"
            sortable
          />
          <el-table-column :label="t('menu.isActive')" width="100">
            <template #default="{ row }">
              <el-tag :type="row.is_active ? 'success' : 'info'">
                {{
                  row.is_active
                    ? t("menu.statusActive")
                    : t("menu.statusInactive")
                }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('menu.actions')" width="220" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                @click="handleEditMenu(row)"
                v-perms="['super_admin']"
              >
                {{ t("menu.editBtn") }}
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click="handleDeleteMenu(row)"
                v-perms="['super_admin']"
              >
                {{ t("menu.delete") }}
              </el-button>
              <el-button
                type="warning"
                size="small"
                @click="handleToggleStatus(row)"
                v-perms="['super_admin']"
              >
                {{ row.is_active ? t("menu.deactivate") : t("menu.activate") }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-tree
          v-else
          ref="treeRef"
          :data="menuTree"
          node-key="id"
          highlight-current
          default-expand-all
          :props="{
            label: node => node.title || node.name,
            children: 'children'
          }"
          draggable
          @node-drag-end="handleDragEnd"
        >
          <template #default="{ node, data }">
            <div class="menu-tree-node">
              <div class="menu-info">
                <el-icon v-if="data.icon" class="menu-icon">
                  <component :is="data.icon" />
                </el-icon>
                <span class="menu-title">{{ data.title || data.name }}</span>
                <span class="menu-path">({{ data.path }})</span>
                <el-tag size="small" v-if="data.redirect">
                  {{ t("menu.redirect") }}: {{ data.redirect }}
                </el-tag>
                <el-tag
                  size="small"
                  :type="data.is_active ? 'success' : 'info'"
                  class="menu-status"
                >
                  {{
                    data.is_active
                      ? t("menu.statusActive")
                      : t("menu.statusInactive")
                  }}
                </el-tag>
              </div>
              <div class="node-actions">
                <el-button
                  type="primary"
                  size="small"
                  @click.stop="handleEditMenu(data)"
                  v-perms="['super_admin']"
                >
                  {{ t("menu.editBtn") }}
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click.stop="handleDeleteMenu(data)"
                  v-perms="['super_admin']"
                >
                  {{ t("menu.delete") }}
                </el-button>
                <el-button
                  type="success"
                  size="small"
                  @click.stop="handleAddChildMenu(data)"
                  v-perms="['super_admin']"
                >
                  {{ t("menu.addChildMenu") }}
                </el-button>
              </div>
            </div>
          </template>
        </el-tree>
      </div>

      <!-- 分页控件 -->
      <div class="pagination-container" v-if="!isTreeMode">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 确认对话框 -->
    <confirm-dialog
      v-model:visible="confirmDialog.visible"
      :title="confirmDialog.title"
      :content="confirmDialog.content"
      :type="confirmDialog.type"
      :loading="confirmDialog.loading"
      :confirm-button-text="
        confirmDialog.confirmButtonText || t('buttons.pureConfirm')
      "
      @confirm="handleConfirmDialogConfirm"
      @cancel="handleConfirmDialogCancel"
    />

    <!-- 级联删除确认对话框 -->
    <confirm-dialog
      v-model:visible="cascadeDialog.visible"
      :title="cascadeDialog.title"
      :content="cascadeDialog.content"
      :type="cascadeDialog.type"
      :loading="cascadeDialog.loading"
      confirm-button-text="是"
      @confirm="handleCascadeDialogConfirm"
      @cancel="handleCascadeDialogCancel"
    />

    <!-- 创建菜单对话框 -->
    <el-dialog
      v-model="createMenuDialog.visible"
      :title="t('menu.createMenu')"
      width="80%"
      :close-on-click-modal="false"
      :close-on-press-escape="!createMenuDialog.loading"
      :show-close="!createMenuDialog.loading"
    >
      <menu-form
        :loading="createMenuDialog.loading"
        mode="create"
        :parent-id="parentMenuId"
        @submit="handleCreateSubmit"
        @cancel="handleCreateCancel"
      />
    </el-dialog>

    <!-- 编辑菜单对话框 -->
    <el-dialog
      v-model="editMenuDialog.visible"
      :title="t('menu.editMenu')"
      width="80%"
      :close-on-click-modal="false"
      :close-on-press-escape="!editMenuDialog.loading"
      :show-close="!editMenuDialog.loading"
    >
      <menu-form
        :menu="editMenuDialog.currentMenu"
        :loading="editMenuDialog.loading"
        mode="edit"
        @submit="handleEditSubmit"
        @cancel="handleEditCancel"
      />
    </el-dialog>

    <!-- 导入配置对话框 -->
    <el-dialog
      v-model="importDialog.visible"
      :title="t('menu.import')"
      width="30%"
      :close-on-click-modal="false"
      :close-on-press-escape="!importDialog.loading"
      :show-close="!importDialog.loading"
    >
      <div class="import-container">
        <el-upload
          class="upload-area"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          :limit="1"
          accept=".json"
        >
          <el-icon class="el-icon--upload">
            <UploadFilled />
          </el-icon>
          <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">仅支持上传JSON格式的菜单配置文件</div>
          </template>
        </el-upload>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button
            @click="importDialog.visible = false"
            :disabled="importDialog.loading"
          >
            {{ t("menu.cancel") }}
          </el-button>
          <el-button
            type="primary"
            @click="submitImport"
            :disabled="!importDialog.file"
            :loading="importDialog.loading"
          >
            {{ t("menu.import") }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useMenuStoreHook } from "@/store/modules/menu";
import type {
  Menu,
  MenuListParams,
  MenuCreateUpdateParams
} from "@/types/menu";
import ConfirmDialog from "@/components/MenuManagement/ConfirmDialog.vue";
import MenuForm from "@/components/MenuManagement/MenuForm.vue";
import { useUserStoreHook } from "@/store/modules/user";
import logger from "@/utils/logger";
import { Search, UploadFilled } from "@element-plus/icons-vue";

const { t } = useI18n();
const router = useRouter();
const menuStore = useMenuStoreHook();
const userStore = useUserStoreHook();

// 检查用户是否有超级管理员权限
const isSuperAdmin = computed(() => userStore.is_super_admin);

// 如果不是超级管理员，显示无权限提示
if (!isSuperAdmin.value) {
  ElMessage.error("无权限访问此页面");
  router.push("/dashboard");
}

// 表格加载状态
const tableLoading = computed(() => menuStore.loading.list);
// 表格数据
const menuList = computed(() => menuStore.menuList.data);
// 菜单树数据
const menuTree = computed(() => menuStore.menuTree);
// 菜单选项
const menuOptions = computed(() => menuStore.menuList.data);
// 是否树形显示模式
const isTreeMode = ref(false);
// 选中的菜单项
const selectedMenus = ref<Menu[]>([]);
// 树形结构引用
const treeRef = ref(null);

// 分页信息
const pagination = reactive({
  total: computed(() => menuStore.menuList.total),
  currentPage: 1,
  pageSize: 10
});

// 搜索条件
const searchForm = reactive({
  search: "",
  is_active: "all",
  parent_id: undefined
});

// 状态选项
const statusOptions = [
  {
    value: "all",
    label: t("menu.statusAll")
  },
  {
    value: "true",
    label: t("menu.statusActive")
  },
  {
    value: "false",
    label: t("menu.statusInactive")
  }
];

// 状态标签类型映射
const statusTagType = (isActive: boolean) => {
  return isActive ? "success" : "danger";
};

// 确认对话框相关状态
const confirmDialog = reactive({
  visible: false,
  title: "",
  content: "",
  type: "warning" as "warning" | "danger" | "info",
  loading: false,
  confirmButtonText: "",
  confirmCallback: null as (() => void) | null
});

// 级联删除确认对话框
const cascadeDialog = reactive({
  visible: false,
  title: "",
  content: "",
  type: "warning" as "warning" | "danger" | "info",
  loading: false,
  confirmCallback: null as (() => void) | null
});

// 导入对话框相关状态
const importDialog = reactive({
  visible: false,
  loading: false,
  file: null as File | null
});

// 父菜单ID引用
const parentMenuId = ref<number | null>(null);

// 处理表格选择变化
const handleSelectionChange = (selection: Menu[]) => {
  selectedMenus.value = selection;
};

// 打开确认对话框
const openConfirmDialog = (
  title: string,
  content: string,
  type: "warning" | "danger" | "info",
  callback: () => void,
  confirmButtonText?: string
) => {
  confirmDialog.visible = true;
  confirmDialog.title = title;
  confirmDialog.content = content;
  confirmDialog.type = type;
  confirmDialog.confirmCallback = callback;
  confirmDialog.confirmButtonText =
    confirmButtonText || t("buttons.pureConfirm");
};

// 确认对话框确认按钮点击
const handleConfirmDialogConfirm = async () => {
  confirmDialog.loading = true;
  try {
    if (confirmDialog.confirmCallback) {
      await confirmDialog.confirmCallback();
    }
  } finally {
    confirmDialog.loading = false;
    confirmDialog.visible = false;
  }
};

// 关闭确认对话框
const handleConfirmDialogCancel = () => {
  confirmDialog.visible = false;
};

// 处理级联确认对话框确认
const handleCascadeDialogConfirm = async () => {
  cascadeDialog.loading = true;
  try {
    if (cascadeDialog.confirmCallback) {
      await cascadeDialog.confirmCallback();
    }
  } finally {
    cascadeDialog.loading = false;
    cascadeDialog.visible = false;
  }
};

// 处理级联确认对话框取消
const handleCascadeDialogCancel = () => {
  cascadeDialog.visible = false;
};

// 创建菜单对话框相关状态
const createMenuDialog = reactive({
  visible: false,
  loading: false
});

// 编辑菜单对话框相关状态
const editMenuDialog = reactive({
  visible: false,
  loading: false,
  currentMenu: null as Menu | null
});

// 切换显示模式
const toggleDisplayMode = () => {
  isTreeMode.value = !isTreeMode.value;
  if (isTreeMode.value) {
    menuStore.fetchMenuTree();
  } else {
    fetchMenuList();
  }
};

// 创建菜单
const handleCreateMenu = () => {
  // 重置表单内容
  resetCreateForm();
  createMenuDialog.visible = true;
};

// 处理导入菜单
const handleImportMenus = () => {
  importDialog.visible = true;
  importDialog.file = null;
};

// 处理导出菜单
const handleExportMenus = async () => {
  try {
    await menuStore.exportMenusAction();
    ElMessage.success(t("menu.exportSuccess"));
  } catch (error) {
    logger.error("导出菜单失败", error);
    ElMessage.error(t("menu.exportFailed"));
  }
};

// 批量删除菜单
const handleBatchDelete = () => {
  if (selectedMenus.value.length === 0) {
    ElMessage.warning(t("menu.selectMenusFirst"));
    return;
  }

  const ids = selectedMenus.value.map(menu => menu.id);
  openConfirmDialog(
    t("menu.confirmBatchDelete"),
    t("menu.confirmBatchDeleteMessage", { count: ids.length }),
    "danger",
    async () => {
      try {
        await menuStore.batchRemoveMenus(ids);
        ElMessage.success(t("menu.batchDeleteSuccess"));

        // 清空选中项
        selectedMenus.value = [];

        // 根据当前模式选择性刷新
        if (isTreeMode.value) {
          // 树形模式下，store中已经更新了树形结构，无需额外刷新
          // 由于移除了节点，可能需要重新计算树的展开状态
          nextTick(() => {
            if (treeRef.value) {
              // 可选：更新树的一些状态
            }
          });
        } else {
          // 列表模式下，只刷新当前页的列表
          await fetchMenuList();
        }
      } catch (error) {
        logger.error("批量删除菜单失败", error);
        ElMessage.error(t("menu.batchDeleteFailed"));
      }
    }
  );
};

// 处理添加子菜单
const handleAddChildMenu = (parentMenu: Menu) => {
  // 先重置表单内容
  resetCreateForm();
  // 设置父菜单ID
  parentMenuId.value = parentMenu.id;
  // 打开创建菜单对话框
  createMenuDialog.visible = true;
};

// 重置创建表单内容
const resetCreateForm = () => {
  // 重置父菜单ID
  parentMenuId.value = null;
  // 如果需要，可以在这里添加其他重置逻辑
};

// 处理文件上传变化
const handleFileChange = (file: any) => {
  importDialog.file = file.raw;
};

// 提交导入
const submitImport = async () => {
  if (!importDialog.file) return;

  importDialog.loading = true;
  try {
    // 实现导入逻辑
    const reader = new FileReader();
    reader.onload = async e => {
      try {
        if (e.target?.result) {
          const config = JSON.parse(e.target.result as string);
          await menuStore.importMenusAction(importDialog.file as File);
          ElMessage.success(t("menu.importSuccess"));
          importDialog.visible = false;
          fetchMenuList();
        }
      } catch (error) {
        logger.error("解析导入文件失败", error);
        ElMessage.error(t("menu.importFailed"));
      } finally {
        importDialog.loading = false;
      }
    };
    reader.readAsText(importDialog.file);
  } catch (error) {
    logger.error("导入菜单失败", error);
    ElMessage.error(t("menu.importFailed"));
    importDialog.loading = false;
  }
};

// 处理树节点拖动结束
const handleDragEnd = async (
  draggingNode: any,
  dropNode: any,
  dropType: string
) => {
  try {
    // 实现拖动排序逻辑
    const data = {
      drag_id: draggingNode.data.id,
      drop_id: dropNode?.data?.id,
      position: dropType
    };
    await menuStore.updateMenuAction(draggingNode.data.id, {
      ...draggingNode.data,
      parent_id:
        dropType === "inner" ? dropNode?.data?.id : dropNode?.data?.parent_id
    });
    ElMessage.success(t("menu.orderUpdateSuccess"));
  } catch (error) {
    logger.error("更新菜单顺序失败", error);
    ElMessage.error(t("menu.orderUpdateFailed"));
    // 刷新树形数据
    menuStore.fetchMenuTree();
  }
};

// 提交菜单创建表单
const handleCreateSubmit = async (formData: MenuCreateUpdateParams) => {
  createMenuDialog.loading = true;
  try {
    // 如果是添加子菜单，设置父菜单ID
    if (parentMenuId.value !== null) {
      formData.parent_id = parentMenuId.value;
    }

    await menuStore.createMenuAction(formData);
    ElMessage.success(t("menu.createSuccess"));

    // 重置父菜单ID
    parentMenuId.value = null;

    // 根据当前模式选择性刷新
    if (isTreeMode.value) {
      // 树形模式下，刷新树形结构
      await menuStore.fetchMenuTree();
    } else {
      // 列表模式下，刷新列表
      await fetchMenuList();
    }
  } catch (error) {
    logger.error("创建菜单失败", error);
    ElMessage.error(t("menu.createFailed"));
  } finally {
    createMenuDialog.loading = false;
    // 重置loading状态后再关闭对话框
    createMenuDialog.visible = false;
  }
};

// 取消创建菜单
const handleCreateCancel = () => {
  createMenuDialog.visible = false;
  // 重置父菜单ID
  parentMenuId.value = null;
};

// 编辑菜单
const handleEditMenu = async (menu: Menu) => {
  editMenuDialog.loading = true;
  try {
    // 先获取菜单详情，再打开对话框
    await menuStore.fetchMenuDetail(menu.id);

    // 确保菜单详情中包含code字段
    if (!menuStore.currentMenu?.code) {
      logger.warn("菜单详情中缺少code字段，尝试使用原始菜单数据", menu);
      // 如果API返回的菜单详情中没有code字段，则使用传入的菜单数据
      if (menu.code && menuStore.currentMenu) {
        menuStore.currentMenu.code = menu.code;
      }
    }

    // 添加日志，查看从API获取的菜单详情数据
    logger.info("从API获取的菜单详情：", menuStore.currentMenu);
    logger.info("菜单code字段：", menuStore.currentMenu?.code);

    // 设置当前菜单并打开对话框
    editMenuDialog.currentMenu = menuStore.currentMenu;
    editMenuDialog.visible = true;
  } catch (error) {
    logger.error("获取菜单详情失败", error);
    ElMessage.error("获取菜单详情失败");
  } finally {
    editMenuDialog.loading = false;
  }
};

// 提交菜单编辑表单
const handleEditSubmit = async (formData: MenuCreateUpdateParams) => {
  editMenuDialog.loading = true;
  try {
    if (editMenuDialog.currentMenu) {
      await menuStore.updateMenuAction(editMenuDialog.currentMenu.id, formData);
      ElMessage.success(t("menu.updateSuccess"));

      // 根据当前模式选择性刷新
      if (isTreeMode.value) {
        // 树形模式下，只刷新树形结构
        await menuStore.fetchMenuTree();
      } else {
        // 列表模式下，只刷新当前页的列表
        await fetchMenuList();
      }
    }
  } catch (error) {
    logger.error("更新菜单失败", error);
    ElMessage.error(t("menu.updateFailed"));
  } finally {
    editMenuDialog.loading = false;
    // 重置loading状态后再关闭对话框
    editMenuDialog.visible = false;
  }
};

// 取消编辑菜单
const handleEditCancel = () => {
  editMenuDialog.visible = false;
};

// 删除菜单
const handleDeleteMenu = (menu: Menu) => {
  openConfirmDialog(
    t("menu.confirmDelete"),
    t("menu.confirmDeleteMessage", { name: menu.name }),
    "danger",
    async () => {
      try {
        await menuStore.removeMenu(menu.id);
        ElMessage.success(t("menu.deleteSuccess"));

        // 根据当前模式选择性刷新
        if (isTreeMode.value) {
          // 树形模式下，store中已经更新了树形结构，无需额外刷新
          // 由于移除了节点，可能需要重新计算树的展开状态
          nextTick(() => {
            if (treeRef.value) {
              // 可选：更新树的一些状态
            }
          });
        } else {
          // 列表模式下，只刷新当前页的列表
          await fetchMenuList();
        }
      } catch (error) {
        logger.error("删除菜单失败", error);
        ElMessage.error(t("menu.deleteFailed"));
      }
    }
  );
};

// 切换菜单状态
const handleToggleStatus = (menu: Menu) => {
  const newStatus = !menu.is_active;
  const action = newStatus ? t("menu.enable") : t("menu.disable");

  openConfirmDialog(
    t("menu.confirmStatusChange", { action }),
    t("menu.confirmStatusChangeMessage", { action, name: menu.name }),
    "warning",
    async () => {
      try {
        await menuStore.toggleMenuStatusAction(menu.id, newStatus);
        ElMessage.success(
          newStatus ? t("menu.enableSuccess") : t("menu.disableSuccess")
        );
        fetchMenuList();
      } catch (error) {
        logger.error(`${action}菜单失败`, error);
        ElMessage.error(
          newStatus ? t("menu.enableFailed") : t("menu.disableFailed")
        );
      }
    }
  );
};

// 获取菜单列表
const fetchMenuList = async () => {
  const params: MenuListParams = {
    page: pagination.currentPage,
    page_size: pagination.pageSize,
    search: searchForm.search || undefined
  };

  if (searchForm.is_active !== "all") {
    params.is_active = searchForm.is_active === "true";
  }

  if (searchForm.parent_id !== undefined) {
    params.parent_id = searchForm.parent_id;
  }

  await menuStore.fetchMenuList(params);
};

// 重置筛选条件
const resetSearch = () => {
  searchForm.search = "";
  searchForm.is_active = "all";
  searchForm.parent_id = undefined;
  pagination.currentPage = 1;
  fetchMenuList();
};

// 处理搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchMenuList();
};

// 处理页码变化
const handleCurrentChange = (page: number) => {
  pagination.currentPage = page;
  fetchMenuList();
};

// 处理每页条数变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  fetchMenuList();
};

// 初始化
onMounted(() => {
  fetchMenuList();
});
</script>

<style scoped>
.menu-management-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 10px;
}

.search-container {
  margin-bottom: 20px;
}

.search-buttons {
  display: flex;
  gap: 10px;
}

.table-container {
  margin-bottom: 20px;
}

.menu-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-icon {
  font-size: 16px;
}

.menu-tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 5px 0;
}

.menu-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-title {
  font-weight: 500;
}

.menu-path {
  color: #999;
  margin: 0 5px;
}

.menu-status {
  margin-left: 5px;
}

.node-actions {
  display: flex;
  gap: 5px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.import-container {
  width: 100%;
  padding: 20px 0;
}

.upload-area {
  width: 100%;
}
</style>
