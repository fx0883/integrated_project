<template>
  <div class="tag-list-page">
    <div class="page-header">
      <h2 class="page-title">标签管理</h2>
      <div class="page-actions">
        <el-button type="primary" @click="handleCreate" icon="Plus">新建标签</el-button>
        <el-button type="success" @click="handleCreateGroup" icon="FolderAdd">新建标签组</el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="6">
        <!-- 标签组卡片 -->
        <el-card class="tag-group-card">
          <template #header>
            <div class="card-header">
              <div class="card-title">标签组</div>
              <div class="card-actions">
                <el-tooltip content="刷新数据">
                  <el-button icon="Refresh" circle @click="loadTagGroups" />
                </el-tooltip>
              </div>
            </div>
          </template>

          <div v-loading="groupsLoading">
            <div class="tag-group-search mb-3">
              <el-input
                v-model="groupSearchKeyword"
                placeholder="搜索标签组"
                clearable
                prefix-icon="Search"
              />
            </div>

            <el-menu
              :default-active="activeGroupId ? activeGroupId.toString() : ''"
              class="tag-group-menu"
              @select="handleGroupSelect"
            >
              <el-menu-item index="">
                <el-icon><Collection /></el-icon>
                <span>所有标签</span>
                <el-tag type="info" size="small" class="ml-auto">{{ totalTagsCount }}</el-tag>
              </el-menu-item>
              <el-divider />
              <el-menu-item
                v-for="group in filteredTagGroups"
                :key="group.id"
                :index="group.id.toString()"
              >
                <el-icon><Folder /></el-icon>
                <span>{{ group.name }}</span>
                <el-tag size="small" class="ml-auto">{{ group.tags_count || 0 }}</el-tag>
              </el-menu-item>
            </el-menu>
          </div>
        </el-card>
      </el-col>

      <el-col :span="18">
        <!-- 标签列表卡片 -->
        <el-card class="tag-list-card">
          <template #header>
            <div class="card-header">
              <div class="card-title">
                {{ activeGroup ? `${activeGroup.name} - 标签列表` : '所有标签' }}
              </div>
              <div class="tag-list-actions">
                <el-input
                  v-model="tagSearchKeyword"
                  placeholder="搜索标签"
                  clearable
                  prefix-icon="Search"
                  style="width: 250px"
                  class="mr-2"
                />
                <el-button-group>
                  <el-tooltip content="刷新数据">
                    <el-button icon="Refresh" @click="loadTags" />
                  </el-tooltip>
                  <el-tooltip content="批量操作">
                    <el-button icon="Operation" @click="showBatchActions = !showBatchActions" />
                  </el-tooltip>
                </el-button-group>
              </div>
            </div>
          </template>

          <div v-if="showBatchActions" class="batch-actions mb-3">
            <el-space>
              <el-button type="danger" :disabled="!selectedTags.length" @click="handleBatchDelete">
                批量删除
              </el-button>
              <el-button :disabled="!selectedTags.length" @click="handleBatchMove">
                移动到标签组
              </el-button>
              <span v-if="selectedTags.length" class="selected-count">
                已选择 {{ selectedTags.length }} 个标签
              </span>
            </el-space>
          </div>

          <div v-loading="tagsLoading" class="tag-table-container">
            <el-table
              ref="tagTableRef"
              :data="filteredTags"
              @selection-change="handleSelectionChange"
              border
              style="width: 100%"
            >
              <el-table-column v-if="showBatchActions" type="selection" width="50" />
              
              <el-table-column prop="name" label="标签名称" min-width="150">
                <template #default="{ row }">
                  <div class="tag-name-cell">
                    <el-tag :type="row.color || ''" effect="plain">{{ row.name }}</el-tag>
                    <el-tag v-if="row.is_featured" type="warning" size="small" class="ml-2">热门</el-tag>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column prop="slug" label="别名" width="150">
                <template #default="{ row }">
                  <el-tag effect="plain" size="small">{{ row.slug }}</el-tag>
                </template>
              </el-table-column>
              
              <el-table-column prop="group.name" label="所属组" width="150">
                <template #default="{ row }">
                  <el-tag v-if="row.group" type="success" effect="plain">{{ row.group.name }}</el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              
              <el-table-column prop="description" label="描述" min-width="200">
                <template #default="{ row }">
                  <span>{{ row.description || '暂无描述' }}</span>
                </template>
              </el-table-column>
              
              <el-table-column prop="status" label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.is_active" type="success">已启用</el-tag>
                  <el-tag v-else type="info">已禁用</el-tag>
                </template>
              </el-table-column>
              
              <el-table-column label="文章数" width="100" align="center">
                <template #default="{ row }">
                  <el-button type="primary" link>{{ row.articles_count || 0 }}</el-button>
                </template>
              </el-table-column>

              <el-table-column label="操作" width="180" fixed="right">
                <template #default="{ row }">
                  <el-button-group>
                    <el-tooltip content="编辑">
                      <el-button 
                        icon="Edit" 
                        size="small" 
                        @click="handleEdit(row)"
                      />
                    </el-tooltip>
                    <el-tooltip :content="row.is_active ? '禁用' : '启用'">
                      <el-button 
                        :icon="row.is_active ? 'Close' : 'Check'"
                        size="small"
                        @click="toggleStatus(row)"
                      />
                    </el-tooltip>
                    <el-tooltip content="删除">
                      <el-button 
                        icon="Delete" 
                        size="small" 
                        type="danger"
                        @click="handleDelete(row)"
                      />
                    </el-tooltip>
                  </el-button-group>
                </template>
              </el-table-column>
            </el-table>
            
            <div class="pagination-container">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="totalTagsCount"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 标签统计卡片 -->
    <el-row :gutter="20" class="mt-4">
      <el-col :span="24">
        <el-card class="statistics-card">
          <template #header>
            <div class="card-header">
              <div class="card-title">标签统计</div>
              <el-button type="primary" link icon="Refresh" @click="loadStatistics">刷新</el-button>
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :span="6">
              <div class="statistic-item">
                <div class="statistic-title">总标签数</div>
                <div class="statistic-value">{{ statistics.total_count || 0 }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="statistic-item">
                <div class="statistic-title">标签组数</div>
                <div class="statistic-value">{{ statistics.groups_count || 0 }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="statistic-item">
                <div class="statistic-title">活跃标签数</div>
                <div class="statistic-value">{{ statistics.active_count || 0 }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="statistic-item">
                <div class="statistic-title">最多文章标签</div>
                <div class="statistic-value">{{ statistics.most_articles_tag?.name || '-' }}</div>
                <div class="statistic-subtitle">{{ statistics.most_articles_tag?.articles_count || 0 }} 篇文章</div>
              </div>
            </el-col>
          </el-row>
          
          <el-divider />
          
          <h4>热门标签排行</h4>
          <div class="popular-tags">
            <div class="tag-cloud">
              <el-tag
                v-for="tag in statistics.popular_tags || []"
                :key="tag.id"
                :type="tag.color || ''"
                effect="light"
                class="tag-item"
                :style="{ fontSize: getTagSize(tag.articles_count) }"
              >
                {{ tag.name }} ({{ tag.articles_count }})
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 标签表单对话框 -->
    <el-dialog
      v-model="tagDialogVisible"
      :title="formType === 'create' ? '新建标签' : '编辑标签'"
      width="550px"
      destroy-on-close
    >
      <el-form
        ref="tagFormRef"
        :model="tagForm"
        :rules="tagRules"
        label-width="100px"
        status-icon
      >
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="tagForm.name" placeholder="请输入标签名称" />
        </el-form-item>
        
        <el-form-item label="别名" prop="slug">
          <el-input v-model="tagForm.slug" placeholder="请输入标签别名(英文字母、数字或连字符)" />
        </el-form-item>
        
        <el-form-item label="所属标签组" prop="group_id">
          <el-select v-model="tagForm.group_id" placeholder="请选择标签组" clearable class="w-full">
            <el-option
              v-for="group in tagGroups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="tagForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入标签描述"
          />
        </el-form-item>
        
        <el-form-item label="颜色" prop="color">
          <el-select v-model="tagForm.color" placeholder="请选择标签颜色" clearable class="w-full">
            <el-option label="默认" value="" />
            <el-option label="主要" value="primary" />
            <el-option label="成功" value="success" />
            <el-option label="警告" value="warning" />
            <el-option label="危险" value="danger" />
            <el-option label="信息" value="info" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态" prop="is_active">
          <el-switch
            v-model="tagForm.is_active"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
        
        <el-form-item label="热门标签" prop="is_featured">
          <el-switch v-model="tagForm.is_featured" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="tagDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTagForm" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 标签组表单对话框 -->
    <el-dialog
      v-model="groupDialogVisible"
      :title="groupFormType === 'create' ? '新建标签组' : '编辑标签组'"
      width="550px"
      destroy-on-close
    >
      <el-form
        ref="groupFormRef"
        :model="groupForm"
        :rules="groupRules"
        label-width="100px"
        status-icon
      >
        <el-form-item label="组名称" prop="name">
          <el-input v-model="groupForm.name" placeholder="请输入标签组名称" />
        </el-form-item>
        
        <el-form-item label="别名" prop="slug">
          <el-input v-model="groupForm.slug" placeholder="请输入标签组别名(英文字母、数字或连字符)" />
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="groupForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入标签组描述"
          />
        </el-form-item>
        
        <el-form-item label="状态" prop="is_active">
          <el-switch
            v-model="groupForm.is_active"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="groupDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitGroupForm" :loading="groupSubmitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量移动标签对话框 -->
    <el-dialog
      v-model="batchMoveDialogVisible"
      title="批量移动标签"
      width="450px"
    >
      <el-form>
        <el-form-item label="目标标签组" label-width="100px">
          <el-select v-model="targetGroupId" placeholder="请选择标签组" clearable class="w-full">
            <el-option
              v-for="group in tagGroups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="batchMoveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchMove" :loading="batchMoveLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Edit, Delete, Refresh, Check, Close, Search,
  Collection, Folder, FolderAdd, Operation 
} from '@element-plus/icons-vue'
import { tagApi } from '@/api/tag'
import { debounce } from 'lodash-es'

// 状态变量
const tagsLoading = ref(false)
const groupsLoading = ref(false)
const tagData = ref([])
const tagGroups = ref([])
const activeGroupId = ref(null)
const activeGroup = ref(null)
const statistics = ref({})
const tagDialogVisible = ref(false)
const groupDialogVisible = ref(false)
const batchMoveDialogVisible = ref(false)
const formType = ref('create') // create 或 edit
const groupFormType = ref('create') // create 或 edit
const tagFormRef = ref(null)
const groupFormRef = ref(null)
const submitLoading = ref(false)
const groupSubmitLoading = ref(false)
const batchMoveLoading = ref(false)

// 分页相关
const currentPage = ref(1)
const pageSize = ref(20)
const totalTagsCount = ref(0)

// 搜索相关
const tagSearchKeyword = ref('')
const groupSearchKeyword = ref('')

// 批量操作相关
const showBatchActions = ref(false)
const selectedTags = ref([])
const targetGroupId = ref(null)

// 表格引用
const tagTableRef = ref(null)

// 标签表单数据
const tagForm = reactive({
  id: null,
  name: '',
  slug: '',
  description: '',
  group_id: null,
  color: '',
  is_active: true,
  is_featured: false
})

// 标签组表单数据
const groupForm = reactive({
  id: null,
  name: '',
  slug: '',
  description: '',
  is_active: true
})

// 标签验证规则
const tagRules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 1, max: 30, message: '长度在 1 到 30 个字符', trigger: 'blur' }
  ],
  slug: [
    { required: true, message: '请输入标签别名', trigger: 'blur' },
    { pattern: /^[a-z0-9-]+$/, message: '只能包含小写字母、数字和连字符', trigger: 'blur' }
  ]
}

