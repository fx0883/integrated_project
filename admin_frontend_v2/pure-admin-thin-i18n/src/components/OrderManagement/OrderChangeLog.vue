<script lang="ts" setup>
import { ref, onMounted, defineProps, computed } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { useOrderStore } from "@/store/modules/order";
import { useCustomerStore } from "@/store/modules/customer";
import type { OrderHistory } from "@/types/order";

const props = defineProps<{
  orderId: number;
}>();

const { t } = useI18n();
const orderStore = useOrderStore();
const customerStore = useCustomerStore();

const historyList = ref<OrderHistory[]>([]);
const loading = ref(false);
const pagination = ref({
  currentPage: 1,
  pageSize: 20,
  total: 0
});

// 存储所有已加载的联系人信息
const contactPersonsMap = ref<Record<number, any>>({});

// 加载所有历史记录用于时间线展示
const loadHistoryList = async () => {
  loading.value = true;
  try {
    await orderStore.fetchOrderHistoryList(props.orderId, {
      page: pagination.value.currentPage,
      page_size: pagination.value.pageSize
    });
    historyList.value = orderStore.getOrderHistory;
    pagination.value.total = orderStore.orderHistory.total;

    // 查找涉及联系人变更的记录
    const customerIds = new Set<number>();
    historyList.value.forEach(history => {
      if (history.change_details_data?.changes?.customer) {
        const customerId = history.change_details_data.changes.customer.new;
        if (customerId && typeof customerId === "number") {
          customerIds.add(customerId);
        }
      }
    });

    // 加载客户的联系人数据
    await Promise.all(
      Array.from(customerIds).map(async customerId => {
        try {
          await customerStore.fetchCustomerMemberRelations(customerId);
          const relations = customerStore.getMemberRelations;
          relations.forEach(relation => {
            if (relation.member && relation.member.id) {
              contactPersonsMap.value[relation.member.id] = relation.member;
            }
          });
        } catch (error) {
          console.error(`加载客户 ${customerId} 的联系人失败`, error);
        }
      })
    );
  } catch (error) {
    console.error("Failed to load history:", error);
    ElMessage.error(t("order.historyLoadFailed"));
  } finally {
    loading.value = false;
  }
};

// 处理分页变化
const handlePageChange = (page: number) => {
  pagination.value.currentPage = page;
  loadHistoryList();
};

// 计算属性：历史记录按时间倒序排列
const sortedHistoryList = computed(() => {
  return [...historyList.value].sort((a, b) => {
    return (
      new Date(b.modified_at).getTime() - new Date(a.modified_at).getTime()
    );
  });
});

// 获取变更类型对应的图标和颜色
const getChangeTypeInfo = (change: OrderHistory) => {
  const action = change.change_details_data?.action;
  switch (action) {
    case "create":
      return { icon: "Plus", type: "success" };
    case "update":
      return { icon: "Edit", type: "primary" };
    case "restore":
      return { icon: "RefreshLeft", type: "warning" };
    default:
      return { icon: "Info", type: "info" };
  }
};

// 格式化联系人值
const formatContactPersonValue = (contactId: any) => {
  if (!contactId) return t("common.notSpecified");

  // 如果是对象且有name属性，直接使用name
  if (typeof contactId === "object" && contactId !== null) {
    if (contactId.name) return contactId.name;
    if (contactId.display_name) return contactId.display_name;
    if (contactId.id) return formatContactPersonValue(contactId.id);
  }

  // 如果是数字ID，查找联系人映射表
  const numericId = Number(contactId);
  if (contactPersonsMap.value[numericId]) {
    const contact = contactPersonsMap.value[numericId];
    return (
      contact.name ||
      contact.display_name ||
      contact.email ||
      `${t("common.contact")} ${numericId}`
    );
  }

  // 如果没找到，显示ID
  return `${t("common.contact")} ${contactId}`;
};

// 格式化变更值，优先使用 customer_contact_name 字段
const formatChangeValue = (field, value) => {
  // 处理联系人字段
  if (field === "customer_contact") {
    // 如果有 customer_contact_name，直接使用
    return formatContactPersonValue(value);
  }

  // 处理其他字段
  return value || t("common.notSpecified");
};

// 初始加载
onMounted(() => {
  loadHistoryList();
});
</script>

<template>
  <div v-loading="loading" class="order-change-log">
    <el-timeline>
      <el-timeline-item
        v-for="item in sortedHistoryList"
        :key="item.id"
        :type="getChangeTypeInfo(item).type"
        :icon="getChangeTypeInfo(item).icon"
        :timestamp="item.modified_at"
      >
        <div class="timeline-content">
          <h4 class="timeline-title">
            {{ t("order.version") }} #{{ item.version }} -
            {{
              item.change_details_data?.action === "create"
                ? t("order.created")
                : item.change_details_data?.action === "restore"
                  ? t("order.restored")
                  : t("order.updated")
            }}
          </h4>
          <p class="timeline-user">
            {{ t("order.by") }} {{ item.modified_by_name }}
          </p>

          <div
            v-if="item.change_details_data?.changes"
            class="changes-container"
          >
            <div
              v-for="(change, field) in item.change_details_data.changes"
              :key="field"
              class="change-item"
            >
              <div class="change-field">{{ t(`order.${field}`) }}:</div>
              <div class="change-values">
                <div class="old-value">
                  <span class="value-label">{{ t("order.from") }}:</span>
                  <span class="value">
                    <template v-if="field === 'customer_contact'">
                      {{
                        change.old_name || formatContactPersonValue(change.old)
                      }}
                    </template>
                    <template v-else>
                      {{ change.old || t("common.notSpecified") }}
                    </template>
                  </span>
                </div>
                <div class="new-value">
                  <span class="value-label">{{ t("order.to") }}:</span>
                  <span class="value">
                    <template v-if="field === 'customer_contact'">
                      {{
                        change.new_name || formatContactPersonValue(change.new)
                      }}
                    </template>
                    <template v-else>
                      {{ change.new || t("common.notSpecified") }}
                    </template>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else-if="item.change_details_data?.message"
            class="message-container"
          >
            {{ item.change_details_data.message }}
          </div>
        </div>
      </el-timeline-item>
    </el-timeline>

    <div
      v-if="pagination.total > pagination.pageSize"
      class="pagination-container"
    >
      <el-pagination
        v-model:current-page="pagination.currentPage"
        :page-size="pagination.pageSize"
        layout="prev, pager, next"
        :total="pagination.total"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.order-change-log {
  padding: 20px;
}

.timeline-content {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.timeline-title {
  margin: 0 0 5px;
  font-size: 16px;
}

.timeline-user {
  color: #909399;
  font-size: 14px;
  margin: 0 0 10px;
}

.changes-container {
  margin-top: 10px;
}

.change-item {
  margin-bottom: 10px;
  border-left: 2px solid #dcdfe6;
  padding-left: 10px;
}

.change-field {
  font-weight: bold;
  margin-bottom: 5px;
}

.change-values {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.old-value,
.new-value {
  display: flex;
  align-items: baseline;
}

.value-label {
  width: 50px;
  color: #909399;
}

.old-value .value {
  text-decoration: line-through;
  color: #f56c6c;
}

.new-value .value {
  color: #67c23a;
}

.message-container {
  font-style: italic;
  color: #606266;
}

.pagination-container {
  margin-top: 20px;
  text-align: center;
}
</style>
