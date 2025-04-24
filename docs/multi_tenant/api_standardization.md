# API 响应标准化文档

## 概述

本文档详细介绍多租户系统的 API 响应标准化实现，包括标准响应格式的定义、标准化中间件的工作原理、实现细节以及如何处理特殊情况。在我们的系统中，所有 API 响应都遵循统一的格式，确保前端处理逻辑的一致性。

## 标准响应格式

所有 API 响应均采用以下标准格式：

```json
{
  "success": true|false,  // 布尔值，表示请求是否成功
  "code": 2000,           // 业务状态码，用于表示具体的业务状态
  "message": "操作结果描述", // 操作结果的文本描述
  "data": {               // 实际返回的数据
    // 数据内容...
  }
}
```

### 业务状态码定义

系统使用三层业务状态码：

| 状态码范围 | 含义 |
|---------|------|
| 2000-2999 | 成功响应 |
| 4000-4999 | 客户端错误 |
| 5000-5999 | 服务器错误 |

常用业务状态码：

- `2000`: 操作成功
- `4000`: 请求参数错误
- `4001`: 认证失败
- `4003`: 权限不足
- `4004`: 资源不存在
- `5000`: 服务器内部错误

完整的业务状态码列表请参考 [API 错误码文档](api_error_codes.md)。

## 标准化实现原理

API 响应标准化通过以下几个组件协同工作实现：

### 1. 标准化 JSON 渲染器

`StandardJSONRenderer` 类继承自 DRF 的 `JSONRenderer`，负责将 API 视图返回的数据格式化为标准响应格式。

```python
class StandardJSONRenderer(JSONRenderer):
    """
    统一响应格式的JSON渲染器
    """
    
    def render(self, data, accepted_media_type=None, renderer_context=None):
        # 构造标准响应格式
        standard_response = {
            'success': is_success(status_code),
            'code': self._get_business_code(status_code, data),
            'message': self._get_message(status_code, data),
            'data': self._get_response_data(data, status_code)
        }
        
        return super().render(standard_response, accepted_media_type, renderer_context)
```

### 2. 响应标准化中间件

`ResponseStandardizationMiddleware` 中间件确保所有 API 响应都遵循标准格式，即使视图直接返回了非标准格式的响应。

```python
class ResponseStandardizationMiddleware:
    """
    统一响应格式中间件
    """
    
    def process_response(self, request, response):
        if not self._should_process(request, response):
            return response
            
        # 获取原始响应数据并转换为标准格式
        standard_data = {
            'success': is_successful,
            'code': self._get_business_code(response.status_code),
            'message': message,
            'data': data
        }
        
        # 创建新的响应或更新现有响应
        return new_response_with_standard_format
```

### 3. 自定义异常处理器

`custom_exception_handler` 函数处理系统中的异常，确保错误响应也遵循标准格式。

```python
def custom_exception_handler(exc, context):
    """
    自定义异常处理器
    """
    response = exception_handler(exc, context)
    
    if response is not None:
        # 自定义格式化错误响应
        data = {
            'success': False,
            'code': error_code,
            'message': error_message,
            'data': None
        }
        
        response.data = data
    
    return response
```

## 特殊情况处理

### 分页响应

分页响应的 `data` 字段包含分页信息和结果列表：

```json
{
  "success": true,
  "code": 2000,
  "message": "获取成功",
  "data": {
    "count": 100,
    "next": "http://example.com/api/v1/users/?page=2",
    "previous": null,
    "results": [
      // 数据条目...
    ]
  }
}
```

### 文件上传/下载响应

对于文件上传成功的响应：

```json
{
  "success": true,
  "code": 2000,
  "message": "上传成功",
  "data": {
    "file_id": "12345",
    "file_name": "document.pdf",
    "file_url": "http://example.com/media/documents/document.pdf",
    "file_size": 1024000
  }
}
```

文件下载响应通常直接返回文件流，不使用标准 JSON 格式。

### 批量操作响应

批量操作响应会在 `data` 字段中包含详细的操作结果：

```json
{
  "success": true,
  "code": 2000,
  "message": "批量操作已完成",
  "data": {
    "total": 5,
    "success_count": 3,
    "failure_count": 2,
    "results": [
      {"id": 1, "status": "success"},
      {"id": 2, "status": "success"},
      {"id": 3, "status": "success"},
      {"id": 4, "status": "failed", "reason": "资源不存在"},
      {"id": 5, "status": "failed", "reason": "权限不足"}
    ]
  }
}
```

## 前端处理指南

### 基本使用

前端处理标准响应的通用模式：