// 标签组验证规则
const groupRules = {
  name: [
    { required: true, message: '请输入标签组名称', trigger: 'blur' },
    { min: 2, max: 30, message: '长度在 2 到 30 个字符', trigger: 'blur' }
  ],
  slug: [
    { required: true, message: '请输入标签组别名', trigger: 'blur' },
    { pattern: /^[a-z0-9-]+$/, message: '只能包含小写字母、数字和连字符', trigger: 'blur' }
  ]
}

// 计算属性: 过滤后的标签
const filteredTags = computed(() => {
  if (!tagSearchKeyword.value) return tagData.value
  
  const keyword = tagSearchKeyword.value.toLowerCase()
  return tagData.value.filter(tag => 
    tag.name.toLowerCase().includes(keyword) || 
    tag.slug.toLowerCase().includes(keyword) ||
    (tag.description && tag.description.toLowerCase().includes(keyword))
  )
})

// 计算属性: 过滤后的标签组
const filteredTagGroups = computed(() => {
  if (!groupSearchKeyword.value) return tagGroups.value
  
  const keyword = groupSearchKeyword.value.toLowerCase()
  return tagGroups.value.filter(group => 
    group.name.toLowerCase().includes(keyword) || 
    group.slug.toLowerCase().includes(keyword) ||
    (group.description && group.description.toLowerCase().includes(keyword))
  )
})

