<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox, ElTabs, ElTabPane } from "element-plus";
import { useCustomerStoreHook } from "@/store/modules/customer";
import { useUserStoreHook } from "@/store/modules/user";
import { hasPerms } from "@/utils/auth";
import {
  CustomerStatusTag,
  CustomerValueTag,
  ConfirmDialog,
  ContactPersonForm,
  TenantLinkForm
} from "@/components/CustomerManagement";
import type {
  Customer,
  ContactPerson,
  CustomerTenantLink,
  ContactPersonCreateUpdateParams,
  CustomerTenantLinkCreateParams
} from "@/types/customer";
import logger from "@/utils/logger";
import CustomerOrderList from "@/components/OrderManagement/CustomerOrderList.vue";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const customerStore = useCustomerStoreHook();
const userStore = useUserStoreHook();

// 获取客户ID
const customerId = computed(() => Number(route.params.id));

// 检查用户是否有管理权限
const hasManagePermission = computed(
  () => userStore.is_super_admin || hasPerms("customer:manage")
);

// 加载状态
const loading = ref(false);
const contactsLoading = ref(false);
const tenantsLoading = ref(false);

// 当前活动标签页
const activeTab = ref("basic");

// 获取客户详情
const fetchCustomerDetail = async () => {
  loading.value = true;
  try {
    await customerStore.fetchCustomerDetail(customerId.value);
  } catch (error) {
    logger.error("获取客户详情失败", error);
    ElMessage.error(t("customer.fetchDetailFailed"));
    router.push("/customer");
  } finally {
    loading.value = false;
  }
};

// 获取联系人列表
const fetchContactPersons = async () => {
  contactsLoading.value = true;
  try {
    await customerStore.fetchCustomerMemberRelations(customerId.value);
  } catch (error) {
    logger.error("获取联系人列表失败", error);
    ElMessage.error(t("customer.fetchContactsFailed"));
  } finally {
    contactsLoading.value = false;
  }
};

// 获取关联租户列表
const fetchTenantLinks = async () => {
  tenantsLoading.value = true;
  try {
    await customerStore.fetchCustomerTenantRelations(customerId.value);
  } catch (error) {
    logger.error("获取关联租户列表失败", error);
    ElMessage.error(t("customer.fetchTenantsFailed"));
  } finally {
    tenantsLoading.value = false;
  }
};

// 客户详情
const customerDetail = computed(() => customerStore.currentCustomer);
// 联系人列表
const contactPersons = computed(() => customerStore.customerContacts);
// 关联租户列表
const tenantLinks = computed(() => customerStore.customerTenants);

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

// 返回列表
const handleBack = () => {
  router.push("/customer");
};

// 编辑客户
const handleEdit = () => {
  router.push(`/customer/edit/${customerId.value}`);
};

// 删除客户
const handleDelete = () => {
  openConfirmDialog(
    t("customer.deleteCustomer"),
    t("customer.deleteCustomerConfirm", { name: customerDetail.value?.name }),
    "danger",
    async () => {
      try {
        await customerStore.removeCustomer(customerId.value);
        ElMessage.success(t("customer.deleteSuccess"));
        router.push("/customer");
      } catch (error) {
        logger.error("删除客户失败", error);
        ElMessage.error(t("customer.deleteFailed"));
      }
    }
  );
};

// 联系人相关操作
const contactPersonDialog = reactive({
  visible: false,
  mode: "create" as "create" | "edit",
  loading: false,
  currentContact: null as ContactPerson | null
});

// 添加联系人
const handleAddContact = () => {
  contactPersonDialog.visible = true;
  contactPersonDialog.mode = "create";
  contactPersonDialog.currentContact = null;
};

// 编辑联系人
const handleEditContact = (contact: ContactPerson) => {
  contactPersonDialog.visible = true;
  contactPersonDialog.mode = "edit";
  contactPersonDialog.currentContact = contact;
};

