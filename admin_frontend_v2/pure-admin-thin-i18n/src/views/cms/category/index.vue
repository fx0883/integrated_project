<template>
  <div class="category-list-container">
    <!-- 标题和新建按钮 -->
    <div class="category-list-header">
      <h2 class="category-list-title">分类管理</h2>
      <el-button type="primary" :icon="Plus" @click="handleAddCategory">
        新增分类
      </el-button>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <el-form @keyup.enter="handleSearch">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="关键词">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索分类名称"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="显示方式">
              <el-switch
                v-model="showTree"
                active-text="树形结构"
                inactive-text="列表"
                class="mr-4"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态">
              <el-tooltip content="只显示启用的分类">
                <el-switch
                  v-model="onlyActive"
                  active-text="只看启用"
                  @change="handleFilterChange"
                />
              </el-tooltip>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item class="search-buttons">
          <el-button type="primary" :icon="Search" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="refreshData"> 刷新 </el-button>
          <el-button
            v-if="debugMode"
            :icon="Warning"
            @click="debugData"
            type="warning"
          >
            关闭调试
          </el-button>
          <el-button v-else :icon="Warning" @click="debugData">
            调试
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 调试信息 -->
    <div v-if="debugMode" class="debug-info mb-4">
      <h3>调试信息</h3>
      <pre>{{ debugInfo }}</pre>
    </div>

    <!-- 分类数据 -->
    <el-card class="table-card">
      <div v-loading="loading">
        <!-- 树形结构 -->
        <template v-if="showTree">
          <div
            class="tree-container"
            v-if="filteredCategoryTree && filteredCategoryTree.length > 0"
          >
            <el-tree
              ref="treeRef"
              :data="filteredCategoryTree"
              node-key="id"
              :props="{ label: 'name', children: 'children' }"
              default-expand-all
              draggable
              @node-drag-end="handleDragEnd"
            >
              <template #default="{ node, data }">
                <div class="custom-tree-node">
                  <div class="node-label">
                    <IconifyIconOnline
                      v-if="data.icon"
                      :icon="data.icon"
                      class="mr-1"
                    />
                    <el-icon v-else><Folder /></el-icon>
                    <span class="ml-1">{{ node.label }}</span>
                    <el-tag
                      v-if="!data.is_active"
                      size="small"
                      type="danger"
                      class="ml-2"
                      >禁用</el-tag
                    >
                  </div>
                  <div class="node-actions">
                    <el-tooltip content="添加子分类">
                      <el-button
                        type="primary"
                        link
                        size="small"
                        @click.stop="handleAddSubCategory(data)"
                      >
                        <el-icon><Plus /></el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="编辑">
                      <el-button
                        type="primary"
                        link
                        size="small"
                        @click.stop="handleEditCategory(data)"
                      >
                        <el-icon><Edit /></el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="删除">
                      <el-button
                        type="danger"
                        link
                        size="small"
                        @click.stop="handleDeleteCategory(data)"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </el-tooltip>
                  </div>
                </div>
              </template>
            </el-tree>
          </div>
          <el-empty v-else description="暂无分类数据" />
        </template>

        <!-- 列表结构 -->
        <template v-else>
          <el-table :data="filteredCategoryList" border style="width: 100%">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="名称" min-width="180">
              <template #default="{ row }">
                <div class="flex items-center">
                  <IconifyIconOnline
                    v-if="row.icon"
                    :icon="row.icon"
                    class="mr-1"
                  />
                  <el-icon v-else><Folder /></el-icon>
                  <span class="ml-1">{{ row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="slug" label="别名" min-width="150" />
            <el-table-column
              prop="description"
              label="描述"
              min-width="180"
              show-overflow-tooltip
            />
            <el-table-column prop="parent" label="父级分类" min-width="100">
              <template #default="{ row }">
                {{ row.parent ? getCategoryNameById(row.parent) : "顶级分类" }}
              </template>
            </el-table-column>
            <el-table-column prop="sort_order" label="排序" width="80" />
            <el-table-column prop="is_active" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.is_active ? 'success' : 'danger'">
                  {{ row.is_active ? "启用" : "禁用" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  link
                  size="small"
                  @click="handleAddSubCategory(row)"
                >
                  <el-icon><Plus /></el-icon> 添加子分类
                </el-button>
                <el-button
                  type="primary"
                  link
                  size="small"
                  @click="handleEditCategory(row)"
                >
                  <el-icon><Edit /></el-icon> 编辑
                </el-button>
                <el-button
                  type="danger"
                  link
                  size="small"
                  @click="handleDeleteCategory(row)"
                >
                  <el-icon><Delete /></el-icon> 删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </div>
    </el-card>

    <!-- 分类表单对话框 -->
    <el-dialog
      v-model="formDialog.visible"
      :title="formDialog.title"
      width="50%"
      destroy-on-close
      :append-to-body="true"
      @closed="handleDialogClosed"
    >
      <template v-if="formDialog.visible">
        <category-form
          :key="
            formDialog.mode +
            '-' +
            (formDialog.editId || 'new') +
            '-' +
            (formDialog.defaultParentId || 'none')
          "
          :form-mode="formDialog.mode"
          :edit-id="formDialog.editId"
          :category-data="formDialog.categoryData"
          :loading="formDialog.loading"
          :default-parent-id="formDialog.defaultParentId"
          @submit="handleFormSubmit"
          @cancel="formDialog.visible = false"
        />
      </template>
    </el-dialog>

    <!-- 确认对话框 -->
    <confirm-dialog
      v-model:visible="confirmDialog.visible"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :type="confirmDialog.type"
      :loading="confirmDialog.loading"
      @confirm="handleConfirmDelete"
      @cancel="confirmDialog.visible = false"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Edit,
  Delete,
  Search,
  Refresh,
  Folder,
  Warning
} from "@element-plus/icons-vue";
import { useCmsStore } from "@/store/modules/cms";
import type { Category, CategoryOrderParams } from "@/types/cms";
import CategoryForm from "@/components/Cms/Category/CategoryForm.vue";
import ConfirmDialog from "@/components/Cms/Category/ConfirmDialog.vue";
import { IconifyIconOnline } from "@/components/ReIcon";

const cmsStore = useCmsStore();
const treeRef = ref();

// 加载状态
const loading = ref(false);
// 显示模式：树形/列表
const showTree = ref(true);
// 搜索关键词
const searchKeyword = ref("");
// 仅显示启用的分类
const onlyActive = ref(false);

// 调试相关
const debugMode = ref(false);
const debugInfo = ref("");

// 表单对话框状态
const formDialog = reactive({
  visible: false,
  title: "新增分类",
  mode: "create" as "create" | "edit",
  editId: undefined as number | undefined,
  categoryData: null as Category | null,
  loading: false,
  defaultParentId: undefined as number | undefined
});

// 确认对话框状态
const confirmDialog = reactive({
  visible: false,
  title: "确认删除",
  message: "确定要删除此分类吗？删除后无法恢复，且会同步删除其下所有子分类。",
  type: "warning" as "info" | "warning" | "error",
  loading: false,
  categoryId: undefined as number | undefined
});

// 获取分类数据
const fetchCategoryData = async () => {
  loading.value = true;
  try {
    // 获取分类列表
    await cmsStore.fetchCategoryList();
    // 构建树形结构
    await cmsStore.fetchCategoryTree();

    // 调试信息
    if (debugMode.value) {
      debugInfo.value = JSON.stringify(
        {
          categoryTree: cmsStore.categoryTree,
          categoryList: cmsStore.categoryList
        },
        null,
        2
      );
    }
  } catch (error) {
    console.error("获取分类数据失败", error);
  } finally {
    loading.value = false;
  }
};

// 调试数据
const debugData = async () => {
  debugMode.value = !debugMode.value;
  if (debugMode.value) {
    try {
      // 直接调用API获取数据进行比较
      const response = await fetch(
        "http://localhost:8000/api/v1/cms/categories/",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`
          }
        }
      );
      const data = await response.json();

      // 检查树形数据结构
      const treeDataStructure = {
        isArray: Array.isArray(cmsStore.categoryTree),
        length: Array.isArray(cmsStore.categoryTree)
          ? cmsStore.categoryTree.length
          : "不是数组",
        firstItem:
          Array.isArray(cmsStore.categoryTree) &&
          cmsStore.categoryTree.length > 0
            ? cmsStore.categoryTree[0]
            : "无数据"
      };

      debugInfo.value = JSON.stringify(
        {
          apiResponse: data,
          storeData: {
            categoryTree: cmsStore.categoryTree,
            categoryList: cmsStore.categoryList,
            filteredCategoryTree: filteredCategoryTree.value
          },
          treeDataStructure: treeDataStructure
        },
        null,
        2
      );
    } catch (error) {
      debugInfo.value = `调试错误: ${error.message}`;
    }
  }
};

// 刷新数据
const refreshData = () => {
  fetchCategoryData();
};

// 计算属性：过滤后的分类树
const filteredCategoryTree = computed(() => {
  // 确保 categoryList 存在
  if (!cmsStore.categoryList || !Array.isArray(cmsStore.categoryList)) {
    console.warn("filteredCategoryTree - categoryList 为 undefined");
    return [];
  }

  // 记录过滤前的分类列表长度
  console.log(
    "filteredCategoryTree - 过滤前的分类列表长度:",
    cmsStore.categoryList.length
  );

  // 首先过滤分类列表
  let filteredList = cmsStore.categoryList;

  if (searchKeyword.value) {
    filteredList = filteredList.filter(
      item =>
        item.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
        (item.slug &&
          item.slug
            .toLowerCase()
            .includes(searchKeyword.value.toLowerCase())) ||
        (item.description &&
          item.description
            .toLowerCase()
            .includes(searchKeyword.value.toLowerCase()))
    );
  }

  if (onlyActive.value) {
    filteredList = filteredList.filter(item => item.is_active);
  }

  // 构建树形结构
  const buildTree = () => {
    // 找出所有顶级分类（没有父级的分类）
    const rootCategories = filteredList.filter(item => !item.parent);

    // 递归构建子树
    const buildSubTree = (parentId: number): Category[] => {
      return filteredList
        .filter(item => item.parent === parentId)
        .map(item => ({
          ...item,
          children: buildSubTree(item.id)
        }));
    };

    // 为每个顶级分类添加子分类
    return rootCategories.map(root => ({
      ...root,
      children: buildSubTree(root.id)
    }));
  };

  const result = buildTree();
  console.log("filteredCategoryTree - 构建的树形结构长度:", result.length);
  return result;
});

// 计算属性：过滤后的分类列表
const filteredCategoryList = computed(() => {
  // 确保 categoryList 存在
  if (!cmsStore.categoryList || !Array.isArray(cmsStore.categoryList)) {
    return [];
  }

  let list = cmsStore.categoryList;

  if (searchKeyword.value) {
    list = list.filter(
      item =>
        item.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
        (item.slug &&
          item.slug
            .toLowerCase()
            .includes(searchKeyword.value.toLowerCase())) ||
        (item.description &&
          item.description
            .toLowerCase()
            .includes(searchKeyword.value.toLowerCase()))
    );
  }

  if (onlyActive.value) {
    list = list.filter(item => item.is_active);
  }

  // 按名称排序
  return [...list].sort((a, b) => a.name.localeCompare(b.name));
});

// 通过ID获取分类名称
const getCategoryNameById = (id: number): string => {
  if (!cmsStore.categoryList || !Array.isArray(cmsStore.categoryList)) {
    return "未知分类";
  }
  const category = cmsStore.categoryList.find(item => item.id === id);
  return category ? category.name : "未知分类";
};

// 处理搜索
const handleSearch = () => {
  if (showTree.value) {
    // 树形模式下直接使用计算属性过滤
  } else {
    // 列表模式下可以通过API重新加载
    fetchCategoryData();
  }
};

// 处理过滤条件变更
const handleFilterChange = () => {
  handleSearch();
};

// 新增顶级分类
const handleAddCategory = () => {
  formDialog.visible = true;
  formDialog.title = "新增分类";
  formDialog.mode = "create";
  formDialog.editId = undefined;
  formDialog.categoryData = null;
};

// 新增子分类
const handleAddSubCategory = (parent: Category) => {
  console.log("[CategoryIndex] 添加子分类 - 父级分类:", parent);

  // 重置对话框状态
  formDialog.visible = false; // 先关闭对话框，确保组件会重新创建

  // 使用 nextTick 确保在 DOM 更新后再打开对话框
  nextTick(() => {
    // 设置对话框状态
    formDialog.mode = "create";
    formDialog.editId = undefined;
    formDialog.loading = false;
    formDialog.defaultParentId = parent.id;

    // 创建一个新的分类数据对象，包含父级ID
    formDialog.categoryData = {
      parent: parent.id,
      name: "",
      slug: "",
      description: "",
      is_active: true,
      sort_order: 0
    } as Category;

    // 设置对话框标题
    formDialog.title = `新增 "${parent.name}" 的子分类`;

    // 显示对话框
    formDialog.visible = true;

    console.log("[CategoryIndex] 添加子分类 - 设置的数据:", {
      parent,
      formDialog: {
        mode: formDialog.mode,
        editId: formDialog.editId,
        loading: formDialog.loading,
        defaultParentId: formDialog.defaultParentId,
        categoryData: formDialog.categoryData,
        title: formDialog.title,
        visible: formDialog.visible
      }
    });
  });
};

// 编辑分类
const handleEditCategory = async (category: Category) => {
  // 先重置对话框状态
  formDialog.visible = false;
  formDialog.categoryData = null; // 先清空数据，避免显示旧数据

  // 使用nextTick确保DOM更新后再打开对话框
  nextTick(async () => {
    formDialog.title = `编辑分类: ${category.name}`;
    formDialog.mode = "edit";
    formDialog.editId = category.id;
    formDialog.loading = true;
    formDialog.visible = true;

    try {
      const data = await cmsStore.fetchCategoryDetail(category.id);
      console.log("获取到的分类详情:", data);

      // 确保数据获取成功后再设置
      if (data) {
        formDialog.categoryData = data;
        console.log("设置表单数据:", formDialog.categoryData);
      } else {
        console.error("获取分类详情失败，返回数据为空");
        ElMessage.error("获取分类详情失败，返回数据为空");
      }
    } catch (error) {
      console.error("获取分类详情失败", error);
      ElMessage.error("获取分类详情失败");
    } finally {
      formDialog.loading = false;
    }
  });
};

// 删除分类
const handleDeleteCategory = (category: Category) => {
  confirmDialog.visible = true;
  confirmDialog.title = "确认删除";
  confirmDialog.message = `确定要删除分类 "${category.name}" 吗？删除后无法恢复，且会同步删除其下所有子分类。`;
  confirmDialog.categoryId = category.id;
};

// 确认删除
const handleConfirmDelete = async () => {
  if (!confirmDialog.categoryId) return;

  confirmDialog.loading = true;
  try {
    await cmsStore.deleteCategory(confirmDialog.categoryId);
    await fetchCategoryData();
    confirmDialog.visible = false;
  } catch (error) {
    console.error("删除分类失败", error);
  } finally {
    confirmDialog.loading = false;
  }
};

// 处理表单提交
const handleFormSubmit = async () => {
  formDialog.visible = false;
  await fetchCategoryData();
};

// 处理拖拽结束
const handleDragEnd = async (
  draggingNode: any,
  dropNode: any,
  dropType: string,
  ev: Event
) => {
  const draggingNodeData = draggingNode.data as Category;

  try {
    const orderData: CategoryOrderParams = {
      id: draggingNodeData.id,
      sort_order: draggingNodeData.sort_order
    };

    // 根据放置类型更新父级ID
    if (dropType === "inner") {
      // 放置为子节点
      const dropNodeData = dropNode.data as Category;
      orderData.parent = dropNodeData.id;
    } else if (dropType === "before" || dropType === "after") {
      // 放置为同级节点
      const dropNodeData = dropNode.data as Category;
      orderData.parent = dropNodeData.parent;
    }

    await cmsStore.updateCategoryOrder([orderData]);
    ElMessage.success("分类排序更新成功");
    await fetchCategoryData();
  } catch (error) {
    console.error("更新分类排序失败", error);
    // 恢复拖拽前的状态
    await fetchCategoryData();
  }
};

// 组件挂载后获取数据
onMounted(() => {
  fetchCategoryData().then(() => {
    // 添加详细日志记录
    console.log("组件挂载后 - 分类树数据:", cmsStore.categoryTree);
    console.log(
      "组件挂载后 - 分类树长度:",
      Array.isArray(cmsStore.categoryTree)
        ? cmsStore.categoryTree.length
        : "不是数组"
    );
    console.log("组件挂载后 - 分类列表数据:", cmsStore.categoryList);
    console.log(
      "组件挂载后 - 分类列表长度:",
      Array.isArray(cmsStore.categoryList)
        ? cmsStore.categoryList.length
        : "不是数组"
    );

    // 检查过滤后的树形数据
    console.log("组件挂载后 - 过滤后的分类树:", filteredCategoryTree.value);
    console.log(
      "组件挂载后 - 过滤后的分类树长度:",
      Array.isArray(filteredCategoryTree.value)
        ? filteredCategoryTree.value.length
        : "不是数组"
    );
  });
});

// 监听显示模式变化
watch(showTree, newVal => {
  console.log("显示模式变更:", newVal ? "树形结构" : "列表");
  console.log("filteredCategoryTree 数据:", filteredCategoryTree.value);
  console.log("filteredCategoryTree 长度:", filteredCategoryTree.value.length);
});

// 处理对话框关闭
const handleDialogClosed = () => {
  console.log("[CategoryIndex] 对话框关闭");
  // 重置对话框状态
  formDialog.categoryData = null;
  formDialog.defaultParentId = undefined;
  console.log("[CategoryIndex] 对话框关闭后重置状态:", {
    categoryData: formDialog.categoryData,
    defaultParentId: formDialog.defaultParentId
  });
};

// 格式化日期时间
const formatDateTime = (dateTimeString: string) => {
  if (!dateTimeString) return "";
  const date = new Date(dateTimeString);
  return date.toLocaleString();
};
</script>

<style scoped>
.category-list-container {
  padding: 20px;
}

.category-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.category-list-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.search-card {
  margin-bottom: 20px;
}

.search-buttons {
  display: flex;
  justify-content: center;
  margin-bottom: 0;
}

.table-card {
  margin-bottom: 20px;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.node-label {
  display: flex;
  align-items: center;
}

.node-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.custom-tree-node:hover .node-actions {
  opacity: 1;
}

.tree-container {
  min-height: 300px;
}

/* 调试信息样式 */
.debug-info {
  background-color: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 16px;
  overflow: auto;
  max-height: 400px;
}

.debug-info pre {
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

/* Tailwind-like utility classes */
.mb-4 {
  margin-bottom: 1rem;
}

.mr-4 {
  margin-right: 1rem;
}

.mr-1 {
  margin-right: 0.25rem;
}

.ml-1 {
  margin-left: 0.25rem;
}

.ml-2 {
  margin-left: 0.5rem;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}
</style>
