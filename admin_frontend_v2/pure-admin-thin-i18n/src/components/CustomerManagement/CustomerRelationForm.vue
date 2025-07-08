<template>
  <div class="customer-relation-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      :disabled="mode === 'view' || loading"
    >
      <!-- 会员选择 -->
      <el-form-item
        :label="$t('customer.member.memberSelect')"
        prop="member_id"
      >
        <el-select
          v-model="formData.member_id"
          :placeholder="$t('customer.member.memberSelectPlaceholder')"
          filterable
          remote
          :remote-method="remoteMemberSearch"
          :loading="memberSearchLoading"
          style="width: 100%"
          :disabled="mode !== 'create'"
        >
          <el-option
            v-for="item in memberOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <!-- 角色 -->
      <el-form-item :label="$t('customer.member.role')" prop="role">
        <el-input
          v-model="formData.role"
          :placeholder="$t('customer.member.rolePlaceholder')"
        />
      </el-form-item>

      <!-- 是否主要联系人 -->
      <el-form-item :label="$t('customer.member.isPrimary')" prop="is_primary">
        <el-switch v-model="formData.is_primary" />
      </el-form-item>

      <!-- 备注 -->
      <el-form-item :label="$t('customer.member.notes')" prop="remarks">
        <el-input
          v-model="formData.remarks"
          type="textarea"
          :rows="3"
          :placeholder="$t('customer.member.notesPlaceholder')"
        />
      </el-form-item>

      <!-- 按钮组 -->
      <el-form-item>
        <el-button
          v-if="mode !== 'view'"
          type="primary"
          :loading="loading"
          @click="handleSubmit"
        >
          {{ $t("common.save") }}
        </el-button>
        <el-button @click="handleCancel">
          {{ mode === "view" ? $t("common.close") : $t("common.cancel") }}
        </el-button>
        <el-button v-if="mode !== 'view'" @click="resetForm">
          {{ $t("common.reset") }}
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, defineProps, defineEmits, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { useMemberStoreHook } from "@/store/modules/member";
import type {
  MemberCustomerRelation,
  MemberCustomerRelationCreateUpdateParams
} from "@/types/member";
import logger from "@/utils/logger";

const { t } = useI18n();
const memberStore = useMemberStoreHook();

// Props定义
const props = defineProps({
  // 操作模式
  mode: {
    type: String as () => "create" | "edit" | "view",
    required: true
  },
  // 会员关系数据
  memberRelation: {
    type: Object as () => MemberCustomerRelation | null,
    default: null
  },
  // 客户ID
  customerId: {
    type: Number,
    required: true
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false
  }
});

// 事件定义
const emit = defineEmits(["submit", "cancel"]);

// 表单引用
const formRef = ref<FormInstance>();

// 会员搜索加载状态
const memberSearchLoading = ref(false);

// 会员选项
const memberOptions = ref<Array<{ value: number; label: string }>>([]);

// 表单数据
const formData = reactive<MemberCustomerRelationCreateUpdateParams & { remarks: string }>({
  customer_id: props.customerId,
  member_id: 0,
  role: "",
  is_primary: false,
  notes: "", // 保留notes字段以保持向后兼容
  remarks: "" // 添加新的remarks字段，API现在使用remarks而不是notes
});

// 表单验证规则
const rules = reactive<FormRules>({
  member_id: [
    {
      required: true,
      message: t("customer.member.memberRequired"),
      trigger: "change"
    }
  ],
  role: [
    {
      required: true,
      message: t("customer.member.roleRequired"),
      trigger: "blur"
    },
    {
      max: 50,
      message: t("common.form.maxLength", { max: 50 }),
      trigger: "blur"
    }
  ],

  remarks: [
    {
      max: 500,
      message: t("common.form.maxLength", { max: 500 }),
      trigger: "blur"
    }
  ]
});

// 远程搜索会员
const remoteMemberSearch = async (query: string) => {
  if (query.length < 2) return;

  memberSearchLoading.value = true;
  try {
    const response = await memberStore.searchMembers(query);
    if (response.data && response.data.results) {
      memberOptions.value = response.data.results.map(member => ({
        value: member.id,
        label: `${member.username} - ${member.nick_name || member.first_name + " " + member.last_name || member.email}`
      }));
    }
  } catch (error) {
    logger.error("搜索会员失败", error);
    ElMessage.error(t("customer.member.searchMemberFailed"));
  } finally {
    memberSearchLoading.value = false;
  }
};

// 初始化表单数据
const initFormData = () => {
  if (props.mode !== "create" && props.memberRelation) {
    formData.customer_id = props.customerId;
    formData.member_id = props.memberRelation.member.id;
    formData.role = props.memberRelation.role || "";
    formData.is_primary = props.memberRelation.is_primary || false;
    formData.notes = ""; // 保留notes字段但设为空字符串
    formData.remarks = props.memberRelation.remarks !== null ? props.memberRelation.remarks || "" : ""; // 确保null值被转换为空字符串

    // 添加当前会员到选项中
    if (props.memberRelation.member) {
      memberOptions.value = [
        {
          value: props.memberRelation.member.id,
          label: `${props.memberRelation.member.username} - ${props.memberRelation.member.name || props.memberRelation.member.email}`
        }
      ];
    }
  } else {
    resetForm();
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate((valid, fields) => {
    if (valid) {
      // 创建一个新对象，将notes替换为remarks
      const submitData = {
        customer_id: formData.customer_id,
        member_id: formData.member_id,
        role: formData.role,
        is_primary: formData.is_primary,
        remarks: formData.remarks // 使用remarks替代notes
      };
      emit("submit", submitData);
    } else {
      logger.warn("表单验证失败", fields);
      ElMessage.warning(t("common.form.validationFailed"));
    }
  });
};

// 取消操作
const handleCancel = () => {
  emit("cancel");
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }

  formData.customer_id = props.customerId;
  formData.member_id = 0;
  formData.role = "";
  formData.is_primary = false;
  formData.notes = "";
  formData.remarks = "";

  memberOptions.value = [];
};

// 监听props变化
watch(
  () => props.memberRelation,
  () => {
    initFormData();
  }
);

// 组件挂载时初始化
onMounted(() => {
  initFormData();
});
</script>

<style scoped>
.customer-relation-form {
  max-width: 600px;
  margin: 0 auto;
}
</style>
