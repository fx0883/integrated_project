<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import {
  ElMessage,
  ElTree,
  ElDialog,
  ElButton,
  ElInput,
  ElCheckbox,
  ElMessageBox
} from "element-plus";
import { Search } from "@element-plus/icons-vue";
import { useMenuStore } from "@/store/modules/menu";
import logger from "@/utils/logger";

const { t } = useI18n();
const menuStore = useMenuStore();

// 添加一个标志位，用于防止重复加载数据
const dataLoaded = ref(false);

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

// 内部对话框可见性状态
const dialogVisible = ref(false);

// 同步props.visible到内部状态，并在可见性变为true时加载数据
watch(
  () => props.visible,
  async (val, oldVal) => {
    logger.debug("MenuSettingDialog - props.visible变化", {
      oldValue: oldVal,
      newValue: val,
      userId: props.userId,
      dataLoaded: dataLoaded.value
    });

    dialogVisible.value = val;

    // 当对话框显示且有有效的用户ID时加载数据
    if (val && props.userId > 0) {
      // 对话框显示，加载数据
      logger.debug("MenuSettingDialog - 对话框打开，准备加载数据", {
        userId: props.userId,
        username: props.username,
        dataLoaded: dataLoaded.value
      });

      // 每次显示对话框时，先清空选中状态
      checkedKeys.value = [];

      // 重置数据加载标志，确保每次打开对话框都重新加载数据
      dataLoaded.value = false;

      // 使用标志位防止重复加载
      if (!dataLoaded.value) {
        dataLoaded.value = true;
        logger.debug("MenuSettingDialog - 设置dataLoaded=true，开始加载数据");
        await loadData();
      } else {
        logger.debug("MenuSettingDialog - 数据已加载，跳过重复加载");
      }
    } else if (!val) {
      // 对话框关闭时重置标志位
      logger.debug("MenuSettingDialog - 对话框关闭，重置dataLoaded标志位");
      dataLoaded.value = false;
    }
  }
);

// 同步内部状态到props.visible
watch(dialogVisible, (val, oldVal) => {
  logger.debug("MenuSettingDialog - dialogVisible变化", {
    oldValue: oldVal,
    newValue: val,
    propsVisible: props.visible
  });

  if (val !== props.visible) {
    logger.debug("MenuSettingDialog - 发出update:visible事件", {
      value: val,
      propsVisible: props.visible
    });
    emit("update:visible", val);
  }
});

// 配置tree组件的属性
const defaultProps = reactive({
  children: "children",
  label: "name",
  disabled: "is_disabled"
});

// 是否显示预览对话框
const previewVisible = ref(false);
// 预览菜单数据
const previewMenus = ref([]);