// 获取标签大小（用于标签云展示）
const getTagSize = (count) => {
  const baseSize = 14
  const maxCount = Math.max(...(statistics.value.popular_tags || []).map(tag => tag.articles_count || 0))
  
  if (maxCount <= 0) return `${baseSize}px`
  
  const size = baseSize + (count / maxCount) * 10
  return `${Math.min(24, size)}px`
}

// 加载标签数据
const loadTags = async () => {
  tagsLoading.value = true
  try {
    const params = {
      page: currentPage.value,
      page_size: pageSize.value,
      with_count: true
    }
    
    // 如果选中了标签组，只加载该组的标签
    if (activeGroupId.value) {
      params.group_id = activeGroupId.value
    }
    
    const response = await tagApi.getTags(params)
    tagData.value = response.data.results || response.data
    totalTagsCount.value = response.data.count || tagData.value.length
    
    // 加载统计数据
    await loadStatistics()
  } catch (error) {
    console.error('获取标签数据失败:', error)
    ElMessage.error('获取标签数据失败')
  } finally {
    tagsLoading.value = false
  }
}

// 加载标签组数据
const loadTagGroups = async () => {
  groupsLoading.value = true
  try {
    const response = await tagApi.getTagGroups({ with_count: true })
    tagGroups.value = response.data.results || response.data
  } catch (error) {
    console.error('获取标签组数据失败:', error)
    ElMessage.error('获取标签组数据失败')
  } finally {
    groupsLoading.value = false
  }
}

