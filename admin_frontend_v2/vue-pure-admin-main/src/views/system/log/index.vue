<template>
  <div class="system-log-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">系统日志</span>
          <div class="header-operations">
            <el-button type="primary" :icon="Refresh" @click="refreshLogs">刷新</el-button>
            <el-button type="success" :icon="Download" @click="exportLogs">导出</el-button>
          </div>
        </div>
      </template>
      
      <div class="filter-container">
        <el-form :inline="true" :model="filterForm">
          <el-form-item label="日志级别">
            <el-select v-model="filterForm.level" placeholder="选择日志级别" clearable>
              <el-option label="INFO" value="INFO" />
              <el-option label="WARN" value="WARN" />
              <el-option label="ERROR" value="ERROR" />
              <el-option label="DEBUG" value="DEBUG" />
            </el-select>
          </el-form-item>
          <el-form-item label="操作类型">
            <el-select v-model="filterForm.operationType" placeholder="选择操作类型" clearable>
              <el-option label="登录" value="LOGIN" />
              <el-option label="登出" value="LOGOUT" />
              <el-option label="创建" value="CREATE" />
              <el-option label="更新" value="UPDATE" />
              <el-option label="删除" value="DELETE" />
              <el-option label="查询" value="QUERY" />
            </el-select>
          </el-form-item>
          <el-form-item label="操作人">
            <el-input v-model="filterForm.operator" placeholder="输入操作人" />
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="filterForm.timeRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="searchLogs">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <el-table
        v-loading="loading"
        :data="logData"
        border
        style="width: 100%"
      >
        <el-table-column prop="timestamp" label="时间" width="180" sortable />
        <el-table-column prop="level" label="级别" width="100">
          <template #default="scope">
            <el-tag
              :type="getLogLevelType(scope.row.level)"
              effect="plain"
            >
              {{ scope.row.level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operationType" label="操作类型" width="120" />
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column prop="ip" label="IP地址" width="150" />
        <el-table-column prop="message" label="日志内容" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              link
              @click="viewLogDetail(scope.row)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 日志详情对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="日志详情"
      width="60%"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="时间">{{ currentLog.timestamp }}</el-descriptions-item>
        <el-descriptions-item label="级别">
          <el-tag :type="getLogLevelType(currentLog.level)">{{ currentLog.level }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作类型">{{ currentLog.operationType }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentLog.operator }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ currentLog.ip }}</el-descriptions-item>
        <el-descriptions-item label="用户代理">{{ currentLog.userAgent }}</el-descriptions-item>
        <el-descriptions-item label="请求路径" :span="2">{{ currentLog.requestPath }}</el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <pre>{{ currentLog.requestParams }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="日志内容" :span="2">{{ currentLog.message }}</el-descriptions-item>
        <el-descriptions-item label="堆栈信息" :span="2" v-if="currentLog.stackTrace">
          <el-collapse>
            <el-collapse-item title="查看堆栈信息">
              <pre>{{ currentLog.stackTrace }}</pre>
            </el-collapse-item>
          </el-collapse>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Refresh, Download } from "@element-plus/icons-vue";

// 加载状态
const loading = ref(false);

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 筛选表单
const filterForm = reactive({
  level: "",
  operationType: "",
  operator: "",
  timeRange: [] as string[]
});

// 日志数据
const logData = ref([
  {
    id: 1,
    timestamp: "2023-11-01 10:23:45",
    level: "INFO",
    operationType: "LOGIN",
    operator: "admin",
    ip: "192.168.1.100",
    message: "管理员登录成功",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/100.0.4896.127",
    requestPath: "/api/auth/login",
    requestParams: JSON.stringify({ username: "admin", password: "******" }, null, 2),
    stackTrace: ""
  },
  {
    id: 2,
    timestamp: "2023-11-01 11:05:12",
    level: "WARN",
    operationType: "UPDATE",
    operator: "admin",
    ip: "192.168.1.100",
    message: "修改系统配置",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/100.0.4896.127",
    requestPath: "/api/system/config",
    requestParams: JSON.stringify({ systemName: "新系统名称" }, null, 2),
    stackTrace: ""
  },
  {
    id: 3,
    timestamp: "2023-11-01 14:32:18",
    level: "ERROR",
    operationType: "CREATE",
    operator: "admin",
    ip: "192.168.1.100",
    message: "创建租户失败：数据库连接错误",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/100.0.4896.127",
    requestPath: "/api/tenant/create",
    requestParams: JSON.stringify({ name: "测试租户", code: "test" }, null, 2),
    stackTrace: "java.sql.SQLException: Connection refused\n\tat com.example.service.TenantService.createTenant(TenantService.java:45)\n\tat com.example.controller.TenantController.createTenant(TenantController.java:28)"
  }
]);

// 日志详情对话框
const dialogVisible = ref(false);
const currentLog = ref({
  id: 0,
  timestamp: "",
  level: "",
  operationType: "",
  operator: "",
  ip: "",
  message: "",
  userAgent: "",
  requestPath: "",
  requestParams: "",
  stackTrace: ""
});

// 获取日志级别对应的标签类型
const getLogLevelType = (level: string): "primary" | "success" | "warning" | "info" | "danger" => {
  const types: Record<string, "primary" | "success" | "warning" | "info" | "danger"> = {
    INFO: "info",
    WARN: "warning",
    ERROR: "danger",
    DEBUG: "success"
  };
  return types[level] || "info";
};

// 查看日志详情
const viewLogDetail = (row: any) => {
  currentLog.value = { ...row };
  dialogVisible.value = true;
};

// 刷新日志
const refreshLogs = () => {
  loading.value = true;
  // 这里应该是实际的刷新逻辑，这里仅做演示
  setTimeout(() => {
    loading.value = false;
    ElMessage.success("日志刷新成功");
  }, 500);
};

// 导出日志
const exportLogs = () => {
  ElMessageBox.confirm("确认导出当前筛选条件下的日志数据?", "提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    // 这里应该是实际的导出逻辑，这里仅做演示
    ElMessage.success("日志导出成功");
  }).catch(() => {
    // 取消导出
  });
};

// 查询日志
const searchLogs = () => {
  loading.value = true;
  currentPage.value = 1;
  // 这里应该是实际的查询逻辑，这里仅做演示
  setTimeout(() => {
    loading.value = false;
    ElMessage.success("查询成功");
  }, 500);
};

// 重置筛选条件
const resetFilter = () => {
  filterForm.level = "";
  filterForm.operationType = "";
  filterForm.operator = "";
  filterForm.timeRange = [];
  searchLogs();
};

// 处理页码变化
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  refreshLogs();
};

// 处理每页条数变化
const handleSizeChange = (val: number) => {
  pageSize.value = val;
  refreshLogs();
};

// 初始化
onMounted(() => {
  total.value = logData.value.length;
  // 实际应用中应该从服务器获取日志数据
});
</script>

<style scoped>
.system-log-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-container {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}
</style> 