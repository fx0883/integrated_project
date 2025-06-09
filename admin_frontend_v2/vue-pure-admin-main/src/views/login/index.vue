<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Motion from "./utils/motion";
import { useRouter } from "vue-router";
import { message } from "@/utils/message";
import { loginRules } from "./utils/rule";
import TypeIt from "@/components/ReTypeit";
import { debounce } from "@pureadmin/utils";
import { useNav } from "@/layout/hooks/useNav";
import { useEventListener } from "@vueuse/core";
import type { FormInstance } from "element-plus";
import { $t, transformI18n } from "@/plugins/i18n";
import { operates, thirdParty } from "./utils/enums";
import { useLayout } from "@/layout/hooks/useLayout";
import LoginPhone from "./components/LoginPhone.vue";
import LoginRegist from "./components/LoginRegist.vue";
import LoginUpdate from "./components/LoginUpdate.vue";
import LoginQrCode from "./components/LoginQrCode.vue";
import { useUserStoreHook } from "@/store/modules/user";
import { initRouter, getTopMenu } from "@/router/utils";
import { bg, avatar, illustration } from "./utils/static";
import { ReImageVerify } from "@/components/ReImageVerify";
import { ref, toRaw, reactive, watch, computed, onMounted } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useTranslationLang } from "@/layout/hooks/useTranslationLang";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { getToken, removeToken } from "@/utils/auth";

import dayIcon from "@/assets/svg/day.svg?component";
import darkIcon from "@/assets/svg/dark.svg?component";
import globalization from "@/assets/svg/globalization.svg?component";

// 替换图标导入方式
/* 原导入方式可能会有问题，使用IconifyIconOnline组件替代
import Lock from "~icons/ri/lock-fill";
import Check from "~icons/ep/check";
import User from "~icons/ri/user-3-fill";
import Info from "~icons/ri/information-line";
import Keyhole from "~icons/ri/shield-keyhole-line";
import QuestionCircle from "~icons/ri/question-circle-fill";
*/

defineOptions({
  name: "Login"
});

// 判断是否为开发环境
const isDevelopment = import.meta.env.MODE === "development";

const imgCode = ref("");
const loginDay = ref(7);
const router = useRouter();
const loading = ref(false);
const checked = ref(false);
const disabled = ref(false);
const ruleFormRef = ref<FormInstance>();
const currentPage = computed(() => {
  return useUserStoreHook().currentPage;
});

const { t } = useI18n();
const { initStorage } = useLayout();
initStorage();
const { dataTheme, overallStyle, dataThemeChange } = useDataThemeChange();
dataThemeChange(overallStyle.value);
const { title, getDropdownItemStyle, getDropdownItemClass } = useNav();
const { locale, translationCh, translationEn } = useTranslationLang();

const ruleForm = reactive({
  username: "admin",
  password: "admin_main",
  verifyCode: ""
});

// 在开发环境中设置默认验证码
onMounted(() => {
  if (isDevelopment) {
    console.log("[登录页面] 开发环境，设置默认验证码");
    // 延迟一会儿，确保图形验证码组件已经生成了验证码
    setTimeout(() => {
      if (imgCode.value) {
        ruleForm.verifyCode = imgCode.value;
        console.log(`[登录页面] 已自动填充验证码: ${imgCode.value}`);
      }
    }, 500);
  }
});

const showDebugPanel = ref(false);
const debugInfo = ref({
  token: null as any
});

