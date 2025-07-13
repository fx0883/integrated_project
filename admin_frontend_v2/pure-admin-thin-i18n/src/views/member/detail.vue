<template>
  <div class="member-detail-container">
    <div class="page-header">
      <div class="left">
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          {{ $t("common.back") }}
        </el-button>
        <h2>{{ $t("member.memberDetail") }}</h2>
      </div>
      <div class="right" v-if="hasManagePermission">
        <el-button type="primary" @click="handleEdit">
          <el-icon><Edit /></el-icon>
          {{ $t("common.edit") }}
        </el-button>
        <el-button type="danger" @click="handleDelete">
          <el-icon><Delete /></el-icon>
          {{ $t("common.delete") }}
        </el-button>
      </div>
    </div>

    <el-row :gutter="16">
      <!-- 基本信息卡片 -->
      <el-col :span="16">
        <el-card class="detail-card">
          <el-tabs v-model="activeTab">
            <el-tab-pane :label="$t('member.basicInfo')" name="basic">
              <div v-loading="detailLoading">
                <div class="member-info" v-if="memberData">
                  <el-descriptions :column="2" border>
                    <el-descriptions-item :label="$t('member.id')">
                      {{ memberData.id }}
                    </el-descriptions-item>
                    <el-descriptions-item :label="$t('member.username')">
                      {{ memberData.username }}
                    </el-descriptions-item>
                    <el-descriptions-item :label="$t('member.name')">
                      {{
                        memberData.nick_name ||
                        (memberData.first_name && memberData.last_name
                          ? `${memberData.first_name} ${memberData.last_name}`
                          : memberData.first_name ||
                            memberData.last_name ||
                            $t("common.notSet"))
                      }}
                    </el-descriptions-item>
                    <el-descriptions-item :label="$t('member.email')">
                      {{ memberData.email }}
                    </el-descriptions-item>
                    <el-descriptions-item :label="$t('member.phone')">
                      {{ memberData.phone || $t("common.notSet") }}
                    </el-descriptions-item>
                    <el-descriptions-item :label="$t('member.status')">
                      <MemberStatusTag :status="memberData.status" />
                    </el-descriptions-item>
                    <el-descriptions-item
                      :label="$t('member.tenant')"
                      v-if="isSuperAdmin"
                    >
                      {{ memberData.tenant_name || $t("common.notSet") }}
                    </el-descriptions-item>
                    <el-descriptions-item :label="$t('member.createdAt')">
                      {{ memberData.created_at }}
                    </el-descriptions-item>
                    <el-descriptions-item :label="$t('member.lastLogin')">
                      {{ memberData.last_login || $t("common.never") }}
                    </el-descriptions-item>
                    <el-descriptions-item :label="$t('member.notes')" :span="2">
                      {{ memberData.notes || $t("common.noNotes") }}
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane
              :label="$t('member.customerRelations')"
              name="relations"
            >
              <div v-loading="relationLoading">
                <div class="card-header">
                  <el-button
                    type="primary"
                    size="small"
                    @click="handleAddRelation"
                    v-if="hasManagePermission"
                  >
                    <el-icon><Plus /></el-icon>
                    {{ $t("member.addRelation") }}
                  </el-button>
                </div>
                <div class="relation-list">
                  <el-table
                    :data="customerRelations"
                    style="width: 100%"
                    border
                  >
                    <el-table-column
                      prop="customer.name"
                      :label="$t('member.customer')"
                      min-width="150"
                      show-overflow-tooltip
                    />
                    <el-table-column
                      prop="customer.type"
                      :label="$t('member.customerType')"
                      min-width="120"
                      show-overflow-tooltip
                    >
                      <template #default="{ row }">
                        {{ formatCustomerType(row.customer.type) }}
                      </template>
                    </el-table-column>
                    <el-table-column
                      :label="$t('common.operations')"
                      width="120"
                      fixed="right"
                      v-if="hasManagePermission"
                    >
                      <template #default="{ row }">
                        <el-button
                          link
                          type="danger"
                          size="small"
                          @click="handleDeleteRelation(row)"
                        >
                          {{ $t("common.delete") }}
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                  <div
                    class="empty-relation"
                    v-if="customerRelations.length === 0"
                  >
                    {{ $t("member.noRelations") }}
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane :label="$t('order.memberOrders')" name="orders">
              <MemberOrderList :member-id="memberId" />
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>

      <!-- 侧边栏 -->
      <el-col :span="8">
        <!-- 头像卡片 -->
        <el-card class="avatar-card" v-loading="avatarLoading">
          <template #header>
            <div class="card-header">
              <h3>{{ $t("member.avatar") }}</h3>
            </div>
          </template>
          <div class="avatar-container">
            <AvatarUpload
              :avatar-url="memberData?.avatar"
              :disabled="!hasManagePermission"
              :loading="avatarUploading"
              @update="handleAvatarUpload"
            />
          </div>
        </el-card>

        <!-- 密码管理卡片 -->
        <el-card class="password-card" v-if="hasManagePermission">
          <template #header>
            <div class="card-header">
              <h3>{{ $t("member.passwordManagement") }}</h3>
            </div>
          </template>
          <div class="password-container">
            <el-button
              type="warning"
              @click="handleResetPassword"
              :loading="passwordResetting"
            >
              {{ $t("member.resetPassword") }}
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 客户关系表单对话框 -->
    <el-dialog
      v-model="relationDialog.visible"
      :title="relationDialog.title"
      width="500px"
      :close-on-click-modal="false"
    >
      <CustomerRelationForm
        :member-id="memberId"
        :relation-data="relationDialog.data"
        :is-edit="relationDialog.isEdit"
        :loading="relationDialog.loading"
        @submit="handleRelationSubmit"
        @cancel="relationDialog.visible = false"
      />
    </el-dialog>

    <!-- 密码重置对话框 -->
    <ConfirmDialog
      v-model:visible="passwordDialog.visible"
      :title="$t('member.resetPasswordTitle')"
      :content="$t('member.resetPasswordConfirm')"
      type="warning"
      :loading="passwordDialog.loading"
      :confirm-text="$t('common.confirm')"
      :cancel-text="$t('common.cancel')"
      :show-input="true"
      input-type="password"
      :input-placeholder="$t('member.newPasswordPlaceholder')"
      @confirm="handlePasswordDialogConfirm"
      @cancel="passwordDialog.visible = false"
    />

    <!-- 删除确认对话框 -->
    <ConfirmDialog
      v-model:visible="confirmDialog.visible"
      :title="confirmDialog.title"
      :content="confirmDialog.content"
      :type="confirmDialog.type"
      :loading="confirmDialog.loading"
      :confirm-text="$t('common.confirm')"
      :cancel-text="$t('common.cancel')"
      @confirm="handleConfirmDialogConfirm"
      @cancel="handleConfirmDialogCancel"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft, Edit, Delete, Plus } from "@element-plus/icons-vue";
