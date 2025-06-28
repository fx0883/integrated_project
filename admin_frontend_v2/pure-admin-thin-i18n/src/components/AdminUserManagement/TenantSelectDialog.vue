<script lang="ts" setup>
import { ref, computed, defineProps, defineEmits, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";
import logger from "@/utils/logger";
import { useTenantStoreHook } from "@/store/modules/tenant";

const props = defineProps<{
  visible: boolean;
  title?: string;
}>();

const emit = defineEmits<{
  (e: "confirm", tenantId: number): void;
  (e: "cancel"): void;
  (e: "update:visible", value: boolean): void;
}>();

const tenantStore = useTenantStoreHook();
const loading = ref(false);
const selectedTenantId = ref<number | null>(null);

// 使用计算属性处理v-model
const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

// 获取租户列表
const fetchTenants = async () => {
  loading.value = true;
  try {
    await tenantStore.fetchTenantList({
      page: 1,
      page_size: 50, // 获取更多租户以便选择
      status: "active" // 只获取活跃的租户
    });
  } catch (error) {
    logger.error("获取租户列表失败", error);
    ElMessage.error("获取租户列表失败");
  } finally {
    loading.value = false;
  }
};

// 关闭对话框
const handleClose = () => {
  emit("update:visible", false);
  emit("cancel");
};

// 确认选择
const handleConfirm = () => {
  if (!selectedTenantId.value) {
    ElMessage.warning("请选择一个租户");
    return;
  }
  logger.debug("租户选择对话框: 确认选择租户", {
    tenantId: selectedTenantId.value
  });
  emit("confirm", selectedTenantId.value);
  emit("update:visible", false);
};

// 组件挂载时获取租户列表及监听visible变化
onMounted(() => {
  fetchTenants();
  logger.debug("TenantSelectDialog组件挂载完成，visible=", props.visible);
});

// 监听visible属性变化
watch(
  () => props.visible,
  newVal => {
    logger.debug("TenantSelectDialog visible属性变化：", newVal);
    if (newVal) {
      // 对话框显示时，重新获取租户列表
      fetchTenants();
    } else {
      // 对话框关闭时，清空选择
      selectedTenantId.value = null;
    }
  }
);
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title || '选择租户'"
    width="40%"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    @close="handleClose"
    @open="logger.debug('TenantSelectDialog打开事件被触发')"
  >
    <div v-loading="loading" class="tenant-select-content">
      <p>请选择一个要将管理员分配到的租户：</p>
      <el-select
        v-model="selectedTenantId"
        placeholder="请选择租户"
        style="width: 100%"
      >
        <el-option
          v-for="tenant in tenantStore.tenantList.data"
          :key="tenant.id"
          :label="tenant.name"
          :value="tenant.id"
        >
          <div class="tenant-option">
            <span>{{ tenant.name }}</span>
            <span class="tenant-option-id">ID: {{ tenant.id }}</span>
          </div>
        </el-option>
      </el-select>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          :disabled="!selectedTenantId"
          @click="handleConfirm"
        >
          确认
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.tenant-select-content {
  padding: 10px 0;
}

.tenant-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.tenant-option-id {
  color: #999;
  font-size: 12px;
}
</style>
