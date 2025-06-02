<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">打卡记录管理</span>
        </div>
      </template>

      <!-- 搜索区域 -->
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="任务名称">
          <el-select v-model="queryParams.task_id" placeholder="选择任务" clearable filterable>
            <el-option
              v-for="item in taskOptions"
              :key="item.id"
              :label="item.title"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="用户名称">
          <el-input v-model="queryParams.user_name" placeholder="请输入用户名称" clearable />
        </el-form-item>
        <el-form-item label="打卡状态">
          <el-select v-model="queryParams.status" placeholder="选择状态" clearable>
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="打卡日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleDateRangeChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 表格区域 -->
      <el-table
        v-loading="loading"
        :data="recordList"
        border
        row-key="id"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <el-form label-position="left" inline class="record-expand">
              <el-form-item label="打卡评论" v-if="row.comment">
                <span>{{ row.comment }}</span>
              </el-form-item>
              <el-form-item label="打卡图片" v-if="row.images && row.images.length > 0">
                <el-image
                  v-for="(img, index) in row.images"
                  :key="index"
                  :src="img"
                  :preview-src-list="row.images"
                  fit="cover"
                  class="record-image"
                />
              </el-form-item>
              <el-form-item label="打卡位置" v-if="row.location">
                <span>{{ row.location }}</span>
              </el-form-item>
            </el-form>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="task_title" label="所属任务" min-width="150" show-overflow-tooltip />
        <el-table-column prop="user_name" label="用户" width="120" />
        <el-table-column prop="check_date" label="打卡日期" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.status)"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="success"
              :icon="Check"
              @click="handleApprove(row)"
              v-if="row.status === 'pending'"
            >
              通过
            </el-button>
            <el-button
              link
              type="danger"
              :icon="Close"
              @click="handleReject(row)"
              v-if="row.status === 'pending'"
            >
              拒绝
            </el-button>
            <el-button
              link
              type="danger"
              :icon="Delete"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页区域 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.limit"
          :page-sizes="[10, 20, 50, 100]"
          background
          layout="total, sizes, prev, pager, next"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 审核对话框 -->
    <el-dialog
      v-model="reviewDialogVisible"
      :title="reviewType === 'approve' ? '通过打卡记录' : '拒绝打卡记录'"
      width="500px"
      destroy-on-close
    >
      <div v-if="currentRecord" class="review-form">
        <div class="review-info">
          <p><strong>任务名称：</strong>{{ currentRecord.task_title }}</p>
          <p><strong>用户名称：</strong>{{ currentRecord.user_name }}</p>
          <p><strong>打卡日期：</strong>{{ currentRecord.check_date }}</p>
        </div>
        
        <el-form :model="reviewForm" label-width="100px">
          <el-form-item label="审核评语">
            <el-input
              v-model="reviewForm.comment"
              type="textarea"
              :rows="3"
              placeholder="请输入审核评语（可选）"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reviewDialogVisible = false">取消</el-button>
          <el-button 
            :type="reviewType === 'approve' ? 'success' : 'danger'" 
            @click="submitReview"
            :loading="submitLoading"
          >
            {{ reviewType === 'approve' ? '确认通过' : '确认拒绝' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";
import { useCheckRecordStoreHook } from "@/store/modules/check/record";
import { useCheckTaskStoreHook } from "@/store/modules/check/task";
import type { CheckRecord, CheckTask } from "../../../../types/check";
import { 
  Search, Refresh, Delete, Check, Close
} from "@element-plus/icons-vue";

// store实例
const recordStore = useCheckRecordStoreHook();
const taskStore = useCheckTaskStoreHook();

// 列表数据
const recordList = ref<CheckRecord[]>([]);
const total = ref(0);
const loading = ref(false);
const taskOptions = ref<CheckTask[]>([]);

// 日期范围
const dateRange = ref([]);

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 10,
  task_id: undefined as number | undefined,
  user_name: "",
  status: undefined as string | undefined,
  start_date: undefined as string | undefined,
  end_date: undefined as string | undefined
});

