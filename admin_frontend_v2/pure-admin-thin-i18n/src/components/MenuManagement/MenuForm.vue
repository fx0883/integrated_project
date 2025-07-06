<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="120px"
    :disabled="loading"
  >
    <el-tabs>
      <el-tab-pane :label="t('menu.basicInfo')">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="t('menu.name')" prop="name">
              <el-input
                v-model="formData.name"
                :placeholder="t('menu.nameRequired')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('menu.code')" prop="code">
              <el-input
                v-model="formData.code"
                :placeholder="t('menu.codeRequired')"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="t('menu.title')" prop="title">
              <el-input
                v-model="formData.title"
                :placeholder="t('menu.name')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('menu.rank')" prop="rank">
              <el-input-number v-model="formData.rank" :min="0" :max="999" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="t('menu.parentId')" prop="parent_id">
              <el-select
                v-model="formData.parent_id"
                clearable
                filterable
                :placeholder="t('menu.parentId')"
                value-key="id"
              >
                <el-option label="顶级菜单" :value="null" />
                <el-option
                  v-for="item in menuOptions"
                  :key="item.id"
                  :label="item.title || item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('menu.isActive')" prop="is_active">
              <el-switch v-model="formData.is_active" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane :label="t('menu.routeConfig')">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="t('menu.path')" prop="path">
              <el-input
                v-model="formData.path"
                :placeholder="t('menu.pathRequired')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('menu.component')" prop="component">
              <el-input
                v-model="formData.component"
                :placeholder="t('menu.component')"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="t('menu.redirect')" prop="redirect">
              <el-input v-model="formData.redirect" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('menu.activePath')" prop="active_path">
              <el-input v-model="formData.active_path" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="t('menu.frameSrc')" prop="frame_src">
              <el-input v-model="formData.frame_src" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('menu.frameLoading')" prop="frame_loading">
              <el-switch v-model="formData.frame_loading" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane :label="t('menu.displaySettings')">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="t('menu.icon')" prop="icon">
              <el-input v-model="formData.icon" clearable>
                <template #append>
                  <el-button @click="openIconSelector">
                    {{ t("menu.selectIcon") }}
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('menu.extraIcon')" prop="extra_icon">
              <el-input v-model="formData.extra_icon" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="t('menu.showLink')" prop="show_link">
              <el-switch v-model="formData.show_link" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('menu.showParent')" prop="show_parent">
              <el-switch v-model="formData.show_parent" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="t('menu.keepAlive')" prop="keep_alive">
              <el-switch v-model="formData.keep_alive" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('menu.hiddenTag')" prop="hidden_tag">
              <el-switch v-model="formData.hidden_tag" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane :label="t('menu.permissionSettings')">
        <el-row>
          <el-col :span="24">
            <el-form-item :label="t('menu.roles')" prop="roles">
              <el-select
                v-model="formData.roles"
                multiple
                filterable
                allow-create
                default-first-option
                :placeholder="t('menu.roles')"
              >
                <el-option
                  v-for="role in roleOptions"
                  :key="role.value"
                  :label="role.label"
                  :value="role.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item :label="t('menu.auths')" prop="auths">
              <el-select
                v-model="formData.auths"
                multiple
                filterable
                allow-create
                default-first-option
                :placeholder="t('menu.auths')"
              >
                <el-option
                  v-for="auth in authOptions"
                  :key="auth.value"
                  :label="auth.label"
                  :value="auth.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane :label="t('menu.advancedSettings')">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="t('menu.dynamicLevel')" prop="dynamic_level">
              <el-input-number
                v-model="formData.dynamic_level"
                :min="0"
                :max="10"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              :label="t('menu.transitionName')"
              prop="transition_name"
            >
              <el-select
                v-model="formData.transition_name"
                clearable
                :placeholder="t('menu.transitionName')"
              >
                <el-option
                  v-for="item in transitionOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item
              :label="t('menu.enterTransition')"
              prop="enter_transition"
            >
              <el-select
                v-model="formData.enter_transition"
                clearable
                :placeholder="t('menu.enterTransition')"
              >
                <el-option
                  v-for="item in enterTransitionOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              :label="t('menu.leaveTransition')"
              prop="leave_transition"
            >
              <el-select
                v-model="formData.leave_transition"
                clearable
                :placeholder="t('menu.leaveTransition')"
              >
                <el-option
                  v-for="item in leaveTransitionOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item :label="t('menu.remarks')" prop="remarks">
              <el-input
                v-model="formData.remarks"
                type="textarea"
                rows="3"
                :placeholder="t('menu.remarks')"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>

    <div class="form-actions">
      <el-button @click="resetForm">{{ t("menu.cancel") }}</el-button>
      <el-button type="primary" @click="submitForm" :loading="loading">{{
        t("menu.save")
      }}</el-button>
    </div>
  </el-form>

  <!-- 图标选择器组件 -->
  <IconSelector ref="iconSelectorRef" @select="handleIconSelect" />
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { FormInstance, FormRules } from "element-plus";
import type { Menu, MenuCreateUpdateParams } from "@/types/menu";
import { useMenuStoreHook } from "@/store/modules/menu";
import logger from "@/utils/logger";

