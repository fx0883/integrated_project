# CMS系统概述

## 1. 系统简介

CMS（内容管理系统）是一个基于Django和Django REST Framework构建的多租户内容管理平台。系统支持文章、分类、标签和评论等核心功能，并提供完整的API接口供前端应用调用。

## 2. 核心功能

- **文章管理**：创建、编辑、发布、归档文章，支持版本控制
- **分类管理**：树形结构的文章分类系统
- **标签管理**：文章标签和标签组管理
- **评论系统**：支持嵌套评论和评论审核
- **统计分析**：文章阅读量、点赞数等统计数据
- **多租户支持**：完整的多租户数据隔离

## 3. 技术架构

- **后端框架**：Django + Django REST Framework
- **数据库**：PostgreSQL
- **认证机制**：基于JWT的身份认证
- **API文档**：drf-spectacular自动生成的OpenAPI文档
- **权限控制**：基于角色的细粒度权限系统

## 4. 权限控制机制

CMS系统采用了特殊的权限控制机制，主要规则如下：

### 查询操作（GET请求）
- 不需要token认证，允许匿名访问
- 需要在请求头中包含`X-Tenant-ID`参数来指定租户
- 如果有token，则通过token获取租户ID
- 如果没有token，则检查`X-Tenant-ID`是否存在，存在则继续，不存在则报错

### 修改操作（POST、PUT、PATCH、DELETE等）
- 需要token认证
- 通过token获取用户关联的租户ID
- 如果用户没有关联租户ID，则报错
- 超级管理员因无关联租户ID，不能操作CMS数据

## 5. 用户角色

系统支持以下用户角色：

- **超级管理员**：系统级别管理员，管理所有租户
- **租户管理员**：管理单个租户的所有内容
- **内容编辑**：管理自己创建的内容
- **普通用户**：可以查看内容、发表评论
- **匿名用户**：只能查看公开内容

## 6. 多租户支持

每个租户在系统中都有独立的数据隔离：

- 所有模型都包含`tenant`外键字段
- 查询自动根据当前租户进行过滤
- 创建数据时自动关联当前租户

## 7. API接口概览

系统提供完整的RESTful API：

- `/api/cms/articles/` - 文章管理
- `/api/cms/categories/` - 分类管理
- `/api/cms/tags/` - 标签管理
- `/api/cms/comments/` - 评论管理

详细API文档请参考API接口指南。

## 8. 前端集成

CMS系统设计为无头CMS（Headless CMS），通过API与前端应用集成：

- 前端应用需要在请求头中包含`X-Tenant-ID`
- 匿名访问的页面只能查看公开内容
- 需要认证的操作必须提供有效的JWT令牌

## 9. 系统限制

- 超级管理员不能直接操作CMS数据，需要先关联到特定租户
- 用户必须关联租户才能进行内容创建和编辑
- 匿名访问必须提供有效的租户ID

## 数据模型设计

### 核心模型

1. **文章(Article)**：内容管理的核心实体，包含标题、内容、摘要、状态等
2. **分类(Category)**：支持层级结构的文章分类
3. **标签组(TagGroup)**：标签的分组管理
4. **标签(Tag)**：文章标签
5. **评论(Comment)**：支持层级评论结构
6. **文章元数据(ArticleMeta)**：SEO相关元数据
7. **文章统计(ArticleStatistics)**：阅读、点赞等统计
8. **文章版本(ArticleVersion)**：文章版本历史记录
9. **用户互动(Interaction)**：点赞、收藏等用户互动行为
10. **用户等级(UserLevel)**：用户权限等级管理
11. **访问日志(AccessLog)**：文章访问日志
12. **操作日志(OperationLog)**：系统操作日志

### 关系模型

- 文章-分类：多对多关系(ArticleCategory)
- 文章-标签：多对多关系(ArticleTag)
- 文章-版本：一对多关系
- 文章-评论：一对多关系
- 评论-回复：递归关系(父子评论)
- 标签组-标签：一对多关系
- 用户-等级：多对多关系(UserLevelRelation)

## API设计

CMS系统API遵循RESTful设计规范，提供了丰富的API端点用于内容的增删改查和高级管理。

### API分类

1. **文章管理API**
   - 文章CRUD操作
   - 文章状态管理(发布、归档等)
   - 文章版本管理
   - 文章统计数据查询
   
2. **分类管理API**
   - 分类CRUD操作
   - 分类树状结构查询
   
3. **标签管理API**
   - 标签和标签组CRUD操作
   - 标签使用统计查询
   
4. **评论管理API**
   - 评论CRUD操作
   - 评论审核(批准、拒绝、标记垃圾评论)
   - 回复管理
   
5. **用户互动API**
   - 点赞、收藏、分享等操作

### API特点

1. **详细的OpenAPI文档**：使用drf_spectacular生成完整的API文档，包括请求/响应示例
2. **多租户支持**：通过请求头`X-Tenant-ID`区分租户
3. **高级筛选和排序**：支持多种参数进行数据筛选和排序
4. **标准化错误处理**：统一错误响应格式
5. **权限控制**：基于用户角色和资源所有权的权限管理

## 系统架构

CMS系统遵循Django的MVT架构模式：