// 审核相关
const reviewDialogVisible = ref(false);
const submitLoading = ref(false);
const reviewType = ref<'approve' | 'reject'>('approve');
const currentRecord = ref<CheckRecord | null>(null);
const reviewForm = reactive({
  comment: ""
});

// 监听日期范围变化
watch(dateRange, (val) => {
  handleDateRangeChange(val);
});

// 初始化
onMounted(async () => {
  await fetchTasks();
  fetchRecords();
});

// 获取任务列表（用于筛选）
const fetchTasks = async () => {
  const result = await taskStore.fetchTasks({ limit: 100 });
  if (result) {
    taskOptions.value = result.list;
  }
};

// 获取打卡记录列表
const fetchRecords = async () => {
  loading.value = true;
  try {
    const result = await recordStore.fetchRecords(queryParams);
    if (result) {
      recordList.value = result.list;
      total.value = result.total;
    }
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  queryParams.page = 1;
  fetchRecords();
};

// 重置查询
const resetQuery = () => {
  queryParams.task_id = undefined;
  queryParams.user_name = "";
  queryParams.status = undefined;
  queryParams.start_date = undefined;
  queryParams.end_date = undefined;
  dateRange.value = [];
  queryParams.page = 1;
  fetchRecords();
};

// 日期范围变化
const handleDateRangeChange = (val: any) => {
  if (val && val.length === 2) {
    queryParams.start_date = val[0];
    queryParams.end_date = val[1];
  } else {
    queryParams.start_date = undefined;
    queryParams.end_date = undefined;
  }
};

// 分页大小变化
const handleSizeChange = (val: number) => {
  queryParams.limit = val;
  fetchRecords();
};

// 页码变化
const handleCurrentChange = (val: number) => {
  queryParams.page = val;
  fetchRecords();
};

// 通过打卡记录
const handleApprove = (row: CheckRecord) => {
  currentRecord.value = row;
  reviewType.value = 'approve';
  reviewForm.comment = "";
  reviewDialogVisible.value = true;
};

// 拒绝打卡记录
const handleReject = (row: CheckRecord) => {
  currentRecord.value = row;
  reviewType.value = 'reject';
  reviewForm.comment = "";
  reviewDialogVisible.value = true;
};

// 提交审核
const submitReview = async () => {
  if (!currentRecord.value) return;
  
  submitLoading.value = true;
  try {
    const status = reviewType.value === 'approve' ? 'approved' : 'rejected';
    const result = await recordStore.reviewRecord(
      currentRecord.value.id,
      status,
      reviewForm.comment || undefined
    );
    
    if (result && result.success) {
      ElMessage.success(
        reviewType.value === 'approve' ? "打卡记录已通过" : "打卡记录已拒绝"
      );
      reviewDialogVisible.value = false;
      fetchRecords();
    } else {
      ElMessage.error(result?.message || "操作失败");
    }
  } finally {
    submitLoading.value = false;
  }
};

// 删除打卡记录
const handleDelete = (row: CheckRecord) => {
  ElMessageBox.confirm(`确认要删除该打卡记录吗？`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      const result = await recordStore.deleteRecord(row.id);
      if (result && result.success) {
        ElMessage.success("删除成功");
        fetchRecords();
      } else {
        ElMessage.error(result?.message || "删除失败");
      }
    })
    .catch(() => {});
};

// 获取状态类型
const getStatusType = (status: string) => {
  switch (status) {
    case "pending":
      return "warning";
    case "approved":
      return "success";
    case "rejected":
      return "danger";
    default:
      return "info";
  }
};

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case "pending":
      return "待审核";
    case "approved":
      return "已通过";
    case "rejected":
      return "已拒绝";
    default:
      return "未知";
  }
};
</script>

<style scoped>
.main {
  margin: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.record-expand {
  padding: 10px;
}

.record-expand .el-form-item {
  margin-right: 20px;
  margin-bottom: 10px;
}

.record-image {
  width: 100px;
  height: 100px;
  margin-right: 10px;
  border-radius: 4px;
  object-fit: cover;
  cursor: pointer;
}

.review-info {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.review-info p {
  margin: 5px 0;
}
</style> 