const onLogin = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  
  console.group("[登录流程] 开始登录流程");
  console.time("[登录流程] 总耗时");
  console.log(`[登录流程] 开始时间: ${new Date().toLocaleString()}`);
  console.log(`[登录流程] 用户名: ${ruleForm.username}`);
  console.log(`[登录流程] 开发环境: ${isDevelopment}`);
  
  // 在开发环境中，自动填充验证码
  if (isDevelopment && !ruleForm.verifyCode && imgCode.value) {
    console.log(`[登录流程] 开发环境，自动填充验证码: ${imgCode.value}`);
    ruleForm.verifyCode = imgCode.value;
  }
  
  await formEl.validate(valid => {
    if (valid) {
      console.log("[登录流程] 表单验证通过，准备发送登录请求");
      loading.value = true;
      
      useUserStoreHook()
        .loginByUsername({
          username: ruleForm.username,
          password: ruleForm.password
        })
        .then(res => {
          console.log("[登录流程] 登录请求响应", res);
          
          if (res.success) {
            console.log("[登录流程] 登录成功，准备初始化路由");
            // 获取后端路由
            return initRouter().then(() => {
              console.log("[登录流程] 路由初始化完成");
              disabled.value = true;
              
              const topMenu = getTopMenu(true);
              const topMenuPath = topMenu.path;
              console.log(`[登录流程] 获取顶部菜单路径: ${topMenuPath}`);
              
              // 确保跳转路径有效，避免404
              let targetPath = topMenuPath;
              
              // 尝试获取路由的完整路径
              if (topMenu.meta && topMenu.meta.fullPath) {
                targetPath = topMenu.meta.fullPath;
                console.log(`[登录流程] 使用路由的完整路径: ${targetPath}`);
              }
              // 确保路径以/开头
              else if (targetPath && !targetPath.startsWith('/')) {
                // 尝试从路由匹配中找到正确的路径
                const allRoutes = router.getRoutes();
                console.log(`[登录流程] 尝试查找匹配路由，当前路由数量: ${allRoutes.length}`);
                
                // 尝试找到包含此路径的路由
                const matchingRoute = allRoutes.find(route => 
                  route.path.includes(targetPath) || 
                  (topMenu.name && route.name === topMenu.name)
                );
                
                if (matchingRoute) {
                  targetPath = matchingRoute.path;
                  console.log(`[登录流程] 找到匹配路由: ${targetPath}`);
                } else {
                  // 如果找不到匹配，使用默认路径
                  targetPath = '/dashboard';
                  console.log(`[登录流程] 未找到匹配路由，使用默认路径: ${targetPath}`);
                }
              }
              
              console.log(`[登录流程] 最终导航路径: ${targetPath}`);
              
              router
                .push(targetPath)
                .then(() => {
                  console.log("[登录流程] 导航到首页成功");
                  message(t("login.pureLoginSuccess"), { type: "success" });
                  console.timeEnd("[登录流程] 总耗时");
                  console.groupEnd();
                })
                .catch(err => {
                  console.error("[登录流程] 导航到首页失败", err);
                  console.timeEnd("[登录流程] 总耗时");
                  console.groupEnd();
                })
                .finally(() => (disabled.value = false));
            }).catch(err => {
              console.error("[登录流程] 路由初始化失败", err);
              console.timeEnd("[登录流程] 总耗时");
              console.groupEnd();
            });
          } else {
            console.error("[登录流程] 登录失败", res);
            message(t("login.pureLoginFail"), { type: "error" });
            console.timeEnd("[登录流程] 总耗时");
            console.groupEnd();
          }
        })
        .catch(err => {
          console.error("[登录流程] 登录请求异常", err);
          console.timeEnd("[登录流程] 总耗时");
          console.groupEnd();
        })
        .finally(() => (loading.value = false));
    } else {
      console.error("[登录流程] 表单验证失败");
      console.timeEnd("[登录流程] 总耗时");
      console.groupEnd();
    }
  });
};

const immediateDebounce: any = debounce(
  formRef => onLogin(formRef),
  1000,
  true
);

useEventListener(document, "keydown", ({ code }) => {
  if (
    ["Enter", "NumpadEnter"].includes(code) &&
    !disabled.value &&
    !loading.value
  )
    immediateDebounce(ruleFormRef.value);
});

watch(imgCode, value => {
  useUserStoreHook().SET_VERIFYCODE(value);
});
watch(checked, bool => {
  useUserStoreHook().SET_ISREMEMBERED(bool);
});
watch(loginDay, value => {
  useUserStoreHook().SET_LOGINDAY(value);
});

const clearStorage = () => {
  removeToken();
  sessionStorage.clear();
  localStorage.clear();
  message("缓存已清除", { type: "success" });
};

const checkToken = () => {
  const data = getToken();
  const now = Date.now();
  const expires = data ? parseInt(data.expires) : 0;
  const isExpired = expires <= now;
  
  debugInfo.value.token = {
    exists: !!data,
    type: data ? "Bearer" : "无",
    isExpired,
    remainingTime: isExpired ? "已过期" : `${Math.floor((expires - now) / 1000 / 60)}分钟`,
    expiresTime: data ? new Date(expires).toLocaleString() : "无"
  };
};

