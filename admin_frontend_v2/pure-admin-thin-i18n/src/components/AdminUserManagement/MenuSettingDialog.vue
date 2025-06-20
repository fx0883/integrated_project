<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import {
  ElMessage,
  ElTree,
  ElDialog,
  ElButton,
  ElInput,
  ElCheckbox
} from "element-plus";
import { Search } from "@element-plus/icons-vue";
import { useMenuStore } from "@/store/modules/menu";
import logger from "@/utils/logger";

const { t } = useI18n();
const menuStore = useMenuStore();

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  userId: {
    type: Number,
    required: true
  },
  username: {
    type: String,
    default: ""
  }
});

const emit = defineEmits(["update:visible", "confirm", "cancel"]);

// 状态变量
const loading = ref(false);
const menuTree = ref([]);
const checkedKeys = ref([]);
const searchKeyword = ref("");
const menuTreeRef = ref(null);

// 配置tree组件的属性
const defaultProps = reactive({
  children: "children",
  label: "title",
  disabled: "is_disabled"
});

// 是否显示预览对话框
const previewVisible = ref(false);
// 预览菜单数据
const previewMenus = ref([]);

// 监听对话框可见性变化
watch(
  () => props.visible,
  async val => {
    console.log(
      "MenuSettingDialog visible 属性变化",
      val,
      props.userId,
      props.username
    );

    if (val && props.userId > 0) {
      // 对话框显示，加载数据
      logger.debug("菜单设置对话框打开", {
        userId: props.userId,
        username: props.username
      });
      await loadData();
    }
  }
);

// 监听用户ID变化
watch(
  () => props.userId,
  async (newVal, oldVal) => {
    console.log("MenuSettingDialog userId 属性变化", newVal, oldVal);

    if (props.visible && newVal > 0 && newVal !== oldVal) {
      logger.debug("用户ID变化，重新加载菜单数据", {
        userId: newVal,
        username: props.username
      });
      await loadData();
    }
  }
);

// 监听搜索关键词变化
watch(searchKeyword, val => {
  if (menuTreeRef.value) {
    menuTreeRef.value.filter(val);
  }
});

// 加载菜单数据
const loadData = async () => {
  if (props.userId <= 0) {
    logger.warn("无效的用户ID，无法加载菜单数据", { userId: props.userId });
    return;
  }

  loading.value = true;
  console.log("开始加载菜单数据", { userId: props.userId });

  try {
    // 获取菜单树
    const menuTreeResponse = await menuStore.fetchMenuTree({ is_active: true });
    console.log("菜单树加载结果", menuTreeResponse);

    // 处理菜单树数据
    menuTree.value = menuTreeResponse?.data || [];
    console.log("菜单树数据已设置", menuTree.value);
  } catch (error) {
    console.error("加载菜单树失败", error);
    ElMessage.error(t("menu.loadTreeFailed") || "加载菜单树失败");
  }

  try {
    // 获取用户当前菜单配置
    const userMenusResponse = await menuStore.fetchUserMenus(props.userId);
    console.log("用户菜单加载结果", userMenusResponse);

    // 处理用户菜单数据，设置选中状态
    checkedKeys.value = (userMenusResponse?.data?.menus || [])
      .filter(menu => menu.is_active)
      .map(menu => menu.id);
    console.log("已选中菜单ID", checkedKeys.value);
  } catch (error) {
    console.error("加载用户菜单失败", error);
    ElMessage.error(t("menu.loadUserMenusFailed") || "加载用户菜单失败");
  } finally {
    loading.value = false;
  }
};

// 过滤菜单节点
const filterNode = (value, data) => {
  if (!value) return true;
  return data.title.toLowerCase().includes(value.toLowerCase());
};

// 获取菜单总数量（包括子菜单）
const getTotalMenuCount = menus => {
  let count = 0;
  const countMenu = items => {
    for (const item of items) {
      count++;
      if (item.children && item.children.length > 0) {
        countMenu(item.children);
      }
    }
  };
  countMenu(menus);
  return count;
};

// 处理对话框关闭
const handleClose = () => {
  emit("update:visible", false);
  emit("cancel");
};