1. **Models**：定义数据结构和业务逻辑
2. **Views**：基于DRF的视图集(ViewSets)处理API请求
3. **Serializers**：数据序列化和反序列化
4. **Permissions**：权限控制
5. **URLs**：API路由配置

### 技术特点

1. **基于Django REST Framework**：利用DRF提供RESTful API
2. **视图集扩展**：继承TenantModelViewSet实现租户隔离
3. **丰富的文档化**：使用drf_spectacular自动生成API文档
4. **标准化分页**：使用StandardResultsSetPagination实现统一分页
5. **JWT认证**：使用JWTAuthentication确保API安全
6. **过滤和搜索**：DjangoFilterBackend, SearchFilter, OrderingFilter

## 数据流程

### 文章发布流程

1. 用户创建文章草稿
2. 编辑文章内容和元数据
3. 文章提交审核(可选)
4. 发布文章(手动或自动)
5. 创建文章版本记录
6. 更新文章统计

### 评论处理流程

1. 用户提交评论
2. 系统自动过滤或标记为需要审核
3. 管理员审核评论(可选)
4. 评论发布
5. 更新评论计数统计

## 系统整合

CMS系统与其他子系统的集成方式：

1. **用户系统**：使用共享的User模型
2. **租户系统**：通过tenant外键关联实现多租户
3. **权限系统**：与RBAC系统集成
4. **文件存储**：图片等媒体文件存储(尚未实现完整)

## 性能优化

1. **数据库索引**：关键字段都添加了适当索引
2. **查询优化**：使用select_related和prefetch_related减少数据库查询
3. **分页机制**：避免大量数据一次性加载
4. **数据缓存**：统计数据等适合缓存的内容(尚未实现)

## 未来扩展

1. **媒体库管理**：集成完整的媒体文件管理
2. **内容模板系统**：更灵活的文章模板
3. **工作流引擎**：复杂的内容审核工作流
4. **内容推荐**：基于用户行为的智能推荐
5. **全文搜索**：集成ElasticSearch等搜索引擎

## 结论

CMS系统是一个功能完善、架构合理的内容管理系统，通过模块化设计和标准化接口，提供了灵活、高效的内容管理能力。系统支持多租户隔离，实现了细粒度的权限控制，能够满足不同场景下的内容管理需求。系统架构遵循最佳实践，提供了良好的扩展性和可维护性。 

## 10. 前端集成示例

### 10.1 匿名访问示例（React）

```jsx
// 获取文章列表（匿名访问）
const fetchArticles = async (tenantId) => {
  try {
    const response = await fetch('https://api.example.com/api/cms/articles/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '获取文章失败');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取文章列表失败:', error);
    throw error;
  }
};

// 使用示例
const ArticleList = ({ tenantId }) => {
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!tenantId) {
      setError('未提供租户ID');
      return;
    }
    
    fetchArticles(tenantId)
      .then(data => setArticles(data.results))
      .catch(err => setError(err.message));
  }, [tenantId]);
  
  if (error) return <div className="error">{error}</div>;
  
  return (
    <div className="article-list">
      {articles.map(article => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
};
```

### 10.2 认证访问示例（React）

```jsx
// 创建文章（需要认证）
const createArticle = async (articleData, token) => {
  try {
    const response = await fetch('https://api.example.com/api/cms/articles/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(articleData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '创建文章失败');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('创建文章失败:', error);
    throw error;
  }
};

// 使用示例
const CreateArticleForm = ({ token, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const articleData = {
        title,
        content,
        status: 'draft'
      };
      
      const createdArticle = await createArticle(articleData, token);
      setLoading(false);
      onSuccess(createdArticle);
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <div className="form-group">
        <label>标题</label>
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          required 
        />
      </div>
      <div className="form-group">
        <label>内容</label>
        <textarea 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          required 
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? '提交中...' : '创建文章'}
      </button>
    </form>
  );
};
```

### 10.3 错误处理示例

```jsx
// 通用API请求函数
const apiRequest = async (url, method, token, tenantId, data = null) => {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // 对于GET请求，添加租户ID
  if (method === 'GET') {
    headers['X-Tenant-ID'] = tenantId;
  }
  
  // 对于非GET请求，添加认证token
  if (method !== 'GET') {
    if (!token) {
      throw new Error('需要认证才能执行此操作');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined
  };
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      
      // 处理常见错误
      if (errorData.detail) {
        if (errorData.detail.includes('未提供租户ID')) {
          throw new Error('请选择一个有效的租户');
        } else if (errorData.detail.includes('用户未关联租户')) {
          throw new Error('您的账户未关联任何租户，无法执行此操作');
        } else if (errorData.detail.includes('无法访问其他租户的资源')) {
          throw new Error('您无权访问此租户的资源');
        } else {
          throw new Error(errorData.detail);
        }
      }
      
      throw new Error('请求失败');
    }
    
    // 对于DELETE请求，可能没有返回内容
    if (method === 'DELETE') {
      return { success: true };
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API请求失败: ${url}`, error);
    throw error;
  }
};

// 使用示例
const fetchData = async () => {
  try {
    const articles = await apiRequest(
      'https://api.example.com/api/cms/articles/',
      'GET',
      null,
      currentTenantId
    );
    
    setArticles(articles.results);
  } catch (error) {
    showErrorNotification(error.message);
  }
};
``` 