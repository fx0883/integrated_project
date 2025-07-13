<script lang="ts" setup>
import { ref, reactive, defineEmits, defineProps } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { bulkUpdateOrders } from "@/api/modules/order";
import type {
  OrderBulkOperationParams,
  PaymentStatus,
  ServiceType
} from "@/types/order";

const { t } = useI18n();

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  selectedOrders: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "success"): void;
}>();

// 更新字段选择
const selectedFields = ref<string[]>([]);

// 可更新的字段
const availableFields = [
  { value: "payment_status", label: t("order.paymentStatus") },
  { value: "service_type", label: t("order.serviceType") },
  { value: "project_manager", label: t("order.projectManager") },
  { value: "translator", label: t("order.translator") },
  { value: "invoice_status", label: t("order.invoiceStatus") }
];

// 表单数据
const formData = reactive({
  payment_status: "" as PaymentStatus,
  service_type: "" as ServiceType,
  project_manager: "",
  translator: "",
  invoice_status: ""
});

// 支付状态选项
const paymentStatusOptions = [
  { value: "paid", label: t("order.paymentStatusPaid") },
  { value: "unpaid", label: t("order.paymentStatusUnpaid") },
  { value: "partial", label: t("order.paymentStatusPartial") },
  { value: "refunded", label: t("order.paymentStatusRefunded") },
  { value: "cancelled", label: t("order.paymentStatusCancelled") }
];

// 服务类型选项
const serviceTypeOptions = [
  { value: "文档翻译", label: t("order.serviceTypeDocument") },
  { value: "口译服务", label: t("order.serviceTypeInterpretation") },
  { value: "校对服务", label: t("order.serviceTypeProofreading") },
  { value: "本地化服务", label: t("order.serviceTypeLocalization") },
  { value: "其他", label: t("order.serviceTypeOther") }
];

// 发票状态选项
const invoiceStatusOptions = [
  { value: "issued", label: t("order.invoiceStatusIssued") },
  { value: "pending", label: t("order.invoiceStatusPending") },
  { value: "not_required", label: t("order.invoiceStatusNotRequired") }
];

// 提交状态
const submitting = ref(false);
const updateResult = ref<{
  success_count: number;
  failed_count: number;
  failed_ids?: number[];
  error_messages?: Record<string, string>;
} | null>(null);

// 关闭对话框
const handleClose = () => {
  if (submitting.value) {
    return;
  }
  emit("update:visible", false);
  resetForm();
};

// 重置表单
const resetForm = () => {
  selectedFields.value = [];
  Object.keys(formData).forEach(key => {
    formData[key] = "";
  });
  updateResult.value = null;
};

// 提交批量更新
const submitUpdate = async () => {
  if (selectedFields.value.length === 0) {
    ElMessage.warning(t("order.noFieldsSelected"));
    return;
  }

  if (props.selectedOrders.length === 0) {
    ElMessage.warning(t("order.noOrdersSelected"));
    return;
  }

  // 构建更新数据
  const updateData = {};
  selectedFields.value.forEach(field => {
    updateData[field] = formData[field];
  });

  // 构建请求参数
  const params: OrderBulkOperationParams = {
    order_ids: props.selectedOrders.map(order => order.id),
    operation_type: "update",
    data: updateData
  };

  submitting.value = true;
  try {
    const response = await bulkUpdateOrders(params);
    if (response.success) {
      updateResult.value = response.data;
      if (response.data.failed_count === 0) {
        ElMessage.success(t("order.batchUpdateSuccess"));
      } else {
        ElMessage.warning(t("order.batchUpdatePartial"));
      }
      emit("success");
    } else {
      ElMessage.error(response.message || t("order.batchUpdateFailed"));
    }
  } catch (error) {
    console.error("Failed to batch update orders:", error);
    ElMessage.error(t("order.batchUpdateFailed"));
  } finally {
    submitting.value = false;
  }
};

// 重新开始更新
const resetUpdate = () => {
  resetForm();
};

// 检查字段是否被选中
const isFieldSelected = (field: string) => {
  return selectedFields.value.includes(field);
};
</script>

