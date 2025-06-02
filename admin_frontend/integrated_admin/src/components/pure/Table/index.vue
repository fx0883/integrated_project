<template>
  <div class="pure-table">
    <!-- 表格工具栏 -->
    <div class="table-toolbar" v-if="showToolbar">
      <div class="toolbar-left">
        <slot name="toolbar-left"></slot>
      </div>
      <div class="toolbar-right">
        <el-tooltip content="刷新" placement="top" v-if="refreshable">
          <el-button :icon="Refresh" circle @click="refreshTable" />
        </el-tooltip>
        <el-tooltip content="密度" placement="top" v-if="densityControl">
          <el-dropdown @command="handleSizeChange">
            <el-button :icon="Scale" circle />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="large">宽松</el-dropdown-item>
                <el-dropdown-item command="default">默认</el-dropdown-item>
                <el-dropdown-item command="small">紧凑</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-tooltip>
        <el-tooltip content="列设置" placement="top" v-if="columnsControl">
          <el-dropdown>
            <el-button :icon="SetUp" circle />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="col in columnSettings" :key="col.prop">
                  <el-checkbox v-model="col.visible" @change="handleColumnVisibleChange">
                    {{ col.label }}
                  </el-checkbox>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-tooltip>
        <slot name="toolbar-right"></slot>
      </div>
    </div>

    <!-- 表格主体 -->
    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="tableData"
      :border="border"
      :stripe="stripe"
      :size="size"
      :height="height"
      :max-height="maxHeight"
      :show-header="showHeader"
      :highlight-current-row="highlightCurrentRow"
      :row-class-name="rowClassName"
      :row-style="rowStyle"
      :cell-class-name="cellClassName"
      :cell-style="cellStyle"
      :header-row-class-name="headerRowClassName"
      :header-row-style="headerRowStyle"
      :header-cell-class-name="headerCellClassName"
      :header-cell-style="headerCellStyle"
      v-bind="$attrs"
      @row-click="handleRowClick"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
      @header-click="handleHeaderClick"
      class="pure-el-table"
    >
      <!-- 选择列 -->
      <el-table-column
        v-if="selection"
        type="selection"
        width="50"
        fixed="left"
        align="center"
      />
      
      <!-- 序号列 -->
      <el-table-column
        v-if="showIndex"
        type="index"
        width="60"
        label="序号"
        align="center"
        :index="getIndex"
      />
      
      <!-- 数据列 -->
      <template v-for="(column, index) in visibleColumns" :key="index">
        <el-table-column
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          :fixed="column.fixed"
          :sortable="column.sortable"
          :show-overflow-tooltip="column.showTooltip"
          :align="column.align || 'left'"
        >
          <template #default="scope" v-if="column.slot || column.formatter">
            <slot :name="column.slot" v-bind="scope" v-if="column.slot"></slot>
            <span v-else-if="column.formatter">{{ column.formatter(scope.row, scope.column, scope.$index) }}</span>
          </template>
        </el-table-column>
      </template>
      
      <!-- 操作列 -->
      <el-table-column
        v-if="$slots.operation"
        :label="operationLabel"
        :width="operationWidth"
        :fixed="operationFixed"
        align="center"
      >
        <template #default="scope">
          <slot name="operation" v-bind="scope"></slot>
        </template>
      </el-table-column>
      
      <!-- 空数据显示 -->
      <template #empty>
        <slot name="empty">
          <el-empty description="暂无数据" />
        </slot>
      </template>
      
      <!-- 追加行 -->
      <template #append>
        <slot name="append"></slot>
      </template>
    </el-table>

    <!-- 分页组件 -->
    <div class="table-pagination" v-if="pagination && total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizes"
        :layout="paginationLayout"
        :total="total"
        :background="paginationBackground"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { Refresh, Scale, SetUp } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 表格引用
const tableRef = ref(null)

