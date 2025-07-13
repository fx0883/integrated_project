<script lang="ts" setup>
import { defineProps, computed } from "vue";
import { useI18n } from "vue-i18n";
import type { PaymentStatus, InvoiceStatus } from "@/types/order";

const { t } = useI18n();

const props = defineProps<{
  type: "payment" | "invoice";
  status: PaymentStatus | InvoiceStatus;
  size?: "small" | "default" | "large";
}>();

// 支付状态配置
const paymentStatusConfig = {
  paid: {
    label: t("order.paymentStatusPaid"),
    type: "success"
  },
  unpaid: {
    label: t("order.paymentStatusUnpaid"),
    type: "danger"
  },
  partial: {
    label: t("order.paymentStatusPartial"),
    type: "warning"
  },
  refunded: {
    label: t("order.paymentStatusRefunded"),
    type: "info"
  },
  cancelled: {
    label: t("order.paymentStatusCancelled"),
    type: "info"
  }
};

// 发票状态配置
const invoiceStatusConfig = {
  issued: {
    label: t("order.invoiceStatusIssued"),
    type: "success"
  },
  pending: {
    label: t("order.invoiceStatusPending"),
    type: "warning"
  },
  not_required: {
    label: t("order.invoiceStatusNotRequired"),
    type: "info"
  }
};

// 计算状态配置
const statusConfig = computed(() => {
  if (props.type === "payment") {
    return (
      paymentStatusConfig[props.status as PaymentStatus] || {
        label: props.status,
        type: "info"
      }
    );
  } else if (props.type === "invoice") {
    return (
      invoiceStatusConfig[props.status as InvoiceStatus] || {
        label: props.status,
        type: "info"
      }
    );
  }
  return { label: props.status, type: "info" };
});

// 标签尺寸
const tagSize = computed(() => props.size || "default");
</script>

<template>
  <el-tag
    :type="statusConfig.type"
    :size="tagSize"
    :effect="tagSize === 'small' ? 'plain' : 'light'"
  >
    {{ statusConfig.label }}
  </el-tag>
</template>

<style scoped>
.el-tag {
  text-transform: capitalize;
}
</style>
