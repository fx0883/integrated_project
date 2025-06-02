<template>
  <div class="tenant-selector">
    <el-select
      v-model="currentTenantId"
      :placeholder="placeholder"
      :disabled="disabled"
      :clearable="clearable"
      class="tenant-select"
      @change="handleChange"
    >
      <el-option
        v-for="item in tenantOptions"
        :key="item.id"
        :label="item.name"
        :value="item.id"
      />
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useTenantStoreHook } from "@/store/modules/tenant";
import { useUserStoreHook } from "@/store/modules/user";
import { dataPermission } from "@/utils/permission/dataPermission";

const props = defineProps({
  value: {
    type: [Number, String],
    default: null
  },
  placeholder: {
    type: String,
    default: "请选择租户"
  },
  disabled: {
    type: Boolean,
    default: false
  },
  clearable: {
    type: Boolean,
    default: true
  },
  onlyAccessible: {
    type: Boolean,
    default: true
  },
  onChange: {
    type: Function,
    default: null
  }
});

const emit = defineEmits(["update:value", "change"]);

// 当前选中的租户ID
const currentTenantId = ref(props.value);

// 租户数据
const tenantStore = useTenantStoreHook();
const userStore = useUserStoreHook();
const tenantOptions = ref([]);

// 计算用户可访问的租户列表
const accessibleTenants = computed(() => {
  // 获取用户角色
  const permissionType = dataPermission.getDataPermissionType();
  const currentTenantId = userStore.tenantId;
  
  // 超级管理员可以访问所有租户
  if (permissionType === "all") {
    return tenantStore.tenants;
  }
  
  // 租户管理员只能访问自己的租户
  if (permissionType === "tenant" && currentTenantId) {
    return tenantStore.tenants.filter(tenant => tenant.id === currentTenantId);
  }
  
  // 其他用户无法选择租户
  return [];
});

// 初始化
onMounted(async () => {
  // 加载租户列表
  await fetchTenants();
  
  // 设置默认值
  if (!currentTenantId.value && tenantOptions.value.length > 0) {
    // 如果没有传入默认值但用户有关联租户，则使用用户关联的租户
    const userTenantId = userStore.tenantId;
    if (userTenantId) {
      currentTenantId.value = userTenantId;
    } else if (tenantOptions.value.length === 1) {
      // 如果只有一个可选租户，自动选择
      currentTenantId.value = tenantOptions.value[0].id;
    }
  }
});

// 监听传入的值变化
watch(() => props.value, (newVal) => {
  currentTenantId.value = newVal;
});

// 获取租户列表
const fetchTenants = async () => {
  const result = await tenantStore.fetchTenants();
  if (result && result.list) {
    // 如果需要只显示可访问的租户
    if (props.onlyAccessible) {
      tenantOptions.value = accessibleTenants.value;
    } else {
      tenantOptions.value = result.list;
    }
  }
};

// 处理租户选择变化
const handleChange = (value) => {
  emit("update:value", value);
  emit("change", value);
  if (props.onChange) {
    props.onChange(value);
  }
};
</script>

<style scoped>
.tenant-selector {
  display: inline-block;
}

.tenant-select {
  width: 100%;
}
</style> 