const { t } = useI18n();
const menuStore = useMenuStoreHook();

const props = defineProps<{
  menu?: Menu;
  loading?: boolean;
  mode: "create" | "edit";
  parentId?: number | null;
}>();

const emit = defineEmits<{
  (e: "submit", formData: MenuCreateUpdateParams): void;
  (e: "cancel"): void;
}>();

const formRef = ref<FormInstance>();

// 记录初始化时的菜单数据，用于调试
if (props.menu) {
  logger.info("初始化菜单数据：", props.menu);
}

// 记录菜单的code字段，用于调试
const menuCode = props.menu?.code;
logger.info("初始化时的菜单code字段：", menuCode);

const formData = reactive<MenuCreateUpdateParams>({
  name: props.menu?.name || "",
  code: menuCode || "", // 确保code字段被正确初始化
  path: props.menu?.path || "",
  component: props.menu?.component || "",
  redirect: props.menu?.redirect || "",
  title: props.menu?.title || "",
  icon: props.menu?.icon || "",
  extra_icon: null,
  rank: props.menu?.rank || 0,
  show_link: props.menu?.show_link !== undefined ? props.menu.show_link : true,
  show_parent:
    props.menu?.show_parent !== undefined ? props.menu.show_parent : true,
  roles: props.menu?.roles || [],
  auths: props.menu?.auths || [],
  keep_alive:
    props.menu?.keep_alive !== undefined ? props.menu.keep_alive : false,
  frame_src: null,
  frame_loading: false,
  hidden_tag: false,
  dynamic_level: null,
  active_path: null,
  transition_name: null,
  enter_transition: null,
  leave_transition: null,
  parent_id: props.menu?.parent_id || props.parentId || null,
  is_active: props.menu?.is_active !== undefined ? props.menu.is_active : true,
  remarks: null
});

const menuOptions = computed(() => {
  if (!props.menu) return menuStore.menuList.data;
  // 过滤掉当前菜单，防止自己选择自己作为父级菜单
  return menuStore.menuList.data.filter(item => item.id !== props.menu?.id);
});

// 获取父菜单名称，用于显示
const getParentMenuName = (parentId: number | null) => {
  if (parentId === null) return "顶级菜单";
  const parentMenu = menuStore.menuList.data.find(item => item.id === parentId);
  return parentMenu ? parentMenu.title || parentMenu.name : "顶级菜单";
};

const roleOptions = ref([
  { label: "超级管理员", value: "super_admin" },
  { label: "管理员", value: "admin" },
  { label: "普通用户", value: "user" }
]);

const authOptions = ref([
  { label: "查看", value: "view" },
  { label: "添加", value: "add" },
  { label: "编辑", value: "edit" },
  { label: "删除", value: "delete" }
]);

const transitionOptions = ref([
  { label: "淡入淡出", value: "fade" },
  { label: "缩放", value: "scale" },
  { label: "滑动", value: "slide" },
  { label: "向上滑动", value: "slide-up" },
  { label: "向下滑动", value: "slide-down" }
]);

const enterTransitionOptions = ref([
  { label: "淡入", value: "fade-in" },
  { label: "缩放进入", value: "scale-in" },
  { label: "从右滑入", value: "slide-in-right" },
  { label: "从左滑入", value: "slide-in-left" }
]);

const leaveTransitionOptions = ref([
  { label: "淡出", value: "fade-out" },
  { label: "缩放离开", value: "scale-out" },
  { label: "向右滑出", value: "slide-out-right" },
  { label: "向左滑出", value: "slide-out-left" }
]);

const rules = reactive<FormRules>({
  name: [
    { required: true, message: t("menu.nameRequired"), trigger: "blur" },
    { min: 2, max: 50, message: t("menu.nameRequired"), trigger: "blur" }
  ],
  code: [
    { required: true, message: t("menu.codeRequired"), trigger: "blur" },
    { min: 2, max: 50, message: t("menu.codeRequired"), trigger: "blur" }
  ],
  path: [{ required: true, message: t("menu.pathRequired"), trigger: "blur" }],
  component: [],
  rank: [
    { required: true, message: t("menu.rankRequired"), trigger: "blur" },
    { type: "number", message: t("menu.rankRequired"), trigger: "blur" }
  ]
});

import IconSelector from "./IconSelector.vue";

const iconSelectorRef = ref();

const openIconSelector = () => {
  iconSelectorRef.value?.open();
};

const handleIconSelect = (icon: string) => {
  formData.icon = icon;
};

// 组件挂载时，确保菜单列表已加载
onMounted(async () => {
  // 如果菜单列表为空，则加载菜单列表
  if (menuStore.menuList.data.length === 0) {
    await menuStore.fetchMenuList({ page: 1, page_size: 100 });
  }
});