// 加载统计数据
const loadStatistics = async () => {
  try {
    // 获取所有标签以计算统计数据
    const response = await tagApi.getTags({ with_statistics: true })
    const allTags = response.data.results || response.data
    
    // 排序找出最多文章的标签
    allTags.sort((a, b) => (b.articles_count || 0) - (a.articles_count || 0))
    const popularTags = allTags.slice(0, 20) // 取前20个作为热门标签
    
    statistics.value = {
      total_count: response.data.count || allTags.length,
      groups_count: tagGroups.value.length,
      active_count: allTags.filter(tag => tag.is_active).length,
      most_articles_tag: allTags[0],
      popular_tags: popularTags
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败')
  }
}

// 处理标签组选择
const handleGroupSelect = (groupId) => {
  activeGroupId.value = groupId === '' ? null : Number(groupId)
  
  // 获取选中的标签组
  if (activeGroupId.value) {
    activeGroup.value = tagGroups.value.find(group => group.id === activeGroupId.value)
  } else {
    activeGroup.value = null
  }
  
  // 重置页码并重新加载标签
  currentPage.value = 1
  loadTags()
}

// 处理创建标签
const handleCreate = () => {
  resetTagForm()
  formType.value = 'create'
  
  // 如果当前有选中的标签组，将新标签默认分配到该组
  if (activeGroupId.value) {
    tagForm.group_id = activeGroupId.value
  }
  
  tagDialogVisible.value = true
}

// 处理创建标签组
const handleCreateGroup = () => {
  resetGroupForm()
  groupFormType.value = 'create'
  groupDialogVisible.value = true
}

// 处理编辑标签
const handleEdit = (row) => {
  resetTagForm()
  formType.value = 'edit'
  
  Object.keys(tagForm).forEach(key => {
    if (key === 'group_id' && row.group) {
      tagForm.group_id = row.group.id
    } else if (key in row) {
      tagForm[key] = row[key]
    }
  })
  
  tagDialogVisible.value = true
}

// 处理编辑标签组
const handleEditGroup = (group) => {
  resetGroupForm()
  groupFormType.value = 'edit'
  
  Object.keys(groupForm).forEach(key => {
    if (key in group) {
      groupForm[key] = group[key]
    }
  })
  
  groupDialogVisible.value = true
}

// 处理删除标签
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除标签 "${row.name}" 吗？${row.articles_count > 0 ? `该标签下有 ${row.articles_count} 篇文章，删除后文章将失去此标签。` : ''}`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await tagApi.deleteTag(row.id)
    ElMessage.success('标签删除成功')
    await loadTags()
    
    // 如果该标签属于当前选中的标签组，重新加载标签组以更新计数
    if (activeGroupId.value && row.group && row.group.id === activeGroupId.value) {
      await loadTagGroups()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除标签失败:', error)
      ElMessage.error('删除标签失败')
    }
  }
}

// 处理删除标签组
const handleDeleteGroup = async (group) => {
  // 检查标签组下是否有标签
  if (group.tags_count > 0) {
    ElMessage.warning(`标签组 "${group.name}" 下有 ${group.tags_count} 个标签，请先移除或删除这些标签`)
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除标签组 "${group.name}" 吗？`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await tagApi.deleteTagGroup(group.id)
    ElMessage.success('标签组删除成功')
    
    // 如果删除的是当前选中的标签组，清除选择
    if (activeGroupId.value === group.id) {
      activeGroupId.value = null
      activeGroup.value = null
      await loadTags()
    }
    
    await loadTagGroups()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除标签组失败:', error)
      ElMessage.error('删除标签组失败')
    }
  }
}