// 删除联系人
const handleDeleteContact = (contact: ContactPerson) => {
  openConfirmDialog(
    t("customer.contact.deleteContact"),
    t("customer.contact.deleteContactConfirm", {
      name: `${contact.first_name} ${contact.last_name}`
    }),
    "danger",
    async () => {
      try {
        await customerStore.removeCustomerMemberRelation(
          customerId.value,
          contact.id
        );
        ElMessage.success(t("customer.contact.deleteSuccess"));
        fetchContactPersons();
      } catch (error) {
        logger.error("删除联系人失败", error);
        ElMessage.error(t("customer.contact.deleteFailed"));
      }
    }
  );
};

// 提交联系人表单
const handleContactSubmit = async (
  formData: ContactPersonCreateUpdateParams
) => {
  contactPersonDialog.loading = true;
  try {
    if (contactPersonDialog.mode === "create") {
      await customerStore.createCustomerMemberRelation({
        ...formData,
        customer_id: customerId.value
      });
      ElMessage.success(t("customer.contact.createSuccess"));
    } else {
      await customerStore.updateCustomerMemberRelation(
        customerId.value,
        contactPersonDialog.currentContact!.id,
        formData
      );
      ElMessage.success(t("customer.contact.updateSuccess"));
    }
    contactPersonDialog.visible = false;
    fetchContactPersons();
  } catch (error) {
    logger.error(
      contactPersonDialog.mode === "create"
        ? "创建联系人失败"
        : "更新联系人失败",
      error
    );
    ElMessage.error(
      contactPersonDialog.mode === "create"
        ? t("customer.contact.createFailed")
        : t("customer.contact.updateFailed")
    );
  } finally {
    contactPersonDialog.loading = false;
  }
};

// 取消联系人操作
const handleContactCancel = () => {
  contactPersonDialog.visible = false;
};

// 租户关联相关操作
const tenantLinkDialog = reactive({
  visible: false,
  mode: "create" as "create" | "edit",
  loading: false,
  currentTenantLink: null as CustomerTenantLink | null
});

// 添加租户关联
const handleAddTenantLink = () => {
  tenantLinkDialog.visible = true;
  tenantLinkDialog.mode = "create";
  tenantLinkDialog.currentTenantLink = null;
};

// 编辑租户关联
const handleEditTenantLink = (tenantLink: CustomerTenantLink) => {
  tenantLinkDialog.visible = true;
  tenantLinkDialog.mode = "edit";
  tenantLinkDialog.currentTenantLink = tenantLink;
};

// 删除租户关联
const handleDeleteTenantLink = (tenantLink: CustomerTenantLink) => {
  openConfirmDialog(
    t("customer.tenantLink.deleteTenantLink"),
    t("customer.tenantLink.deleteTenantLinkConfirm", {
      name: tenantLink.tenant_name
    }),
    "danger",
    async () => {
      try {
        await customerStore.removeCustomerTenantRelation(
          customerId.value,
          tenantLink.id
        );
        ElMessage.success(t("customer.tenantLink.deleteSuccess"));
        fetchTenantLinks();
      } catch (error) {
        logger.error("删除租户关联失败", error);
        ElMessage.error(t("customer.tenantLink.deleteFailed"));
      }
    }
  );
};

// 提交租户关联表单
const handleTenantLinkSubmit = async (
  formData: CustomerTenantLinkCreateParams
) => {
  tenantLinkDialog.loading = true;
  try {
    if (tenantLinkDialog.mode === "create") {
      await customerStore.createCustomerTenantRelation({
        ...formData,
        customer_id: customerId.value
      });
      ElMessage.success(t("customer.tenantLink.createSuccess"));
    } else {
      await customerStore.updateCustomerTenantRelation(
        customerId.value,
        tenantLinkDialog.currentTenantLink!.id,
        formData
      );
      ElMessage.success(t("customer.tenantLink.updateSuccess"));
    }
    tenantLinkDialog.visible = false;
    fetchTenantLinks();
  } catch (error) {
    logger.error(
      tenantLinkDialog.mode === "create"
        ? "创建租户关联失败"
        : "更新租户关联失败",
      error
    );
    ElMessage.error(
      tenantLinkDialog.mode === "create"
        ? t("customer.tenantLink.createFailed")
        : t("customer.tenantLink.updateFailed")
    );
  } finally {
    tenantLinkDialog.loading = false;
  }
};