// 监听菜单列表变化，确保父菜单显示正确
watch(
  () => menuStore.menuList.data,
  () => {
    if (formData.parent_id !== null && formData.parent_id !== undefined) {
      // 强制更新选择器显示
      const tempId = formData.parent_id;
      formData.parent_id = null;
      nextTick(() => {
        formData.parent_id = tempId;
      });
    }
  },
  { deep: true }
);

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate((valid, fields) => {
    if (valid) {
      emit("submit", formData);
    } else {
      logger.error("表单验证失败", fields);
    }
  });
};

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  emit("cancel");
};

watch(
  () => props.menu,
  async newVal => {
    if (newVal) {
      // 确保有足够的菜单数据用于显示父菜单
      await menuStore.fetchMenuList({ page_size: 999 });

      // 添加日志，查看菜单详情数据
      logger.info("编辑菜单数据：", newVal);
      logger.info("菜单code字段：", newVal.code);

      // 直接从props.menu中获取code字段，确保它被正确赋值
      const menuCode = props.menu?.code;
      logger.info("直接从props.menu获取的code字段：", menuCode);

      // 确保所有字段都被正确赋值，特别是code字段
      formData.name = newVal.name || "";

      // 优先使用props.menu?.code，确保code字段被正确赋值
      formData.code = menuCode || newVal.code || "";

      formData.path = newVal.path || "";
      formData.component = newVal.component || "";
      formData.redirect = newVal.redirect || "";
      formData.title = newVal.title || "";
      formData.icon = newVal.icon || "";
      formData.rank = newVal.rank || 0;
      formData.show_link =
        newVal.show_link !== undefined ? newVal.show_link : true;
      formData.show_parent =
        newVal.show_parent !== undefined ? newVal.show_parent : true;
      formData.roles = newVal.roles || [];
      formData.auths = newVal.auths || [];
      formData.keep_alive =
        newVal.keep_alive !== undefined ? newVal.keep_alive : false;
      formData.is_active =
        newVal.is_active !== undefined ? newVal.is_active : true;
      formData.parent_id = newVal.parent_id;

      // 如果有父菜单ID，确保它在菜单选项中存在
      if (formData.parent_id !== null) {
        const parentExists = menuStore.menuList.data.some(
          item => item.id === formData.parent_id
        );
        if (!parentExists) {
          // 如果父菜单不在当前列表中，可能是因为分页限制，尝试专门获取这个菜单
          try {
            await menuStore.fetchMenuDetail(formData.parent_id);
            // 确保这个菜单被添加到菜单列表中
            if (
              menuStore.currentMenu &&
              !menuStore.menuList.data.some(
                item => item.id === menuStore.currentMenu.id
              )
            ) {
              menuStore.menuList.data.push(menuStore.currentMenu);
            }
          } catch (error) {
            logger.error("获取父菜单详情失败", error);
          }
        }
      }
    }
  }
);

// 重置表单数据，但保留父级菜单ID
const resetFormDataExceptParentId = (parentId: number | null) => {
  formData.name = "";
  formData.code = "";
  formData.path = "";
  formData.component = "";
  formData.redirect = "";
  formData.title = "";
  formData.icon = "";
  formData.extra_icon = null;
  formData.rank = 0;
  formData.show_link = true;
  formData.show_parent = true;
  formData.roles = [];
  formData.auths = [];
  formData.keep_alive = false;
  formData.frame_src = null;
  formData.frame_loading = false;
  formData.hidden_tag = false;
  formData.dynamic_level = null;
  formData.active_path = null;
  formData.transition_name = null;
  formData.enter_transition = null;
  formData.leave_transition = null;
  formData.parent_id = parentId;
  formData.is_active = true;
  formData.remarks = null;
};

// 监听父菜单ID变化
watch(
  () => props.parentId,
  newVal => {
    if (props.mode === "create") {
      // 当父菜单ID变化时，重置表单数据，但保留父级菜单ID
      resetFormDataExceptParentId(newVal ?? null);
    }
  },
  { immediate: true }
);

// 在组件挂载时加载菜单列表，确保有数据可选择
onMounted(async () => {
  // 无论如何都重新获取菜单列表，确保有最新数据
  await menuStore.fetchMenuList({ page_size: 999 });

  // 如果是编辑模式，确保code字段被正确设置
  if (props.mode === "edit" && props.menu) {
    logger.info("组件挂载时的菜单数据：", props.menu);
    logger.info("组件挂载时的菜单code字段：", props.menu.code);

    // 确保code字段被正确设置
    if (props.menu.code && !formData.code) {
      formData.code = props.menu.code;
      logger.info("在组件挂载时设置code字段：", formData.code);
    }
  }
});

// 初始化表单数据已在上方处理
</script>

<style scoped>
.form-actions {
  margin-top: 20px;
  text-align: right;
}
</style>
