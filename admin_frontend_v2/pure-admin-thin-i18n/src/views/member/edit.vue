<template>
  <div class="member-edit-container">
    <div class="page-header">
      <div class="left">
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          {{ $t("common.back") }}
        </el-button>
        <h2>{{ $t("member.editMember") }}</h2>
      </div>
    </div>

    <el-card class="form-card" v-loading="detailLoading">
      <MemberForm
        :member-data="memberData"
        :is-edit="true"
        :loading="updateLoading"
        :show-tenant-select="false"
        @submit="handleSubmit"
        @cancel="goBack"
      />
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft } from "@element-plus/icons-vue";
import { useMemberStoreHook } from "@/store/modules/member";
import { MemberForm } from "@/components/MemberManagement";
import type { Member, MemberCreateUpdateParams } from "@/types/member";
import logger from "@/utils/logger";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const memberStore = useMemberStoreHook();

// 会员ID
const memberId = computed(() => Number(route.params.id));

// 会员数据
const memberData = computed<Member | null>(() => memberStore.currentMember);

// 详情加载状态
const detailLoading = ref(false);

// 更新加载状态
const updateLoading = ref(false);

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

// 处理表单提交
const handleSubmit = async (data: MemberCreateUpdateParams) => {
  if (!memberId.value) return;

  updateLoading.value = true;
  try {
    await memberStore.updateMemberInfo(memberId.value, data);
    ElMessage.success(t("member.updateSuccess"));
    router.push(`/member/detail/${memberId.value}`);
  } catch (error) {
    logger.error("更新会员信息失败", error);
  } finally {
    updateLoading.value = false;
  }
};

// 返回上一页
const goBack = () => {
  router.back();
};

// 初始化
onMounted(() => {
  fetchMemberDetail();
});
</script>

<style scoped>
.member-edit-container {
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

.form-card {
  margin-bottom: 16px;
}
</style>