// 处理全选/取消全选
const handleCheckAll = checked => {
  if (checked) {
    // 全选，收集所有菜单ID
    const collectIds = menus => {
      let ids = [];
      for (const menu of menus) {
        ids.push(menu.id);
        if (menu.children && menu.children.length > 0) {
          ids = ids.concat(collectIds(menu.children));
        }
      }
      return ids;
    };
    checkedKeys.value = collectIds(menuTree.value);
  } else {
    // 取消全选
    checkedKeys.value = [];
  }

  logger.debug("全选/取消全选菜单", {
    isAllChecked: checked,
    menuCount: checkedKeys.value.length
  });
};

// 判断是否是全选状态
const isAllChecked = computed(() => {
  const totalCount = getTotalMenuCount(menuTree.value);
  return totalCount > 0 && checkedKeys.value.length === totalCount;
});

// 判断是否是半选状态
const isIndeterminate = computed(() => {
  const totalCount = getTotalMenuCount(menuTree.value);
  return checkedKeys.value.length > 0 && checkedKeys.value.length < totalCount;
});

// 处理预览
const handlePreview = () => {
  // 根据选中的ID过滤菜单树
  const filterMenus = (menus, checkedIds) => {
    return menus
      .filter(menu => checkedIds.includes(menu.id))
      .map(menu => {
        const newMenu = { ...menu };
        if (menu.children && menu.children.length > 0) {
          newMenu.children = filterMenus(menu.children, checkedIds);
        }
        return newMenu;
      });
  };

  previewMenus.value = filterMenus(menuTree.value, checkedKeys.value);
  previewVisible.value = true;

  logger.debug("预览菜单", {
    menuCount: previewMenus.value.length,
    selectedKeys: checkedKeys.value.length
  });
};

// 关闭预览
const handleClosePreview = () => {
  previewVisible.value = false;
};

// 处理保存
const handleSave = async () => {
  loading.value = true;
  try {
    logger.debug("保存用户菜单设置", {
      userId: props.userId,
      username: props.username,
      menuIds: checkedKeys.value
    });

    await menuStore.assignUserMenus(props.userId, {
      menu_ids: checkedKeys.value
    });

    ElMessage.success(t("menu.settingSuccess"));
    emit("update:visible", false);
    emit("confirm");
  } catch (error) {
    logger.error("保存菜单失败", error);
    ElMessage.error(t("menu.saveFailed"));
  } finally {
    loading.value = false;
  }
};

// 组件挂载时检查状态
onMounted(() => {
  console.log("MenuSettingDialog 组件挂载", {
    visible: props.visible,
    userId: props.userId,
    username: props.username
  });
});
</script>

<template>
  <el-dialog
    :title="t('menu.userMenuSetting') + ': ' + username"
    :visible="props.visible"
    @update:visible="emit('update:visible', $event)"
    width="680px"
    :close-on-click-modal="false"
    destroy-on-close
    @closed="handleClose"
  >
    <div class="menu-setting-dialog">
      <div class="menu-setting-header">
        <el-checkbox
          :indeterminate="isIndeterminate"
          :checked="isAllChecked"
          @change="handleCheckAll"
        >
          {{ t("menu.allMenus") }}
        </el-checkbox>
        <el-input
          v-model="searchKeyword"
          :placeholder="t('menu.searchMenus')"
          :prefix-icon="Search"
          clearable
          style="width: 220px"
        />
      </div>

      <div v-loading="loading" class="menu-setting-content">
        <el-tree
          ref="menuTreeRef"
          :data="menuTree"
          :props="defaultProps"
          show-checkbox
          node-key="id"
          v-model:checked-keys="checkedKeys"
          default-expand-all
          :filter-node-method="filterNode"
        />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handlePreview">{{ t("menu.preview") }}</el-button>
        <el-button @click="handleClose">{{ t("menu.cancel") }}</el-button>
        <el-button type="primary" @click="handleSave" :loading="loading">
          {{ t("menu.save") }}
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 预览对话框 -->
  <el-dialog
    :title="t('menu.preview')"
    :visible="previewVisible"
    @update:visible="previewVisible = $event"
    width="580px"
    append-to-body
    destroy-on-close
  >
    <div class="menu-preview-content">
      <el-tree :data="previewMenus" :props="defaultProps" default-expand-all />
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClosePreview">{{
          t("menu.return")
        }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.menu-setting-dialog {
  height: 460px;
  display: flex;
  flex-direction: column;
}

.menu-setting-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.menu-setting-content {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  padding: 10px;
}

.menu-preview-content {
  height: 400px;
  overflow-y: auto;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  padding: 10px;
}
</style>