import { useMemberStoreHook } from "@/store/modules/member";
import { useUserStoreHook } from "@/store/modules/user";
import { hasPerms } from "@/utils/auth";
import type {
  Member,
  MemberCustomerRelation,
  MemberCustomerRelationCreateUpdateParams
} from "@/types/member";
import {
  MemberStatusTag,
  AvatarUpload,
  CustomerRelationForm,
  ConfirmDialog
} from "@/components/MemberManagement";
import logger from "@/utils/logger";
import MemberOrderList from "@/components/OrderManagement/MemberOrderList.vue";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const memberStore = useMemberStoreHook();
const userStore = useUserStoreHook();

// 检查用户是否有管理权限
const hasManagePermission = computed(
  () => userStore.is_super_admin || hasPerms("member:manage")
);

// 是否为超级管理员
const isSuperAdmin = computed(() => userStore.is_super_admin);

// 会员ID
const memberId = computed(() => Number(route.params.id));

// 会员数据
const memberData = computed<Member | null>(() => memberStore.currentMember);

// 客户关系列表
const customerRelations = computed<MemberCustomerRelation[]>(
  () => memberStore.getCustomerRelations
);

// 各种加载状态
const detailLoading = ref(false);
const relationLoading = ref(false);
const avatarLoading = ref(false);
const avatarUploading = ref(false);
const passwordResetting = ref(false);

// 客户关系对话框状态
const relationDialog = reactive({
  visible: false,
  title: "",
  isEdit: false,
  loading: false,
  data: null as MemberCustomerRelation | null
});

// 密码重置对话框状态
const passwordDialog = reactive({
  visible: false,
  loading: false
});

// 确认对话框相关状态
const confirmDialog = reactive({
  visible: false,
  title: "",
  content: "",
  type: "warning" as "warning" | "danger" | "info",
  loading: false,
  confirmCallback: null as (() => void) | null
});