// 监听用户ID变化
watch(
  () => props.userId,
  async (newVal, oldVal) => {
    logger.debug("MenuSettingDialog - userId属性变化", {
      oldValue: oldVal,
      newValue: newVal,
      visible: props.visible,
      dataLoaded: dataLoaded.value
    });

    if (props.visible && newVal > 0 && newVal !== oldVal) {
      logger.debug("MenuSettingDialog - 用户ID变化，重新加载菜单数据", {
        userId: newVal,
        username: props.username,
        dataLoaded: dataLoaded.value
      });

      // 用户ID变化时重置所有状态并重新加载数据
      checkedKeys.value = []; // 清空选中状态
      menuTree.value = []; // 清空菜单树
      previewMenus.value = []; // 清空预览菜单
      dataLoaded.value = false; // 重置数据加载标志

      // 重新加载数据
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

// 处理节点勾选状态变化
const handleCheck = (data, { checkedNodes, checkedKeys: newCheckedKeys }) => {
  // 更新选中的节点
  checkedKeys.value = newCheckedKeys;
  logger.debug("菜单节点选择变化", {
    checkedCount: checkedKeys.value.length,
    checkedIds: checkedKeys.value,
    selectedMenu: data ? data.name : null
  });
};

// 加载菜单数据
const loadData = async () => {
  if (props.userId <= 0) {
    logger.warn("无效的用户ID，无法加载菜单数据", { userId: props.userId });
    return;
  }

  loading.value = true;
  logger.debug("MenuSettingDialog - 开始加载菜单数据", {
    userId: props.userId,
    timestamp: new Date().getTime()
  });

  try {
    // 获取菜单树
    logger.debug("MenuSettingDialog - 发起fetchMenuTree请求", {
      userId: props.userId,
      timestamp: new Date().getTime()
    });
    const menuTreeResponse = await menuStore.fetchMenuTree({ is_active: true });
    logger.debug("MenuSettingDialog - fetchMenuTree请求完成", {
      timestamp: new Date().getTime(),
      responseStatus: menuTreeResponse?.success
    });

    // 处理菜单树数据
    menuTree.value = menuTreeResponse?.data || [];
    logger.debug("MenuSettingDialog - 菜单树数据已设置", {
      itemCount: menuTree.value.length
    });
  } catch (error) {
    logger.error("MenuSettingDialog - 加载菜单树失败", error);
    ElMessage.error(t("menu.loadTreeFailed") || "加载菜单树失败");
  }

  try {
    // 获取用户当前菜单配置
    logger.debug("MenuSettingDialog - 发起fetchUserMenus请求", {
      userId: props.userId,
      timestamp: new Date().getTime()
    });
    const userMenusResponse = await menuStore.fetchUserMenus(props.userId);
    logger.debug("MenuSettingDialog - fetchUserMenus请求完成", {
      timestamp: new Date().getTime(),
      responseStatus: userMenusResponse?.success
    });

    // 处理用户菜单数据，设置选中状态
    checkedKeys.value = (userMenusResponse?.data?.menus || [])
      .filter(menu => menu.is_active)
      .map(menu => menu.menu_id);
    logger.debug("MenuSettingDialog - 已选中菜单ID", {
      checkedCount: checkedKeys.value.length,
      checkedKeys: checkedKeys.value,
      userMenus: userMenusResponse?.data?.menus
    });
  } catch (error) {
    logger.error("MenuSettingDialog - 加载用户菜单失败", error);
    ElMessage.error(t("menu.loadUserMenusFailed") || "加载用户菜单失败");
  } finally {
    loading.value = false;
    logger.debug("MenuSettingDialog - 菜单数据加载完成", {
      timestamp: new Date().getTime()
    });
  }
};

// 过滤菜单节点
const filterNode = (value, data) => {
  if (!value) return true;
  return data.name.toLowerCase().includes(value.toLowerCase());
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

// 处理对话框关闭前的清理工作
const handleBeforeClose = done => {
  logger.debug("MenuSettingDialog - 对话框关闭前处理函数被调用");
  // 清理状态
  checkedKeys.value = [];
  menuTree.value = [];
  previewMenus.value = [];
  dataLoaded.value = false;
  searchKeyword.value = "";
  done(); // 允许对话框关闭
};

// 处理对话框关闭
const handleClose = () => {
  logger.debug("MenuSettingDialog - 对话框关闭处理函数被调用");
  dialogVisible.value = false;
  emit("update:visible", false);
  emit("cancel");
};

// 处理全选/取消全选
const handleCheckAll = checked => {
  if (menuTreeRef.value) {
    if (checked) {
      // 全选
      menuTreeRef.value.setCheckedNodes(menuTree.value);
    } else {
      // 取消全选
      menuTreeRef.value.setCheckedKeys([]);
    }
    // 同步选中的键
    checkedKeys.value = menuTreeRef.value.getCheckedKeys();
  } else {
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
    logger.debug("过滤菜单树", {
      menuCount: menus.length,
      checkedIdsCount: checkedIds.length,
      menuIds: menus.map(m => m.id),
      checkedIds
    });

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
    // 确保从Tree组件获取最新的选中状态
    if (menuTreeRef.value) {
      const treeCheckedKeys = menuTreeRef.value.getCheckedKeys();
      logger.debug("获取树组件最新选中状态", {
        treeCheckedKeysCount: treeCheckedKeys.length,
        currentCheckedKeysCount: checkedKeys.value.length
      });
      checkedKeys.value = treeCheckedKeys;
    }

    logger.debug("保存用户菜单设置", {
      userId: props.userId,
      username: props.username,
      menuIds: checkedKeys.value,
      menuIdsCount: checkedKeys.value.length
    });

    if (checkedKeys.value.length === 0) {
      const confirmClear = await ElMessageBox.confirm(
        "您当前未选择任何菜单，确定要清空该用户的菜单吗？",
        "提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        }
      ).catch(() => false);

      if (!confirmClear) {
        logger.debug("用户取消了清空菜单操作");
        loading.value = false;
        return;
      }
    }

    await menuStore.assignUserMenus(props.userId, {
      menu_ids: checkedKeys.value
    });

    ElMessage.success(t("menu.settingSuccess"));
    dialogVisible.value = false;
    emit("update:visible", false);
    emit("confirm");
  } catch (error) {
    logger.error("保存菜单失败", error);
    ElMessage.error(error.message || t("menu.saveFailed"));
  } finally {
    loading.value = false;
  }
};

// 组件挂载时记录状态
onMounted(() => {
  logger.debug("MenuSettingDialog - 组件挂载", {
    visible: props.visible,
    userId: props.userId,
    username: props.username,
    timestamp: new Date().getTime()
  });
});
</script>

<template>
  <el-dialog
    :title="t('menu.userMenuSetting') + ': ' + username"
    v-model="dialogVisible"
    width="680px"
    :close-on-click-modal="false"
    destroy-on-close
    :before-close="handleBeforeClose"
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
          :default-checked-keys="checkedKeys"
          @check="handleCheck"
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
    v-model="previewVisible"
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