<template>
  <el-dialog
    :title="t('order.batchUpdateTitle')"
    :modelValue="visible"
    @update:modelValue="val => emit('update:visible', val)"
    @close="handleClose"
    width="550px"
    class="batch-update-dialog"
  >
    <div class="batch-update-content">
      <!-- 选中的订单信息 -->
      <div class="selected-orders-info">
        <el-alert
          :title="
            t('order.selectedOrdersInfo', { count: selectedOrders.length })
          "
          type="info"
          :closable="false"
          show-icon
        />
      </div>

      <!-- 更新结果 -->
      <div class="update-result" v-if="updateResult">
        <h4>{{ t("order.updateResult") }}</h4>

        <div class="result-summary">
          <div class="result-item success">
            <span class="result-label">{{ t("order.successCount") }}:</span>
            <span class="result-value">{{ updateResult.success_count }}</span>
          </div>
          <div class="result-item failed">
            <span class="result-label">{{ t("order.failedCount") }}:</span>
            <span class="result-value">{{ updateResult.failed_count }}</span>
          </div>
          <div class="result-item total">
            <span class="result-label">{{ t("order.totalCount") }}:</span>
            <span class="result-value">{{
              updateResult.success_count + updateResult.failed_count
            }}</span>
          </div>
        </div>

        <!-- 错误详情 -->
        <div
          class="error-details"
          v-if="updateResult.failed_count > 0 && updateResult.error_messages"
        >
          <h5>{{ t("order.errorDetails") }}</h5>
          <el-table
            :data="
              Object.entries(updateResult.error_messages).map(
                ([id, message]) => ({ id, message })
              )
            "
            size="small"
            border
          >
            <el-table-column
              prop="id"
              :label="t('order.orderId')"
              width="100"
            />
            <el-table-column prop="message" :label="t('order.errorMessage')" />
          </el-table>
        </div>
      </div>

      <!-- 更新表单 -->
      <div v-if="!updateResult" class="update-form">
        <h4>{{ t("order.selectFieldsToUpdate") }}</h4>

        <el-form label-width="120px">
          <!-- 字段选择 -->
          <el-form-item :label="t('order.fieldsToUpdate')">
            <el-checkbox-group v-model="selectedFields">
              <el-checkbox
                v-for="field in availableFields"
                :key="field.value"
                :label="field.value"
              >
                {{ field.label }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <!-- 支付状态 -->
          <el-form-item
            :label="t('order.paymentStatus')"
            v-if="isFieldSelected('payment_status')"
          >
            <el-select v-model="formData.payment_status" class="full-width">
              <el-option
                v-for="option in paymentStatusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>

          <!-- 服务类型 -->
          <el-form-item
            :label="t('order.serviceType')"
            v-if="isFieldSelected('service_type')"
          >
            <el-select v-model="formData.service_type" class="full-width">
              <el-option
                v-for="option in serviceTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>

          <!-- 项目经理 -->
          <el-form-item
            :label="t('order.projectManager')"
            v-if="isFieldSelected('project_manager')"
          >
            <el-input v-model="formData.project_manager" />
          </el-form-item>

          <!-- 译员 -->
          <el-form-item
            :label="t('order.translator')"
            v-if="isFieldSelected('translator')"
          >
            <el-input v-model="formData.translator" />
          </el-form-item>

          <!-- 发票状态 -->
          <el-form-item
            :label="t('order.invoiceStatus')"
            v-if="isFieldSelected('invoice_status')"
          >
            <el-select v-model="formData.invoice_status" class="full-width">
              <el-option
                v-for="option in invoiceStatusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 对话框底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">
          {{ t("common.close") }}
        </el-button>

        <template v-if="!updateResult">
          <el-button
            type="primary"
            @click="submitUpdate"
            :loading="submitting"
            :disabled="selectedFields.length === 0"
          >
            {{ t("order.batchUpdate") }}
          </el-button>
        </template>

        <template v-else>
          <el-button type="primary" @click="resetUpdate">
            {{ t("order.updateAgain") }}
          </el-button>
        </template>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.batch-update-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

.batch-update-content {
  min-height: 300px;
}

.selected-orders-info {
  margin-bottom: 20px;
}

.update-form {
  margin-top: 20px;
}

.update-form h4 {
  margin-top: 0;
  margin-bottom: 15px;
}

.full-width {
  width: 100%;
}

.update-result {
  padding: 10px 0;
}

.update-result h4 {
  margin-top: 0;
  margin-bottom: 15px;
}

.result-summary {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.result-item {
  flex: 1;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
}

.result-item.success {
  background-color: #f0f9eb;
  color: #67c23a;
}

.result-item.failed {
  background-color: #fef0f0;
  color: #f56c6c;
}

.result-item.total {
  background-color: #f4f4f5;
  color: #909399;
}

.result-label {
  font-weight: bold;
  margin-right: 5px;
}

.error-details {
  margin-top: 20px;
}

.error-details h5 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #f56c6c;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
