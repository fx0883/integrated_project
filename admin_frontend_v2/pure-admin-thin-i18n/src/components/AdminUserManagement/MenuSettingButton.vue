<script setup>
import { computed } from "vue";
import { useUserStore } from "@/store/modules/user";
import { ElButton } from "element-plus";
import { useI18n } from "vue-i18n";
import logger from "@/utils/logger";

const { t } = useI18n();

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(["click"]);

// 获取当前登录用户信息
const userStore = useUserStore();

// 判断是否可以管理目标用户的菜单
const canManageUserMenu = computed(() => {
  // 当前用户信息
  // const currentUser = {
  //   id: userStore.id,
  //   is_super_admin: userStore.is_super_admin,
  //   is_admin: userStore.is_admin,
  //   tenant: userStore.tenant
  // };

  // logger.debug("权限检查: 菜单设置", { currentUser, targetUser: props.user });

  // // 如果当前用户是超级管理员，不显示菜单设置按钮
  // if (props.user.is_super_admin) {
  //   return false;
  // }

  // // 租户管理员可以管理同一租户的非超级管理员用户
  // if (
  //   currentUser.is_admin &&
  //   props.user.tenant === currentUser.tenant &&
  //   !props.user.is_super_admin
  // ) {
  //   return true;
  // }

  // return false;
  return !props.user.is_super_admin;
});

const handleClick = () => {
  const clickId = `click_${Date.now()}`;
  logger.debug("菜单设置按钮被点击", {
    userId: props.user.id,
    username: props.user.username,
    clickId,
    timestamp: new Date().getTime()
  });
  emit("click", props.user);
};
</script>

<template>
  <el-button
    v-if="canManageUserMenu"
    size="small"
    type="success"
    @click="handleClick"
  >
    {{ t("menu.setUserMenu") }}
  </el-button>
</template>