// 切换标签状态
const toggleStatus = async (row) => {
  try {
    await tagApi.patchTag(row.id, { is_active: !row.is_active })
    ElMessage.success(`标签已${row.is_active ? '禁用' : '启用'}`)
    
    // 更新本地数据状态
    row.is_active = !row.is_active
    
    // 更新统计数据
    await loadStatistics()
  } catch (error) {
    console.error('更新标签状态失败:', error)
    ElMessage.error('更新标签状态失败')
  }
}

// 提交标签表单
const submitTagForm = async () => {
  if (!tagFormRef.value) return
  
  await tagFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      if (formType.value === 'create') {
        await tagApi.createTag(tagForm)
        ElMessage.success('标签创建成功')
      } else {
        const { id, ...updateData } = tagForm
        await tagApi.updateTag(id, updateData)
        ElMessage.success('标签更新成功')
      }
      
      tagDialogVisible.value = false
      await loadTags()
      await loadTagGroups()
    } catch (error) {
      console.error('保存标签失败:', error)
      ElMessage.error('保存标签失败')
    } finally {
      submitLoading.value = false
    }
  })
}

// 提交标签组表单
const submitGroupForm = async () => {
  if (!groupFormRef.value) return
  
  await groupFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    groupSubmitLoading.value = true
    try {
      if (groupFormType.value === 'create') {
        await tagApi.createTagGroup(groupForm)
        ElMessage.success('标签组创建成功')
      } else {
        const { id, ...updateData } = groupForm
        await tagApi.updateTagGroup(id, updateData)
        ElMessage.success('标签组更新成功')
      }
      
      groupDialogVisible.value = false
      await loadTagGroups()
    } catch (error) {
      console.error('保存标签组失败:', error)
      ElMessage.error('保存标签组失败')
    } finally {
      groupSubmitLoading.value = false
    }
  })
}