// 属性定义
const props = defineProps({
  // 数据配置
  data: {
    type: Array,
    default: () => []
  },
  // 列配置
  columns: {
    type: Array,
    default: () => []
  },
  // 表格加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 展示选择框
  selection: {
    type: Boolean,
    default: false
  },
  // 展示序号
  showIndex: {
    type: Boolean,
    default: true
  },
  // 表格边框
  border: {
    type: Boolean,
    default: true
  },
  // 斑马纹
  stripe: {
    type: Boolean,
    default: false
  },
  // 表格尺寸
  size: {
    type: String,
    default: 'default'
  },
  // 表格高度
  height: {
    type: [String, Number],
    default: null
  },
  // 表格最大高度
  maxHeight: {
    type: [String, Number],
    default: null
  },
  // 显示表头
  showHeader: {
    type: Boolean,
    default: true
  },
  // 高亮当前行
  highlightCurrentRow: {
    type: Boolean,
    default: false
  },
  // 行类名
  rowClassName: {
    type: [String, Function],
    default: ''
  },
  // 行样式
  rowStyle: {
    type: [Object, Function],
    default: () => {}
  },
  // 单元格类名
  cellClassName: {
    type: [String, Function],
    default: ''
  },
  // 单元格样式
  cellStyle: {
    type: [Object, Function],
    default: () => {}
  },
  // 表头行类名
  headerRowClassName: {
    type: [String, Function],
    default: ''
  },
  // 表头行样式
  headerRowStyle: {
    type: [Object, Function],
    default: () => {}
  },
  // 表头单元格类名
  headerCellClassName: {
    type: [String, Function],
    default: ''
  },
  // 表头单元格样式
  headerCellStyle: {
    type: [Object, Function],
    default: () => {}
  },
  // 操作列标题
  operationLabel: {
    type: String,
    default: '操作'
  },
  // 操作列宽度
  operationWidth: {
    type: [String, Number],
    default: 'auto'
  },
  // 操作列固定
  operationFixed: {
    type: String,
    default: 'right'
  },
  // 显示工具栏
  showToolbar: {
    type: Boolean,
    default: true
  },
  // 可刷新
  refreshable: {
    type: Boolean,
    default: true
  },
  // 密度控制
  densityControl: {
    type: Boolean,
    default: true
  },
  // 列控制
  columnsControl: {
    type: Boolean,
    default: true
  },
  // 分页设置
  pagination: {
    type: Boolean,
    default: true
  },
  // 总条数
  total: {
    type: Number,
    default: 0
  },
  // 当前页码
  currentPage: {
    type: Number,
    default: 1
  },
  // 每页条数
  pageSize: {
    type: Number,
    default: 10
  },
  // 分页尺寸
  pageSizes: {
    type: Array,
    default: () => [10, 20, 50, 100]
  },
  // 分页布局
  paginationLayout: {
    type: String,
    default: 'total, sizes, prev, pager, next, jumper'
  },
  // 分页背景
  paginationBackground: {
    type: Boolean,
    default: true
  }
})

// 事件定义
const emit = defineEmits([
  'update:currentPage', 
  'update:pageSize', 
  'refresh', 
  'row-click', 
  'selection-change',
  'sort-change',
  'header-click',
  'size-change'
])

// 表格数据
const tableData = computed(() => props.data || [])

// 列设置
const columnSettings = ref([])

// 初始化列设置
const initColumnSettings = () => {
  columnSettings.value = props.columns.map(col => ({
    ...col,
    visible: col.visible !== false // 默认显示
  }))
}

// 可见列
const visibleColumns = computed(() => {
  if (columnSettings.value.length === 0) return props.columns
  return columnSettings.value.filter(col => col.visible !== false)
})

// 处理列显示变更
const handleColumnVisibleChange = () => {
  // 如果全部隐藏了，至少要保留一列
  if (columnSettings.value.every(col => !col.visible)) {
    ElMessage.warning('至少保留一列')
    nextTick(() => {
      columnSettings.value[0].visible = true
    })
  }
}

// 获取序号
const getIndex = (index) => {
  return (props.currentPage - 1) * props.pageSize + index + 1
}

// 刷新表格
const refreshTable = () => {
  emit('refresh')
}

// 处理每页条数变化
const handleSizeChange = (size) => {
  if (typeof size === 'string' && ['large', 'default', 'small'].includes(size)) {
    // 修改表格尺寸
    props.size = size
    emit('size-change', size)
  } else {
    // 修改分页大小
    emit('update:pageSize', size)
  }
}

// 处理页码变化
const handleCurrentChange = (page) => {
  emit('update:currentPage', page)
}

// 处理行点击
const handleRowClick = (row, column, event) => {
  emit('row-click', row, column, event)
}

// 处理选择变化
const handleSelectionChange = (selection) => {
  emit('selection-change', selection)
}

// 处理排序变化
const handleSortChange = (sort) => {
  emit('sort-change', sort)
}

// 处理表头点击
const handleHeaderClick = (column, event) => {
  emit('header-click', column, event)
}

// 监听列配置变化
watch(() => props.columns, () => {
  initColumnSettings()
}, { deep: true })

// 组件挂载
onMounted(() => {
  initColumnSettings()
})

// 对外暴露方法
defineExpose({
  // 表格实例
  tableRef,
  // 重新加载
  reload: refreshTable,
  // 清除选择
  clearSelection: () => {
    tableRef.value?.clearSelection()
  },
  // 切换行选中状态
  toggleRowSelection: (row, selected) => {
    tableRef.value?.toggleRowSelection(row, selected)
  },
  // 设置表格当前行
  setCurrentRow: (row) => {
    tableRef.value?.setCurrentRow(row)
  },
  // 清除排序
  clearSort: () => {
    tableRef.value?.clearSort()
  },
  // 清除过滤
  clearFilter: (columnKeys) => {
    tableRef.value?.clearFilter(columnKeys)
  }
})
</script>

<style scoped>
.pure-table {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  margin-bottom: 8px;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.toolbar-right :deep(.el-button) {
  margin-left: 8px;
}

.pure-el-table {
  flex: 1;
  width: 100%;
}

.table-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

/* 暗黑模式适配 */
:deep(.dark-mode) .pure-table {
  background-color: var(--el-bg-color);
}
</style> 