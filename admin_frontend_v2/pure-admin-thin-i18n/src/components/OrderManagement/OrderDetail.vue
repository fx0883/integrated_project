<script lang="ts" setup>
import { defineProps, computed } from "vue";
import { useI18n } from "vue-i18n";
import type { Order } from "@/types/order";
import OrderStatusTag from "./OrderStatusTag.vue";

const { t } = useI18n();

const props = defineProps<{
  order: Order;
  loading?: boolean;
}>();

// 计算毛利信息
const profitInfo = computed(() => {
  const customerTotal = parseFloat(props.order.customer_total_amount || "0");
  const translatorFee = parseFloat(props.order.translator_fee || "0");
  const projectFee = parseFloat(props.order.project_fee || "0");

  const profit = customerTotal - translatorFee - projectFee;
  const profitRate = customerTotal > 0 ? profit / customerTotal : 0;

  return {
    profit: profit.toFixed(2),
    profitRate: (profitRate * 100).toFixed(2) + "%"
  };
});

// 计算客户名称
const customerName = computed(() => {
  if (
    typeof props.order.customer === "object" &&
    props.order.customer !== null &&
    props.order.customer.name
  ) {
    return props.order.customer.name;
  }
  return props.order.customer_name || t("common.notSpecified");
});

// 计算客户联系人名称
const contactPersonName = computed(() => {
  // 如果customer_contact_info存在且有display_name
  if (
    props.order.customer_contact_info &&
    props.order.customer_contact_info.display_name
  ) {
    return props.order.customer_contact_info.display_name;
  }
  // 如果customer_contact是对象且有name或display_name
  else if (
    typeof props.order.customer_contact === "object" &&
    props.order.customer_contact !== null
  ) {
    return (
      props.order.customer_contact.display_name ||
      props.order.customer_contact.name ||
      t("common.notSpecified")
    );
  }
  // 如果是ID
  else if (props.order.customer_contact) {
    return `${t("common.contact")} ${props.order.customer_contact}`;
  } else {
    return t("common.notSpecified");
  }
});
</script>

