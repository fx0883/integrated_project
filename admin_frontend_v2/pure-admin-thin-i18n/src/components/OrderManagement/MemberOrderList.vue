<script lang="ts" setup>
import { ref, onMounted, defineProps, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { useOrderStore } from "@/store/modules/order";
import type { Order } from "@/types/order";
import OrderStatusTag from "@/components/OrderManagement/OrderStatusTag.vue";

const props = defineProps<{
  memberId: number;
}>();

const { t } = useI18n();
const router = useRouter();
const orderStore = useOrderStore();

const loading = ref(false);
const memberOrders = ref<Order[]>([]);
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 过滤和排序选项
const filterForm = ref({
  payment_status: "",
  service_type: "",
  date_range: [] as string[]
});

// 排序设置
const sortSettings = ref({
  prop: "created_at",
  order: "descending"
});

// 统计信息
const statistics = computed(() => {
  if (!memberOrders.value.length) return null;

  const totalAmount = memberOrders.value.reduce((sum, order) => {
    const amount = parseFloat(order.customer_total_amount || "0");
    return sum + amount;
  }, 0);

  const statusCount = memberOrders.value.reduce(
    (acc, order) => {
      acc[order.payment_status] = (acc[order.payment_status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalCount: memberOrders.value.length,
    totalAmount: totalAmount.toFixed(2),
    paid: statusCount["paid"] || 0,
    unpaid: statusCount["unpaid"] || 0,
    partial: statusCount["partial"] || 0
  };
});

// 加载联系人订单
const loadMemberOrders = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.currentPage,
      page_size: pagination.value.pageSize,
      payment_status: filterForm.value.payment_status || undefined,
      service_type: filterForm.value.service_type || undefined,
      start_date: filterForm.value.date_range?.[0] || undefined,
      end_date: filterForm.value.date_range?.[1] || undefined,
      ordering: getSortParam()
    };

    await orderStore.fetchMemberOrderList(props.memberId, params);
    memberOrders.value = orderStore.getMemberOrders(props.memberId);
    pagination.value.total =
      orderStore.memberOrdersMap[props.memberId]?.total || 0;
  } catch (error) {
    console.error("Failed to load member orders:", error);
    ElMessage.error(t("order.memberOrdersLoadFailed"));
  } finally {
    loading.value = false;
  }
};

// 获取排序参数
const getSortParam = () => {
  if (!sortSettings.value.prop) return undefined;
  const prefix = sortSettings.value.order === "ascending" ? "" : "-";
  return `${prefix}${sortSettings.value.prop}`;
};

// 处理排序变化
const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  sortSettings.value.prop = prop;
  sortSettings.value.order = order;
  loadMemberOrders();
};

// 处理过滤
const handleFilter = () => {
  pagination.value.currentPage = 1;
  loadMemberOrders();
};

// 重置过滤
const resetFilter = () => {
  filterForm.value = {
    payment_status: "",
    service_type: "",
    date_range: []
  };
  handleFilter();
};

// 页码变化处理
const handlePageChange = (page: number) => {
  pagination.value.currentPage = page;
  loadMemberOrders();
};

// 页大小变化处理
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size;
  pagination.value.currentPage = 1;
  loadMemberOrders();
};

// 查看订单详情
const viewOrderDetail = (orderId: number) => {
  router.push(`/order/detail/${orderId}`);
};

// 创建订单
const createOrder = () => {
  router.push({
    path: "/order/create",
    query: { member_id: props.memberId.toString() }
  });
};

// 初始加载
onMounted(() => {
  loadMemberOrders();
});
</script>