```javascript
// 使用 axios 发送请求
axios.get('/api/v1/users/')
  .then(response => {
    const { success, code, message, data } = response.data;
    
    if (success) {
      // 处理成功响应
      console.log('获取成功:', data);
      // 更新UI...
    } else {
      // 处理业务错误
      console.error(`错误(${code}): ${message}`);
      // 显示错误...
    }
  })
  .catch(error => {
    // 处理网络错误或未捕获的服务器错误
    console.error('请求失败:', error);
  });
```

### 错误处理

根据业务状态码处理不同类型的错误：

```javascript
function handleApiError(code, message) {
  switch (code) {
    case 4001:
      // 认证错误，重定向到登录页
      router.push('/login');
      break;
    case 4003:
      // 权限错误
      notification.error({ title: '权限不足', message: message });
      break;
    case 4004:
      // 资源不存在
      notification.warning({ title: '资源不存在', message: message });
      break;
    default:
      // 其他错误
      notification.error({ title: '操作失败', message: message });
  }
}
```

### 请求拦截器

使用 Axios 请求拦截器统一处理标准响应：

```javascript
// 响应拦截器
axios.interceptors.response.use(
  response => {
    const { success, code, message, data } = response.data;
    
    // 如果是成功响应，直接返回数据部分
    if (success) {
      return data;
    }
    
    // 对于业务错误，转换为 rejected promise
    return Promise.reject({ code, message });
  },
  error => {
    // 处理网络错误
    if (!error.response) {
      return Promise.reject({ code: 5000, message: '网络连接失败' });
    }
    
    // 提取服务器返回的错误信息
    const { success, code, message } = error.response.data || {};
    return Promise.reject({ code: code || error.response.status, message: message || '未知错误' });
  }
);
```

## 最佳实践

### API 开发指南

1. **使用标准 DRF 视图**：尽量使用 GenericAPIView、ViewSet 等 DRF 提供的视图类，它们会自动应用渲染器。

2. **避免自定义响应格式**：不要在视图中直接返回自定义格式的响应，让中间件负责格式化。

   ```python
   # 推荐
   return Response(serializer.data)
   
   # 不推荐
   return Response({
       'success': True,
       'code': 2000,
       'message': '操作成功',
       'data': serializer.data
   })
   ```

3. **使用异常类表达错误**：抛出适当的异常，而不是返回自定义错误响应。

   ```python
   # 推荐
   raise NotFound("资源不存在")
   
   # 不推荐
   return Response({
       'success': False,
       'code': 4004,
       'message': '资源不存在',
       'data': None
   }, status=404)
   ```

### 前端开发指南

1. **统一处理中心**：创建统一的 API 客户端，封装标准响应处理逻辑。

2. **类型定义**：如果使用 TypeScript，定义标准响应的类型：

   ```typescript
   interface StandardResponse<T> {
     success: boolean;
     code: number;
     message: string;
     data: T;
   }
   
   // 使用泛型处理不同数据类型
   function handleResponse<T>(response: StandardResponse<T>): T {
     if (!response.success) {
       throw new ApiError(response.code, response.message);
     }
     return response.data;
   }
   ```

3. **错误界面**：根据不同业务状态码设计相应的错误界面和提示信息。

## 测试指南

测试标准响应格式的关键点：

1. 测试各种状态码是否正确转换为标准格式
2. 测试异常处理是否生成正确的标准错误响应
3. 测试特殊情况（如分页、文件上传等）是否遵循标准格式
4. 测试前端能否正确解析和处理标准响应

## 常见问题

### Q: 如何在响应中添加自定义字段？

A: 标准响应格式的设计考虑了可扩展性。对于需要添加的自定义字段，建议将其放在 `data` 字段内：

```json
{
  "success": true,
  "code": 2000,
  "message": "操作成功",
  "data": {
    "user": { ... },
    "meta": {
      "custom_field_1": "value1",
      "custom_field_2": "value2"
    }
  }
}
```

### Q: 如何处理大型数据集的分页？

A: 大型数据集的分页响应仍然遵循标准格式，但可能需要额外的分页参数：

```json
{
  "success": true,
  "code": 2000,
  "message": "获取成功",
  "data": {
    "count": 10000,
    "page_size": 50,
    "current_page": 1,
    "total_pages": 200,
    "next": "http://example.com/api/v1/items/?page=2",
    "previous": null,
    "results": [ ... ]
  }
}
```

### Q: 非 JSON 响应如何处理？

A: 对于文件下载等非 JSON 响应，中间件会跳过处理，保持原始响应格式。开发人员需要在前端做相应的特殊处理。
