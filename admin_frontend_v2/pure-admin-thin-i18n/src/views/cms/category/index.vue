<template>
  <div class="main-container">
    <div class="top-container mb-4">
      <div class="left">
        <el-button type="primary" @click="handleAddCategory">
          <el-icon><Plus /></el-icon> 新增分类
        </el-button>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
        <el-button @click="debugData">
          <el-icon><Warning /></el-icon> 调试
        </el-button>
      </div>
      <div class="right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索分类名称"
          prefix-icon="Search"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #append>
            <el-button @click="handleSearch">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
      </div>
    </div>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>分类管理</span>
          <div class="right">
            <el-switch
              v-model="showTree"
              active-text="树形结构"
              inactive-text="列表"
              class="mr-4"
            />
            <el-tooltip content="只显示启用的分类">
              <el-switch
                v-model="onlyActive"
                active-text="只看启用"
                @change="handleFilterChange"
              />
            </el-tooltip>
          </div>
        </div>
      </template>

      <div v-loading="loading">
        <!-- 调试信息 -->
        <div v-if="debugMode" class="debug-info mb-4">
          <h3>调试信息</h3>
          <pre>{{ debugInfo }}</pre>
        </div>

        <!-- 树形结构 -->
        <template v-if="showTree">
          <div
            class="tree-container"
            v-if="categoryTree && categoryTree.length > 0"
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
                    <el-icon v-if="data.icon" :class="data.icon" class="mr-1" />
                    <el-icon v-else><Folder /></el-icon>
                    <span class="ml-1">{{ node.label }}</span>
                    <el-tag
                      v-if="!data.is_active"
                      size="small"
                      type="danger"
                      class="ml-2"
                      >禁用</el-tag
                    >
                    <el-tag
                      v-if="data.article_count"
                      size="small"
                      type="info"
                      class="ml-2"
                      >{{ data.article_count }} 篇</el-tag
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
                  <el-icon v-if="row.icon" :class="row.icon" class="mr-1" />
                  <el-icon v-else><Folder /></el-icon>
                  <span class="ml-1">{{ row.name }}</span>
                  <el-tag
                    v-if="row.level > 0"
                    size="small"
                    type="info"
                    class="ml-2"
                  >
                    层级 {{ row.level }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="slug" label="别名" min-width="150" />
            <el-table-column prop="parent_id" label="父级分类" min-width="100">
              <template #default="{ row }">
                {{
                  row.parent_id
                    ? getCategoryNameById(row.parent_id)
                    : "顶级分类"
                }}
              </template>
            </el-table-column>
            <el-table-column prop="article_count" label="文章数" width="100" />
            <el-table-column prop="sort_order" label="排序" width="100" />
            <el-table-column prop="is_active" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.is_active ? 'success' : 'danger'">
                  {{ row.is_active ? "启用" : "禁用" }}
                </el-tag>
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
    >
      <category-form
        :form-mode="formDialog.mode"
        :edit-id="formDialog.editId"
        :category-data="formDialog.categoryData"
        :loading="formDialog.loading"
        @submit="handleFormSubmit"
        @cancel="formDialog.visible = false"
      />
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
import { ref, reactive, computed, onMounted } from "vue";
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
  loading: false
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
    await cmsStore.fetchCategoryTree();
    await cmsStore.fetchCategoryList();

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

      // 获取分类树数据
      const treeResponse = await fetch(
        "http://localhost:8000/api/v1/cms/categories/tree/",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`
          }
        }
      );
      const treeData = await treeResponse.json();

      debugInfo.value = JSON.stringify(
        {
          apiResponse: data,
          apiTreeResponse: treeData,
          storeData: {
            categoryTree: cmsStore.categoryTree,
            categoryList: cmsStore.categoryList
          }
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
  // 确保 categoryTree 存在
  if (!cmsStore.categoryTree || !Array.isArray(cmsStore.categoryTree)) {
    return [];
  }

  if (!searchKeyword.value && !onlyActive.value) {
    return cmsStore.categoryTree;
  }

  // 递归过滤树
  const filterTree = (nodes: Category[]): Category[] => {
    if (!nodes || !Array.isArray(nodes)) return [];

    return nodes
      .filter(node => {
        const matchesSearch =
          !searchKeyword.value ||
          node.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
          (node.slug &&
            node.slug
              .toLowerCase()
              .includes(searchKeyword.value.toLowerCase()));

        const matchesActive = !onlyActive.value || node.is_active;

        return matchesSearch && matchesActive;
      })
      .map(node => {
        if (node.children && node.children.length > 0) {
          return {
            ...node,
            children: filterTree(node.children)
          };
        }
        return node;
      });
  };

  return filterTree(cmsStore.categoryTree);
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
          item.slug.toLowerCase().includes(searchKeyword.value.toLowerCase()))
    );
  }

  if (onlyActive.value) {
    list = list.filter(item => item.is_active);
  }

  return list;
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
  formDialog.visible = true;
  formDialog.title = `新增 "${parent.name}" 的子分类`;
  formDialog.mode = "create";
  formDialog.editId = undefined;
  formDialog.categoryData = {
    ...formDialog.categoryData,
    parent_id: parent.id
  } as Category;
};

// 编辑分类
const handleEditCategory = async (category: Category) => {
  formDialog.visible = true;
  formDialog.title = `编辑分类: ${category.name}`;
  formDialog.mode = "edit";
  formDialog.editId = category.id;
  formDialog.loading = true;

  try {
    const data = await cmsStore.fetchCategoryDetail(category.id);
    formDialog.categoryData = data;
  } catch (error) {
    console.error("获取分类详情失败", error);
  } finally {
    formDialog.loading = false;
  }
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
      orderData.parent_id = dropNodeData.id;
    } else if (dropType === "before" || dropType === "after") {
      // 放置为同级节点
      const dropNodeData = dropNode.data as Category;
      orderData.parent_id = dropNodeData.parent_id;
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
  fetchCategoryData();
});
</script>

<style scoped>
.main-container {
  padding: 16px;
}

.top-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.left {
  display: flex;
  gap: 10px;
}

.right {
  display: flex;
  align-items: center;
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