// 处理批量删除
const handleBatchDelete = async () => {
  if (selectedTags.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedTags.value.length} 个标签吗？`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 逐个删除标签
    const promises = selectedTags.value.map(tag => tagApi.deleteTag(tag.id))
    await Promise.all(promises)
    
    ElMessage.success(`成功删除 ${selectedTags.value.length} 个标签`)
    showBatchActions.value = false
    selectedTags.value = []
    
    // 重新加载数据
    await loadTags()
    await loadTagGroups()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除标签失败:', error)
      ElMessage.error('批量删除标签失败')
    }
  }
}

// 处理批量移动
const handleBatchMove = () => {
  if (selectedTags.value.length === 0) return
  
  targetGroupId.value = null
  batchMoveDialogVisible.value = true
}

// 确认批量移动
const confirmBatchMove = async () => {
  if (selectedTags.value.length === 0) return
  
  batchMoveLoading.value = true
  try {
    // 逐个更新标签的组
    const promises = selectedTags.value.map(tag => 
      tagApi.patchTag(tag.id, { group_id: targetGroupId.value })
    )
    await Promise.all(promises)
    
    ElMessage.success(`成功将 ${selectedTags.value.length} 个标签移动到${targetGroupId.value ? '新' : '无'}标签组`)
    batchMoveDialogVisible.value = false
    showBatchActions.value = false
    selectedTags.value = []
    
    // 重新加载数据
    await loadTags()
    await loadTagGroups()
  } catch (error) {
    console.error('批量移动标签失败:', error)
    ElMessage.error('批量移动标签失败')
  } finally {
    batchMoveLoading.value = false
  }
}

// 处理表格选择变化
const handleSelectionChange = (selection) => {
  selectedTags.value = selection
}

// 分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  loadTags()
}

// 页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  loadTags()
}

// 重置标签表单
const resetTagForm = () => {
  if (tagFormRef.value) {
    tagFormRef.value.resetFields()
  }
  
  Object.assign(tagForm, {
    id: null,
    name: '',
    slug: '',
    description: '',
    group_id: null,
    color: '',
    is_active: true,
    is_featured: false
  })
}

// 重置标签组表单
const resetGroupForm = () => {
  if (groupFormRef.value) {
    groupFormRef.value.resetFields()
  }
  
  Object.assign(groupForm, {
    id: null,
    name: '',
    slug: '',
    description: '',
    is_active: true
  })
}

// 生命周期钩子
onMounted(() => {
  // 加载标签和标签组数据
  loadTagGroups()
  loadTags()
})
</script>

<style scoped>
.tag-list-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-weight: bold;
  font-size: 16px;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.tag-group-card {
  height: 100%;
}

.tag-group-menu {
  border-right: none;
}

.tag-list-card {
  margin-bottom: 20px;
}

.tag-list-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.batch-actions {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.selected-count {
  color: #606266;
  font-size: 14px;
}

.tag-table-container {
  margin-bottom: 20px;
}

.tag-name-cell {
  display: flex;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.mt-4 {
  margin-top: 16px;
}

.mb-3 {
  margin-bottom: 12px;
}

.mr-2 {
  margin-right: 8px;
}

.ml-auto {
  margin-left: auto;
}

.ml-2 {
  margin-left: 8px;
}

.w-full {
  width: 100%;
}

.statistics-card {
  margin-bottom: 20px;
}

.statistic-item {
  text-align: center;
  padding: 20px 0;
}

.statistic-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.statistic-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
}

.statistic-subtitle {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.popular-tags {
  margin-top: 15px;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-item {
  cursor: pointer;
  transition: all 0.3s;
}

.tag-item:hover {
  transform: scale(1.05);
}
</style> 