const goToErrorPage = () => {
  router.push("/error/route-error");
};
</script>

<template>
  <div class="select-none">
    <img :src="bg" class="wave" />
    <div class="flex-c absolute right-5 top-3">
      <!-- 主题 -->
      <el-switch
        v-model="dataTheme"
        inline-prompt
        :active-icon="dayIcon"
        :inactive-icon="darkIcon"
        @change="dataThemeChange"
      />
      <!-- 国际化 -->
      <el-dropdown trigger="click">
        <globalization
          class="hover:text-primary hover:bg-[transparent]! w-[20px] h-[20px] ml-1.5 cursor-pointer outline-hidden duration-300"
        />
        <template #dropdown>
          <el-dropdown-menu class="translation">
            <el-dropdown-item
              :style="getDropdownItemStyle(locale, 'zh')"
              :class="['dark:text-white!', getDropdownItemClass(locale, 'zh')]"
              @click="translationCh"
            >
              <IconifyIconOnline
                v-show="locale === 'zh'"
                class="check-zh"
                icon="ep:check"
              />
              简体中文
            </el-dropdown-item>
            <el-dropdown-item
              :style="getDropdownItemStyle(locale, 'en')"
              :class="['dark:text-white!', getDropdownItemClass(locale, 'en')]"
              @click="translationEn"
            >
              <span v-show="locale === 'en'" class="check-en">
                <IconifyIconOnline icon="ep:check" />
              </span>
              English
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <div class="login-container">
      <div class="img">
        <component :is="toRaw(illustration)" />
      </div>
      <div class="login-box">
        <div class="login-form">
          <avatar class="avatar" />
          <Motion>
            <h2 class="outline-hidden">
              <TypeIt
                :options="{ strings: [title], cursor: false, speed: 100 }"
              />
            </h2>
          </Motion>

          <el-form
            v-if="currentPage === 0"
            ref="ruleFormRef"
            :model="ruleForm"
            :rules="loginRules"
            size="large"
          >
            <Motion :delay="100">
              <el-form-item
                :rules="[
                  {
                    required: true,
                    message: transformI18n($t('login.pureUsernameReg')),
                    trigger: 'blur'
                  }
                ]"
                prop="username"
              >
                <el-input
                  v-model="ruleForm.username"
                  clearable
                  :placeholder="t('login.pureUsername')"
                  :prefix-icon="null"
                >
                  <template #prefix>
                    <IconifyIconOnline
                      icon="ri:user-3-fill"
                      width="1.2em"
                      height="1.2em"
                />
                  </template>
                </el-input>
              </el-form-item>
            </Motion>

            <Motion :delay="150">
              <el-form-item prop="password">
                <el-input
                  v-model="ruleForm.password"
                  clearable
                  show-password
                  :placeholder="t('login.purePwd')"
                  :prefix-icon="null"
                >
                  <template #prefix>
                    <IconifyIconOnline
                      icon="ri:lock-fill"
                      width="1.2em"
                      height="1.2em"
                />
                  </template>
                </el-input>
              </el-form-item>
            </Motion>

            <Motion :delay="200">
              <el-form-item prop="verifyCode">
                <el-input
                  v-model="ruleForm.verifyCode"
                  clearable
                  :placeholder="isDevelopment ? t('login.pureVerifyCode') + '(开发模式自动填充)' : t('login.pureVerifyCode')"
                  :prefix-icon="null"
                >
                  <template #prefix>
                    <IconifyIconOnline
                      icon="ri:shield-keyhole-line"
                      width="1.2em"
                      height="1.2em"
                    />
                  </template>
                  <template #append>
                    <ReImageVerify v-model:code="imgCode" />
                  </template>
                </el-input>
              </el-form-item>
            </Motion>

            <Motion :delay="250">
              <el-form-item>
                <div class="w-full h-[20px] flex justify-between items-center">
                  <el-checkbox v-model="checked">
                    <span class="flex">
                      <select
                        v-model="loginDay"
                        :style="{
                          width: loginDay < 10 ? '10px' : '16px',
                          outline: 'none',
                          background: 'none',
                          appearance: 'none',
                          border: 'none'
                        }"
                      >
                        <option value="1">1</option>
                        <option value="7">7</option>
                        <option value="30">30</option>
                      </select>
                      {{ t("login.pureRemember") }}
                      <el-tooltip
                        effect="dark"
                        :content="t('login.pureRememberInfo')"
                        placement="right"
                      >
                        <span
                        class="ml-1 outline-none cursor-pointer"
                        >
                          <IconifyIconOnline
                            icon="ri:question-circle-fill"
                            width="1.2em"
                            height="1.2em"
                      />
                        </span>
                      </el-tooltip>
                    </span>
                  </el-checkbox>
                  <el-button type="text" @click="showDebugPanel = !showDebugPanel">
                    调试
                  </el-button>
                </div>
              </el-form-item>
            </Motion>

            <Motion :delay="300">
              <el-form-item>
                <el-button
                  class="w-full"
                  size="large"
                  type="primary"
                  :loading="loading"
                  @click="immediateDebounce(ruleFormRef)"
                >
                  {{ t("login.pureLogin") }}
                </el-button>
              </el-form-item>
            </Motion>
            
            <!-- 调试面板 -->
            <el-collapse-transition>
              <div v-if="showDebugPanel" class="debug-panel">
                <h3>调试面板</h3>
                <div class="debug-actions">
                  <el-button size="small" @click="clearStorage">清除缓存</el-button>
                  <el-button size="small" @click="checkToken">检查Token</el-button>
                  <el-button size="small" @click="goToErrorPage">错误页面</el-button>
                </div>
                <div class="debug-info" v-if="debugInfo.token">
                  <p><strong>Token信息:</strong></p>
                  <p>存在: {{ debugInfo.token.exists ? '是' : '否' }}</p>
                  <p v-if="debugInfo.token.exists">
                    过期: {{ debugInfo.token.isExpired ? '已过期' : '有效' }}
                    ({{ debugInfo.token.expiresTime }})
                  </p>
                </div>
              </div>
            </el-collapse-transition>
          </el-form>

          <Motion v-if="currentPage === 0" :delay="350">
            <el-form-item>
              <el-divider>
                <p class="text-gray-500 text-xs">
                  {{ t("login.pureThirdLogin") }}
                </p>
              </el-divider>
              <div class="w-full flex justify-evenly">
                <span
                  v-for="(item, index) in thirdParty"
                  :key="index"
                  :title="t(item.title)"
                >
                  <IconifyIconOnline
                    :icon="`ri:${item.icon}-fill`"
                    width="20"
                    class="cursor-pointer text-gray-500 hover:text-blue-400"
                  />
                </span>
              </div>
            </el-form-item>
          </Motion>
          <!-- 手机号登录 -->
          <LoginPhone v-if="currentPage === 1" />
          <!-- 二维码登录 -->
          <LoginQrCode v-if="currentPage === 2" />
          <!-- 注册 -->
          <LoginRegist v-if="currentPage === 3" />
          <!-- 忘记密码 -->
          <LoginUpdate v-if="currentPage === 4" />
        </div>
      </div>
    </div>
    <div
      class="w-full flex-c absolute bottom-3 text-sm text-[rgba(0,0,0,0.6)] dark:text-[rgba(220,220,242,0.8)]"
    >
      Copyright © 2020-present
      <a
        class="hover:text-primary!"
        href="https://github.com/pure-admin"
        target="_blank"
      >
        &nbsp;{{ title }}
      </a>
    </div>
  </div>
</template>

<style scoped>
@import url("@/style/login.css");
</style>

<style lang="scss" scoped>
:deep(.el-input-group__append, .el-input-group__prepend) {
  padding: 0;
}

.translation {
  ::v-deep(.el-dropdown-menu__item) {
    padding: 5px 40px;
  }

  .check-zh {
    position: absolute;
    left: 6px;
  }

  .check-en {
    position: absolute;
    left: 6px;
  }
}

/* 调试面板样式 */
.debug-panel {
  margin-top: 15px;
  padding: 10px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  background-color: #f8f9fa;
}

.debug-panel h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #606266;
  font-size: 14px;
}

.debug-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.debug-info {
  margin-top: 10px;
  font-size: 12px;
  color: #606266;
}

.debug-info p {
  margin: 5px 0;
}
</style>