<template>
  <div v-loading="loading" class="order-detail">
    <el-descriptions :title="t('order.orderDetails')" :column="2" border>
      <template #extra>
        <div class="status-tags">
          <OrderStatusTag type="payment" :status="order.payment_status" />
          <OrderStatusTag
            v-if="order.invoice_status"
            type="invoice"
            :status="order.invoice_status"
          />
        </div>
      </template>

      <el-descriptions-item :label="t('order.orderNumber')">
        {{ order.order_number }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('order.createdAt')">
        {{ order.created_at }}
      </el-descriptions-item>

      <el-descriptions-item :label="t('order.customer')">
        {{ customerName }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('order.contactPerson')">
        {{ contactPersonName }}
      </el-descriptions-item>

      <el-descriptions-item :label="t('order.serviceType')">
        {{ order.service_type }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('order.language')">
        {{ order.language }}
      </el-descriptions-item>

      <el-descriptions-item :label="t('order.orderDate')">
        {{ order.order_date || t("common.notSpecified") }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('order.serviceTime')">
        {{ order.service_time || t("common.notSpecified") }}
      </el-descriptions-item>

      <el-descriptions-item :label="t('order.customerCount')">
        {{ order.customer_count }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('order.translationCount')">
        {{ order.translation_count || t("common.notSpecified") }}
      </el-descriptions-item>
    </el-descriptions>

    <el-divider />

    <!-- 价格信息 -->
    <h3 class="section-title">{{ t("order.priceAndPayment") }}</h3>
    <el-descriptions :column="2" border>
      <el-descriptions-item :label="t('order.translator')" :span="2">
        {{ order.translator || t("common.notSpecified") }}
      </el-descriptions-item>

      <el-descriptions-item :label="t('order.customerPrice')">
        {{ order.customer_price || t("common.notSpecified") }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('order.customerTotalAmount')">
        {{ order.customer_total_amount }}
      </el-descriptions-item>

      <el-descriptions-item :label="t('order.translatorPrice')">
        {{ order.translator_price || t("common.notSpecified") }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('order.translatorFee')">
        {{ order.translator_fee || t("common.notSpecified") }}
      </el-descriptions-item>

      <el-descriptions-item :label="t('order.projectFee')">
        {{ order.project_fee || t("common.notSpecified") }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('order.profit')">
        <span class="profit">{{ profitInfo.profit }}</span>
        <span class="profit-rate">({{ profitInfo.profitRate }})</span>
      </el-descriptions-item>

      <el-descriptions-item :label="t('order.paymentStatus')" :span="2">
        <OrderStatusTag type="payment" :status="order.payment_status" />
        <span class="status-text">{{ order.payment_status_display }}</span>
      </el-descriptions-item>

      <el-descriptions-item
        :label="t('order.paymentDate')"
        v-if="order.payment_date"
      >
        {{ order.payment_date }}
      </el-descriptions-item>
      <el-descriptions-item
        :label="t('order.paymentMethod')"
        v-if="order.payment_method"
      >
        {{ order.payment_method }}
      </el-descriptions-item>
    </el-descriptions>

    <div v-if="order.payment_remarks" class="remarks-section">
      <h4>{{ t("order.paymentRemarks") }}</h4>
      <p>{{ order.payment_remarks }}</p>
    </div>

    <el-divider />

    <!-- 项目和发票信息 -->
    <h3 class="section-title">{{ t("order.additionalInfo") }}</h3>
    <el-descriptions :column="2" border>
      <el-descriptions-item :label="t('order.projectManager')" :span="2">
        {{ order.project_manager || t("common.notSpecified") }}
      </el-descriptions-item>

      <el-descriptions-item
        :label="t('order.projectLocation')"
        v-if="order.project_location"
      >
        {{ order.project_location }}
      </el-descriptions-item>
      <el-descriptions-item
        :label="t('order.sourcePlatform')"
        v-if="order.source_platform"
      >
        {{ order.source_platform }}
      </el-descriptions-item>

      <el-descriptions-item
        :label="t('order.invoiceStatus')"
        :span="2"
        v-if="order.invoice_status"
      >
        <OrderStatusTag type="invoice" :status="order.invoice_status" />
        <span class="status-text">{{ order.invoice_status_display }}</span>
      </el-descriptions-item>

      <el-descriptions-item
        :label="t('order.contractNumber')"
        v-if="order.contract_number"
      >
        {{ order.contract_number }}
      </el-descriptions-item>
    </el-descriptions>

    <template v-if="order.project_details || order.cost_details">
      <div class="details-section">
        <div v-if="order.project_details" class="detail-item">
          <h4>{{ t("order.projectDetails") }}</h4>
          <p>{{ order.project_details }}</p>
        </div>

        <div v-if="order.cost_details" class="detail-item">
          <h4>{{ t("order.costDetails") }}</h4>
          <p>{{ order.cost_details }}</p>
        </div>
      </div>
    </template>

    <el-divider />

    <!-- 备注和回访记录 -->
    <template v-if="order.remarks || order.follow_up_record">
      <h3 class="section-title">{{ t("order.remarksAndRecords") }}</h3>
      <div class="details-section">
        <div v-if="order.remarks" class="detail-item">
          <h4>{{ t("order.remarks") }}</h4>
          <p>{{ order.remarks }}</p>
        </div>

        <div v-if="order.follow_up_record" class="detail-item">
          <h4>{{ t("order.followUpRecord") }}</h4>
          <p>{{ order.follow_up_record }}</p>
        </div>
      </div>
    </template>

    <div class="history-info" v-if="order.history_count">
      <el-tag type="info">
        {{ t("order.historyVersions", { count: order.history_count }) }}
      </el-tag>
    </div>
  </div>
</template>

<style scoped>
.order-detail {
  padding: 20px;
}

.status-tags {
  display: flex;
  gap: 10px;
}

.section-title {
  margin-top: 20px;
  margin-bottom: 15px;
  font-weight: 500;
  color: #303133;
}

.profit {
  font-weight: bold;
  color: #67c23a;
}

.profit-rate {
  margin-left: 5px;
  color: #909399;
}

.status-text {
  margin-left: 10px;
}

.remarks-section {
  margin-top: 15px;
  padding: 10px 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.remarks-section h4 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.remarks-section p {
  margin: 0;
  white-space: pre-line;
}

.details-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 15px;
}

.detail-item {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.detail-item h4 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.detail-item p {
  margin: 0;
  white-space: pre-line;
}

.history-info {
  margin-top: 20px;
  text-align: right;
}

@media (max-width: 768px) {
  .details-section {
    grid-template-columns: 1fr;
  }
}
</style>