<template>
  <div class="member-orders">
    <div class="orders-header">
      <h3>{{ t("order.memberOrders") }}</h3>
      <div class="statistics" v-if="statistics">
        <div class="stat-item">
          <span class="stat-label">{{ t("order.totalOrders") }}:</span>
          <span class="stat-value">{{ statistics.totalCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ t("order.totalAmount") }}:</span>
          <span class="stat-value">¥{{ statistics.totalAmount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ t("order.paymentStatus") }}:</span>
          <span>
            <el-tag size="small" type="success" v-if="statistics.paid">
              {{ t("order.paymentStatusPaid") }}: {{ statistics.paid }}
            </el-tag>
            <el-tag
              size="small"
              type="danger"
              v-if="statistics.unpaid"
              style="margin-left: 5px"
            >
              {{ t("order.paymentStatusUnpaid") }}: {{ statistics.unpaid }}
            </el-tag>
            <el-tag
              size="small"
              type="warning"
              v-if="statistics.partial"
              style="margin-left: 5px"
            >
              {{ t("order.paymentStatusPartial") }}: {{ statistics.partial }}
            </el-tag>
          </span>
        </div>
      </div>
      <el-button type="primary" @click="createOrder">
        <el-icon><Plus /></el-icon>
        {{ t("order.createOrder") }}
      </el-button>
    </div>

    <div class="filter-container">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item :label="t('order.paymentStatus')">
          <el-select
            v-model="filterForm.payment_status"
            clearable
            :placeholder="t('order.filterPaymentStatus')"
          >
            <el-option value="paid" :label="t('order.paymentStatusPaid')" />
            <el-option value="unpaid" :label="t('order.paymentStatusUnpaid')" />
            <el-option
              value="partial"
              :label="t('order.paymentStatusPartial')"
            />
            <el-option
              value="refunded"
              :label="t('order.paymentStatusRefunded')"
            />
            <el-option
              value="cancelled"
              :label="t('order.paymentStatusCancelled')"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('order.serviceType')">
          <el-select
            v-model="filterForm.service_type"
            clearable
            :placeholder="t('order.filterServiceType')"
          >
            <el-option
              value="文档翻译"
              :label="t('order.serviceTypeDocument')"
            />
            <el-option
              value="口译服务"
              :label="t('order.serviceTypeInterpretation')"
            />
            <el-option
              value="校对服务"
              :label="t('order.serviceTypeProofreading')"
            />
            <el-option
              value="本地化服务"
              :label="t('order.serviceTypeLocalization')"
            />
            <el-option value="其他" :label="t('order.serviceTypeOther')" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('order.dateRange')">
          <el-date-picker
            v-model="filterForm.date_range"
            type="daterange"
            start-placeholder="Start Date"
            end-placeholder="End Date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleFilter">
            {{ t("common.search") }}
          </el-button>
          <el-button @click="resetFilter">
            {{ t("common.reset") }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table
      v-loading="loading"
      :data="memberOrders"
      style="width: 100%"
      border
      @sort-change="handleSortChange"
    >
      <el-table-column
        prop="order_number"
        :label="t('order.orderNumber')"
        width="150"
        sortable="custom"
      />
      <el-table-column
        prop="customer_name"
        :label="t('order.customer')"
        width="180"
      />
      <el-table-column
        prop="service_type"
        :label="t('order.serviceType')"
        width="120"
      />
      <el-table-column
        prop="created_at"
        :label="t('order.orderDate')"
        width="180"
        sortable="custom"
      >
        <template #default="scope">
          {{ scope.row.order_date || scope.row.created_at }}
        </template>
      </el-table-column>
      <el-table-column
        prop="customer_total_amount"
        :label="t('order.amount')"
        width="120"
        sortable="custom"
      >
        <template #default="scope">
          ¥{{ scope.row.customer_total_amount }}
        </template>
      </el-table-column>
      <el-table-column
        prop="payment_status"
        :label="t('order.paymentStatus')"
        width="120"
      >
        <template #default="scope">
          <OrderStatusTag type="payment" :status="scope.row.payment_status" />
        </template>
      </el-table-column>
      <el-table-column :label="t('common.actions')" width="120" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="viewOrderDetail(scope.row.id)">
            {{ t("common.view") }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.member-orders {
  margin-top: 10px;
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}

.orders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.orders-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.statistics {
  display: flex;
  flex-grow: 1;
  justify-content: center;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
}

.stat-label {
  font-weight: 500;
  margin-right: 5px;
}

.stat-value {
  font-size: 16px;
  color: #409eff;
  font-weight: 500;
}

.filter-container {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style>
