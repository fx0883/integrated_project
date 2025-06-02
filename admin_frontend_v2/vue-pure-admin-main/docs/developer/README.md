# 开发者文档

## 简介

本文档面向系统开发人员和技术维护人员，详细介绍了集成管理系统的技术架构、开发规范和扩展指南。通过本文档，您将了解如何进行二次开发、功能扩展和系统维护。

## 目录

1. [技术架构](#技术架构)
2. [开发环境](#开发环境)
3. [项目结构](#项目结构)
4. [开发指南](#开发指南)
5. [API开发规范](#api开发规范)
6. [前端开发规范](#前端开发规范)
7. [性能优化](#性能优化)
8. [测试指南](#测试指南)
9. [部署指南](#部署指南)
10. [常见问题](#常见问题)

## 技术架构

### 前端技术栈

- **框架**: Vue 3
- **状态管理**: Pinia
- **UI组件**: Element Plus
- **图表库**: ECharts
- **网络请求**: Axios
- **路由**: Vue Router
- **构建工具**: Vite
- **语言**: TypeScript

### 后端技术栈

- **框架**: Node.js / Express 或 Django REST Framework
- **数据库**: MySQL / PostgreSQL
- **ORM**: Sequelize / Typeorm 或 Django ORM
- **缓存**: Redis
- **任务队列**: Bull
- **认证**: JWT

## 开发环境

### 系统需求

- Node.js 16.x+
- npm 8.x+
- Git
- 现代浏览器 (Chrome, Firefox, Edge等)

### 环境搭建

#### 前端开发环境

1. 克隆代码库：

```bash
git clone https://github.com/your-organization/integrated-admin-frontend.git
cd integrated-admin-frontend
```

2. 安装依赖：

```bash
npm install
```

3. 启动开发服务器：

```bash
npm run dev
```

4. 进行构建：

```bash
npm run build
```

#### 后端开发环境

1. 克隆代码库：

```bash
git clone https://github.com/your-organization/integrated-admin-backend.git
cd integrated-admin-backend
```

2. 安装依赖：

```bash
npm install
# 或
pip install -r requirements.txt
```

3. 配置环境变量：复制`.env.example`为`.env`并填写必要的配置

4. 启动开发服务器：

```bash
npm run dev
# 或
python manage.py runserver
```

## 项目结构

### 前端项目结构

```
src/
├── api/                # API接口定义
├── assets/             # 静态资源
├── components/         # 公共组件
├── directives/         # 自定义指令
├── layout/             # 页面布局组件
├── router/             # 路由配置
├── store/              # 状态管理
├── styles/             # 样式文件
├── utils/              # 工具函数
├── views/              # 页面视图
├── App.vue             # 根组件
└── main.ts             # 入口文件
```

### 关键目录说明

- **api/**: 按模块组织的API接口定义
  - `user.ts`: 用户相关接口
  - `tenant.ts`: 租户相关接口
  - `cms/`: CMS模块接口
  - `check/`: 打卡模块接口
  
- **components/**: 可复用的通用组件
  - `ReTenantSelector/`: 租户选择器组件
  - `ReEditor/`: 富文本编辑器组件
  - `ReImageUploader/`: 图片上传组件
  
- **store/**: 按模块组织的状态管理
  - `modules/user.ts`: 用户状态管理
  - `modules/permission.ts`: 权限状态管理
  - `modules/cms/`: CMS模块状态管理
  - `modules/check/`: 打卡模块状态管理
  
- **views/**: 按功能模块组织的页面视图
  - `dashboard/`: 仪表盘相关页面
  - `user/`: 用户管理页面
  - `tenant/`: 租户管理页面
  - `cms/`: CMS模块页面
  - `check/`: 打卡模块页面

## 开发指南

### 添加新页面

1. 在`src/views/`中创建新的页面组件
2. 在`src/router/modules/`中添加路由配置
3. 如需添加菜单项，在路由配置中添加相应的meta信息

示例：

```typescript
// src/router/modules/example.ts
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/example",
  name: "Example",
  component: Layout,
  meta: {
    title: "示例模块",
    icon: "example-icon",
    rank: 100
  },
  children: [
    {
      path: "/example/list",
      name: "ExampleList",
      component: () => import("@/views/example/list.vue"),
      meta: {
        title: "示例列表",
        icon: "list-icon"
      }
    }
  ]
};
```

### 添加新API接口

1. 在`src/api/`中创建或修改相应模块的API文件
2. 定义接口调用函数
3. 在需要的组件或状态管理中导入并使用

示例：

```typescript
// src/api/example.ts
import { http } from "@/utils/http";
import { ApiResult } from "/#/user";

export interface ExampleItem {
  id: number;
  name: string;
  description: string;
}

export const getExampleList = (params?: any) => {
  return http.request<ApiResult<ExampleItem[]>>("get", "/api/examples", { params });
};

export const createExample = (data: any) => {
  return http.request<ApiResult<ExampleItem>>("post", "/api/examples", { data });
};
```

### 状态管理开发

1. 在`src/store/modules/`中创建或修改相应的状态管理文件
2. 定义状态、getter和actions
3. 在需要的组件中导入并使用

示例：

```typescript
// src/store/modules/example.ts
import { defineStore } from "pinia";
import { getExampleList, createExample } from "@/api/example";
import { message } from "@/utils/message";

interface ExampleState {
  list: any[];
  loading: boolean;
}

export const useExampleStore = defineStore("example", {
  state: (): ExampleState => ({
    list: [],
    loading: false
  }),
  
  actions: {
    async fetchList(params?: any) {
      this.loading = true;
      try {
        const res = await getExampleList(params);
        if (res && res.success) {
          this.list = res.data || [];
        }
        return res.data;
      } catch (error) {
        message("获取数据失败", { type: "error" });
        console.error(error);
        return null;
      } finally {
        this.loading = false;
      }
    },
    
    async createItem(data: any) {
      try {
        const res = await createExample(data);
        if (res && res.success) {
          message("创建成功", { type: "success" });
          return res.data;
        }
        return null;
      } catch (error) {
        message("创建失败", { type: "error" });
        console.error(error);
        return null;
      }
    }
  }
});
```

## API开发规范

### API响应格式

所有API应返回统一的响应格式：

```json
{
  "success": true,       // 请求是否成功
  "code": 200,           // 状态码
  "message": "Success",  // 状态描述
  "data": {}             // 返回数据
}
```

### API请求处理

所有API请求应该使用`@/utils/http`中封装的方法，确保统一的错误处理和响应格式化：

```typescript
import { http } from "@/utils/http";
import { formatResponse } from "@/utils/http/response";

export const exampleApi = async (params) => {
  try {
    const response = await http.request("get", "/api/example", { params });
    return formatResponse(response);
  } catch (error) {
    // 错误处理...
    return {
      success: false,
      code: 500,
      message: "请求失败",
      data: null
    };
  }
};
```

### 数据缓存策略

为减少不必要的API请求，可以使用`@/utils/cache.ts`中的缓存工具：

```typescript
import { cacheApiResult } from "@/utils/cache";

// 使用缓存API
const data = await cacheApiResult(
  () => getExampleList(params),
  "example:list",  // 缓存键
  5 * 60 * 1000    // 缓存5分钟
);
```

## 前端开发规范

### 命名规范

- **文件命名**：使用kebab-case（小写连字符），如`user-list.vue`
- **组件命名**：使用PascalCase（大驼峰），如`UserList.vue`
- **变量命名**：使用camelCase（小驼峰），如`userList`
- **常量命名**：使用大写下划线，如`MAX_COUNT`

### 组件开发规范

- 每个组件应该有明确的职责，避免过于复杂
- 使用组合式API (`<script setup>`) 开发组件
- 复杂组件应该拆分为小组件
- 公共组件应放在`components`目录中

示例：

```vue
<template>
  <div class="example-component">
    <h1>{{ title }}</h1>
    <ul>
      <li v-for="item in items" :key="item.id">{{ item.name }}</li>
    </ul>
    <el-button @click="handleClick">{{ buttonText }}</el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useExampleStore } from "@/store/modules/example";

// 定义组件props
const props = defineProps({
  title: {
    type: String,
    default: "示例组件"
  },
  buttonText: {
    type: String,
    default: "点击我"
  }
});

// 定义组件事件
const emit = defineEmits(["click"]);

// 状态管理
const exampleStore = useExampleStore();
const items = ref([]);

// 计算属性
const itemCount = computed(() => items.value.length);

// 方法
const handleClick = () => {
  emit("click", itemCount.value);
};

// 生命周期
onMounted(async () => {
  const data = await exampleStore.fetchList();
  if (data) {
    items.value = data;
  }
});
</script>

<style scoped>
.example-component {
  padding: 20px;
}
</style>
```

### CSS样式规范

- 使用scoped样式隔离组件样式
- 复用全局样式变量和混合
- 避免使用!important
- 使用BEM命名方法组织CSS

## 性能优化

### 路由懒加载

使用动态导入进行路由懒加载：

```typescript
// 正确的懒加载方式
component: () => import("@/views/example/list.vue")
```

### 组件懒加载

对于不需要立即显示的组件，可以使用Vue的动态组件：

```vue
<template>
  <component :is="dynamicComponent" v-if="showComponent" />
  <button @click="loadComponent">加载组件</button>
</template>

<script setup>
import { ref, shallowRef } from 'vue';

const dynamicComponent = shallowRef(null);
const showComponent = ref(false);

const loadComponent = async () => {
  dynamicComponent.value = (await import('./HeavyComponent.vue')).default;
  showComponent.value = true;
};
</script>
```

### 数据缓存策略

使用`@/utils/cache.ts`中的缓存工具减少重复API请求：

```typescript
import { useApiWithCache } from "@/utils/cache";

// 在组件中使用
const { data, loading, error, fetchData } = useApiWithCache(
  () => getExampleData(),
  "example:data",
  10 * 60 * 1000  // 缓存10分钟
);

// 强制刷新数据
fetchData(true);
```

### 图片懒加载

使用`v-lazy-load`指令实现图片懒加载：

```vue
<template>
  <img v-lazy-load="imageUrl" alt="Lazy loaded image" />
</template>

<script setup>
const imageUrl = 'https://example.com/large-image.jpg';
</script>
```

## 测试指南

### 单元测试

项目使用Jest和Vue Test Utils进行单元测试：

```bash
# 运行所有测试
npm run test

# 运行特定测试文件
npm run test -- src/components/example.spec.ts
```

### 编写测试用例

```typescript
// src/components/__tests__/ExampleComponent.spec.ts
import { mount } from '@vue/test-utils';
import ExampleComponent from '../ExampleComponent.vue';

describe('ExampleComponent', () => {
  test('renders the component', () => {
    const wrapper = mount(ExampleComponent, {
      props: {
        title: 'Test Title'
      }
    });
    
    expect(wrapper.text()).toContain('Test Title');
  });
  
  test('emits click event', async () => {
    const wrapper = mount(ExampleComponent);
    
    await wrapper.find('button').trigger('click');
    
    expect(wrapper.emitted().click).toBeTruthy();
  });
});
```

## 部署指南

### 构建生产版本

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 部署配置

部署前请确保正确配置以下文件：

- `.env.production`: 生产环境配置
- `vite.config.ts`: Vite构建配置

### Docker部署

项目支持Docker部署，可使用以下命令：

```bash
# 构建Docker镜像
docker build -t integrated-admin-frontend .

# 运行容器
docker run -d -p 80:80 --name admin-frontend integrated-admin-frontend
```

## 常见问题

### 开发中的类型错误

如果遇到TypeScript类型错误，请检查：

1. 是否正确定义了接口或类型
2. 是否正确导入了类型定义
3. 是否使用了正确的泛型参数

### API请求失败

如果API请求失败，请检查：

1. API地址是否正确
2. 请求参数是否符合要求
3. 认证Token是否有效或过期
4. 网络连接是否正常

### 性能问题

如果遇到性能问题，考虑：

1. 使用组件懒加载
2. 实现数据缓存
3. 优化大型列表渲染
4. 减少不必要的计算和渲染

---

如有其他技术问题或建议，请联系技术团队或提交Issue到代码仓库。 