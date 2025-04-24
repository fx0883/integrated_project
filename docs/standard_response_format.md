# 全局标准响应格式实现说明

## 需求背景

项目需要一个全局的响应格式统一中间件或渲染器，确保所有API返回统一格式的JSON响应：

```json
{
  "success": true/false,
  "code": 2000,
  "message": "操作成功/失败信息",
  "data": { ... }
}
```

## 实现方案

我们采用了自定义 Django REST Framework 渲染器的方式，确保所有API响应都符合标准格式。

### 主要实现组件

1. **自定义JSON渲染器** (`common/renderers.py`)
   - 继承 DRF 的 `JSONRenderer`
   - 对所有响应进行标准格式包装
   - 智能处理不同类型的响应（成功/错误/分页等）

2. **配置默认渲染器** (`core/settings.py`)
   - 在 `REST_FRAMEWORK` 配置中设置 `DEFAULT_RENDERER_CLASSES`
   - 将自定义渲染器设为第一优先级

3. **优化分页响应** (`common/pagination/__init__.py`) 
   - 确保分页响应格式与标准格式兼容

4. **测试视图** (`common/views.py` 和 `common/urls.py`)
   - 提供多个测试接口，验证不同情况下的响应格式

## 状态码映射

| HTTP状态码 | 业务状态码 | 说明 |
|------------|------------|------|
| 2xx        | 2000       | 操作成功 |
| 400        | 4000       | 请求参数错误 |
| 401        | 4001       | 认证失败 |
| 403        | 4003       | 权限不足 |
| 404        | 4004       | 资源不存在 |
| 5xx        | 5000       | 服务器错误 |

## 测试接口

以下测试接口可用于验证标准响应格式渲染器的功能：

- `/api/v1/common/test-format/`: 测试成功响应格式
- `/api/v1/common/test-error/`: 测试错误响应格式
- `/api/v1/common/test-auth-error/`: 测试认证失败响应格式
- `/api/v1/common/test-pagination/`: 测试分页响应格式

## 使用方法

对于开发人员来说，无需做任何特殊处理。只需正常使用 Django REST Framework 的 `Response` 类返回数据，渲染器会自动将响应包装为标准格式。

### 示例

```python
# 普通视图方法
def my_view(request):
    data = {'item': 'value'}
    return Response(data)  # 会被自动包装为标准格式
```

## 异常处理

项目已有的异常处理器 (`common/exceptions/__init__.py`) 与标准响应格式兼容，无需额外修改。异常响应也会被自动包装为标准格式。

## 注意事项

1. API响应中已包含 `success`, `code`, `message`, `data` 全部字段的不会被重复包装
2. 渲染器会保留原有的分页格式，将其放入标准的 `data` 字段中
3. 默认保留了 `BrowsableAPIRenderer`，便于在浏览器中查看 API
4. 生产环境中可能需要去除 `BrowsableAPIRenderer` 以提高安全性

## 文档和说明

详细的实现说明和使用示例可在 `common/README_RENDERER.md` 中找到。 