// 打开确认对话框
const openConfirmDialog = (
  title: string,
  content: string,
  type: "warning" | "danger" | "info",
  callback: () => void
) => {
  confirmDialog.visible = true;
  confirmDialog.title = title;
  confirmDialog.content = content;
  confirmDialog.type = type;
  confirmDialog.confirmCallback = callback;
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

// 获取会员详情
const fetchMemberDetail = async () => {
  if (!memberId.value) {
    ElMessage.error(t("member.invalidId"));
    router.push("/member/index");
    return;
  }

  detailLoading.value = true;
  try {
    await memberStore.fetchMemberDetail(memberId.value);
    if (!memberStore.currentMember) {
      ElMessage.error(t("member.notFound"));
      router.push("/member/index");
    }
  } catch (error) {
    logger.error("获取会员详情失败", error);
    router.push("/member/index");
  } finally {
    detailLoading.value = false;
  }
};

// 获取会员客户关系列表
const fetchCustomerRelations = async () => {
  if (!memberId.value) return;

  relationLoading.value = true;
  try {
    await memberStore.fetchMemberCustomerRelations(memberId.value);
  } catch (error) {
    logger.error("获取会员客户关系列表失败", error);
  } finally {
    relationLoading.value = false;
  }
};

// 返回上一页
const goBack = () => {
  router.back();
};

// 处理编辑
const handleEdit = () => {
  router.push(`/member/edit/${memberId.value}`);
};

// 处理删除
const handleDelete = () => {
  openConfirmDialog(
    t("member.deleteTitle"),
    t("member.deleteConfirm", {
      name: memberData.value?.nick_name || memberData.value?.first_name || ""
    }),
    "danger",
    async () => {
      try {
        await memberStore.removeMember(memberId.value);
        ElMessage.success(t("member.deleteSuccess"));
        router.push("/member/index");
      } catch (error) {
        logger.error("删除会员失败", error);
      }
    }
  );
};

// 处理头像上传
const handleAvatarUpload = async (file: File) => {
  if (!memberId.value) return;

  avatarUploading.value = true;
  try {
    const formData = new FormData();
    formData.append("avatar", file);
    await memberStore.uploadMemberAvatar(memberId.value, formData);
    ElMessage.success(t("member.avatarUploadSuccess"));
  } catch (error) {
    logger.error("上传头像失败", error);
  } finally {
    avatarUploading.value = false;
  }
};

// 处理重置密码
const handleResetPassword = () => {
  passwordDialog.visible = true;
};

// 处理密码重置对话框确认
const handlePasswordDialogConfirm = async (password: string) => {
  if (!memberId.value || !password) return;

  passwordDialog.loading = true;
  try {
    await memberStore.resetMemberPassword(memberId.value, {
      new_password: password
    });
    ElMessage.success(t("member.resetPasswordSuccess"));
    passwordDialog.visible = false;
  } catch (error) {
    logger.error("重置密码失败", error);
  } finally {
    passwordDialog.loading = false;
  }
};

// 处理添加客户关系
const handleAddRelation = () => {
  relationDialog.title = t("member.addRelation");
  relationDialog.isEdit = false;
  relationDialog.data = null;
  relationDialog.visible = true;
};

// 处理删除客户关系
const handleDeleteRelation = (row: MemberCustomerRelation) => {
  if (!memberId.value) return;

  openConfirmDialog(
    t("member.deleteRelationTitle"),
    t("member.deleteRelationConfirm", { name: row.customer.name }),
    "danger",
    async () => {
      try {
        await memberStore.removeMemberCustomerRelation(
          memberId.value,
          row.customer.id
        );
        ElMessage.success(t("member.deleteRelationSuccess"));
      } catch (error) {
        logger.error("删除客户关系失败", error);
      }
    }
  );
};

// 处理客户关系表单提交
const handleRelationSubmit = async (
  data: MemberCustomerRelationCreateUpdateParams
) => {
  relationDialog.loading = true;
  try {
    if (relationDialog.isEdit && relationDialog.data) {
      // 编辑模式
      await memberStore.updateMemberCustomerRelation(
        memberId.value,
        relationDialog.data.id,
        {
          customer_id: data.customer_id,
          role: data.role,
          is_primary: data.is_primary,
          remarks: data.remarks
        }
      );
      ElMessage.success(t("member.updateRelationSuccess"));
    } else {
      // 创建模式
      const response = await memberStore.createMemberCustomerRelation({
        ...data,
        member_id: memberId.value
      });
      if (response && response.success) {
        ElMessage.success(t("member.createRelationSuccess"));
      }
    }
    relationDialog.visible = false;
    // 重新获取客户关系列表以确保数据是最新的
    await fetchCustomerRelations();
  } catch (error) {
    logger.error("保存客户关系失败", error);
    ElMessage.error(t("member.saveRelationFailed"));
  } finally {
    relationDialog.loading = false;
  }
};

// 格式化客户类型
const formatCustomerType = (type: string) => {
  const typeMap: Record<string, string> = {
    enterprise: t("customer.typeEnterprise"),
    individual: t("customer.typeIndividual"),
    government: t("customer.typeGovernment"),
    education: t("customer.typeEducation"),
    nonprofit: t("customer.typeNonprofit")
  };
  return typeMap[type] || type;
};

// 添加activeTab的状态变量
const activeTab = ref("basic");

// 初始化
onMounted(() => {
  fetchMemberDetail();
  fetchCustomerRelations();
});
</script>

<style scoped>
.member-detail-container {
  padding: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header .left {
  display: flex;
  align-items: center;
}

.page-header h2 {
  margin: 0 0 0 16px;
  font-size: 20px;
  font-weight: 500;
}

.detail-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.avatar-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.password-container {
  padding: 20px 0;
  text-align: center;
}

.empty-relation {
  padding: 20px;
  text-align: center;
  color: var(--el-text-color-secondary);
}
</style>