// 取消租户关联操作
const handleTenantLinkCancel = () => {
  tenantLinkDialog.visible = false;
};

// 监听标签页变化
const handleTabChange = (tab: string) => {
  if (tab === "contacts" && contactPersons.value.length === 0) {
    fetchContactPersons();
  } else if (tab === "tenants" && tenantLinks.value.length === 0) {
    fetchTenantLinks();
  }
};

// 初始化
onMounted(() => {
  fetchCustomerDetail();
});
</script>

<template>
  <div class="customer-detail-container">
    <div class="customer-detail-header">
      <h2 class="customer-detail-title">
        {{ t("customer.customerDetail") }}
      </h2>
      <div class="customer-detail-actions">
        <el-button @click="handleBack">
          {{ t("common.back") }}
        </el-button>
        <el-button
          v-if="hasManagePermission"
          type="primary"
          @click="handleEdit"
        >
          {{ t("common.edit") }}
        </el-button>
        <el-button
          v-if="hasManagePermission"
          type="danger"
          @click="handleDelete"
        >
          {{ t("common.delete") }}
        </el-button>
      </div>
    </div>

    <el-tabs
      v-model="activeTab"
      @tab-click="tab => handleTabChange(tab.props.name)"
    >
      <el-tab-pane :label="t('customer.basicInfo')" name="basic">
        <el-card v-loading="loading">
          <template v-if="customerDetail">
            <div class="customer-info">
              <div class="customer-info-header">
                <h3 class="customer-name">{{ customerDetail.name }}</h3>
                <div class="customer-tags">
                  <CustomerStatusTag
                    :status="customerDetail.status"
                    size="large"
                  />
                  <CustomerValueTag
                    :value-level="customerDetail.value_level"
                    size="large"
                    class="ml-2"
                  />
                </div>
              </div>

              <el-descriptions :column="2" border>
                <el-descriptions-item :label="t('customer.id')">
                  {{ customerDetail.id }}
                </el-descriptions-item>
                <el-descriptions-item :label="t('customer.type')">
                  {{
                    t(
                      `customer.type${customerDetail.type.charAt(0).toUpperCase() + customerDetail.type.slice(1)}`
                    )
                  }}
                </el-descriptions-item>
                <el-descriptions-item :label="t('customer.industry')">
                  {{ customerDetail.industry || t("common.notProvided") }}
                </el-descriptions-item>
                <el-descriptions-item :label="t('customer.registrationNumber')">
                  {{
                    customerDetail.registration_number ||
                    t("common.notProvided")
                  }}
                </el-descriptions-item>
                <el-descriptions-item :label="t('customer.taxId')">
                  {{ customerDetail.tax_id || t("common.notProvided") }}
                </el-descriptions-item>
                <el-descriptions-item :label="t('customer.foundedYear')">
                  {{ customerDetail.founded_year || t("common.notProvided") }}
                </el-descriptions-item>
                <el-descriptions-item :label="t('customer.employeeCount')">
                  {{ customerDetail.employee_count || t("common.notProvided") }}
                </el-descriptions-item>
                <el-descriptions-item :label="t('customer.annualRevenue')">
                  {{
                    customerDetail.annual_revenue
                      ? `$${customerDetail.annual_revenue.toLocaleString()}`
                      : t("common.notProvided")
                  }}
                </el-descriptions-item>
                <el-descriptions-item :label="t('customer.website')" :span="2">
                  <a
                    v-if="customerDetail.website"
                    :href="customerDetail.website"
                    target="_blank"
                  >
                    {{ customerDetail.website }}
                  </a>
                  <span v-else>{{ t("common.notProvided") }}</span>
                </el-descriptions-item>
                <el-descriptions-item :label="t('customer.address')" :span="2">
                  <div v-if="customerDetail.address">
                    {{ customerDetail.address }}<br />
                    {{
                      [
                        customerDetail.city,
                        customerDetail.province,
                        customerDetail.postal_code
                      ]
                        .filter(Boolean)
                        .join(", ")
                    }}<br />
                    {{ customerDetail.country }}
                  </div>
                  <span v-else>{{ t("common.notProvided") }}</span>
                </el-descriptions-item>
                <el-descriptions-item
                  :label="t('customer.description')"
                  :span="2"
                >
                  {{ customerDetail.description || t("common.notProvided") }}
                </el-descriptions-item>
                <el-descriptions-item :label="t('customer.createdAt')">
                  {{ new Date(customerDetail.created_at).toLocaleString() }}
                </el-descriptions-item>
                <el-descriptions-item :label="t('customer.updatedAt')">
                  {{ new Date(customerDetail.updated_at).toLocaleString() }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-card>
      </el-tab-pane>

      <el-tab-pane :label="t('customer.contacts')" name="contacts">
        <el-card v-loading="contactsLoading">
          <template #header>
            <div class="card-header">
              <span>{{ t("customer.contactList") }}</span>
              <el-button
                v-if="hasManagePermission"
                type="primary"
                size="small"
                @click="handleAddContact"
              >
                {{ t("customer.contact.addContact") }}
              </el-button>
            </div>
          </template>

          <div v-if="contactPersons.length === 0" class="empty-data">
            {{ t("customer.contact.noContacts") }}
          </div>

          <el-table
            v-else
            :data="contactPersons"
            border
            stripe
            style="width: 100%"
          >
            <el-table-column
              prop="id"
              :label="t('customer.contact.id')"
              width="80"
              align="center"
            />
            <el-table-column
              :label="t('customer.contact.name')"
              min-width="150"
            >
              <template #default="{ row }">
                {{ row.first_name }} {{ row.last_name }}
                <el-tag
                  v-if="row.is_primary"
                  size="small"
                  type="success"
                  effect="plain"
                >
                  {{ t("customer.contact.primary") }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="position"
              :label="t('customer.contact.position')"
              width="150"
            />
            <el-table-column
              prop="email"
              :label="t('customer.contact.email')"
              min-width="180"
            />
            <el-table-column
              prop="phone"
              :label="t('customer.contact.phone')"
              width="150"
            />
            <el-table-column
              prop="mobile"
              :label="t('customer.contact.mobile')"
              width="150"
            />
            <el-table-column
              :label="t('common.actions')"
              width="150"
              align="center"
              fixed="right"
            >
              <template #default="{ row }">
                <el-button
                  v-if="hasManagePermission"
                  type="primary"
                  size="small"
                  link
                  @click="handleEditContact(row)"
                >
                  {{ t("common.edit") }}
                </el-button>
                <el-button
                  v-if="hasManagePermission"
                  type="danger"
                  size="small"
                  link
                  @click="handleDeleteContact(row)"
                >
                  {{ t("common.delete") }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane :label="t('customer.tenants')" name="tenants">
        <el-card v-loading="tenantsLoading">
          <template #header>
            <div class="card-header">
              <span>{{ t("customer.tenantLinkList") }}</span>
              <el-button
                v-if="hasManagePermission"
                type="primary"
                size="small"
                @click="handleAddTenantLink"
              >
                {{ t("customer.tenantLink.addTenantLink") }}
              </el-button>
            </div>
          </template>

          <div v-if="tenantLinks.length === 0" class="empty-data">
            {{ t("customer.tenantLink.noTenantLinks") }}
          </div>

          <el-table
            v-else
            :data="tenantLinks"
            border
            stripe
            style="width: 100%"
          >
            <el-table-column
              prop="id"
              :label="t('customer.tenantLink.id')"
              width="80"
              align="center"
            />
            <el-table-column
              prop="tenant_name"
              :label="t('customer.tenantLink.tenant')"
              min-width="180"
            />
            <el-table-column
              prop="relationship_type"
              :label="t('customer.tenantLink.relationshipType')"
              width="150"
            >
              <template #default="{ row }">
                {{
                  t(
                    `customer.tenantLink.type${row.relationship_type.charAt(0).toUpperCase() + row.relationship_type.slice(1)}`
                  )
                }}
              </template>
            </el-table-column>
            <el-table-column
              :label="t('customer.tenantLink.startDate')"
              width="150"
            >
              <template #default="{ row }">
                {{ new Date(row.start_date).toLocaleDateString() }}
              </template>
            </el-table-column>
            <el-table-column
              :label="t('customer.tenantLink.endDate')"
              width="150"
            >
              <template #default="{ row }">
                {{
                  row.end_date
                    ? new Date(row.end_date).toLocaleDateString()
                    : t("common.notSet")
                }}
              </template>
            </el-table-column>
            <el-table-column
              :label="t('customer.tenantLink.isActive')"
              width="100"
              align="center"
            >
              <template #default="{ row }">
                <el-tag :type="row.is_active ? 'success' : 'info'">
                  {{ row.is_active ? t("common.yes") : t("common.no") }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              :label="t('common.actions')"
              width="150"
              align="center"
              fixed="right"
            >
              <template #default="{ row }">
                <el-button
                  v-if="hasManagePermission"
                  type="primary"
                  size="small"
                  link
                  @click="handleEditTenantLink(row)"
                >
                  {{ t("common.edit") }}
                </el-button>
                <el-button
                  v-if="hasManagePermission"
                  type="danger"
                  size="small"
                  link
                  @click="handleDeleteTenantLink(row)"
                >
                  {{ t("common.delete") }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane :label="t('order.customerOrders')" name="orders">
        <CustomerOrderList :customer-id="customerId" />
      </el-tab-pane>
    </el-tabs>

    <!-- 确认对话框 -->
    <ConfirmDialog
      v-model:visible="confirmDialog.visible"
      :title="confirmDialog.title"
      :content="confirmDialog.content"
      :type="confirmDialog.type"
      :loading="confirmDialog.loading"
      @confirm="handleConfirmDialogConfirm"
      @cancel="handleConfirmDialogCancel"
    />

    <!-- 联系人表单对话框 -->
    <el-dialog
      v-model="contactPersonDialog.visible"
      :title="
        contactPersonDialog.mode === 'create'
          ? t('customer.contact.addContact')
          : t('customer.contact.editContact')
      "
      width="50%"
      destroy-on-close
    >
      <ContactPersonForm
        v-if="contactPersonDialog.visible"
        :mode="contactPersonDialog.mode"
        :contact-person="contactPersonDialog.currentContact"
        :customer-id="customerId"
        :loading="contactPersonDialog.loading"
        @submit="handleContactSubmit"
        @cancel="handleContactCancel"
      />
    </el-dialog>

    <!-- 租户关联表单对话框 -->
    <el-dialog
      v-model="tenantLinkDialog.visible"
      :title="
        tenantLinkDialog.mode === 'create'
          ? t('customer.tenantLink.addTenantLink')
          : t('customer.tenantLink.editTenantLink')
      "
      width="50%"
      destroy-on-close
    >
      <TenantLinkForm
        v-if="tenantLinkDialog.visible"
        :mode="tenantLinkDialog.mode"
        :tenant-link="tenantLinkDialog.currentTenantLink"
        :customer-id="customerId"
        :loading="tenantLinkDialog.loading"
        @submit="handleTenantLinkSubmit"
        @cancel="handleTenantLinkCancel"
      />
    </el-dialog>
  </div>
</template>

<style scoped>
.customer-detail-container {
  padding: 20px;
}

.customer-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.customer-detail-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.customer-detail-actions .el-button {
  margin-left: 10px;
}

.customer-info {
  margin-bottom: 20px;
}

.customer-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.customer-name {
  font-size: 24px;
  font-weight: 500;
  margin: 0;
}

.customer-tags {
  display: flex;
  align-items: center;
}

.ml-2 {
  margin-left: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-data {
  text-align: center;
  color: #909399;
  padding: 30px 0;
  font-size: 14px;
}
</style>
