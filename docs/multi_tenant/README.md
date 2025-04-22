# 多租户系统 API 文档总览

## 文档说明

本目录包含多租户系统的API文档，供前端开发人员集成和使用。文档详细描述了系统中所有可用的API接口、参数、响应格式以及测试示例。

## 文档索引

### 1. [API 接口文档](api_documentation.md)

详细描述系统中所有可用的API接口，包括认证API、用户管理API和租户管理API。每个接口文档包含URL、HTTP方法、请求参数、响应格式和权限要求等信息。

### 2. [API 错误码文档](api_error_codes.md)

列出系统中所有可能出现的错误码及其含义，帮助开发人员更好地处理异常情况。文档包含各种HTTP状态码的解释、常见错误信息以及错误处理的最佳实践。

### 3. [API 测试示例](api_testing_examples.md)

提供API接口的测试示例，包括使用Postman和Curl等工具的请求示例和预期响应。文档还包含测试自动化和测试顺序的建议，帮助开发人员更高效地测试API。

## 系统概述

多租户系统是一个基于Django和Django REST Framework开发的企业级应用，采用RESTful API设计风格，并使用JWT进行身份验证。系统支持多租户架构，每个租户拥有独立的用户、配额和数据。

### 主要功能

- **用户管理**: 注册、登录、用户信息管理
- **租户管理**: 创建租户、管理租户配额、租户用户管理
- **权限控制**: 超级管理员、租户管理员和普通用户的权限区分

### 技术栈

- **后端**: Django + Django REST Framework
- **认证**: JWT (JSON Web Token)
- **数据库**: PostgreSQL

## 环境信息

- **开发环境**: `https://dev-api.example.com/api/v1/`
- **测试环境**: `https://test-api.example.com/api/v1/`
- **生产环境**: `https://api.example.com/api/v1/`

## 快速入门

要开始使用API，请按照以下步骤操作：

1. 查看[API接口文档](api_documentation.md)了解可用的API
2. 注册用户账号并获取访问令牌
3. 使用令牌访问API资源
4. 参考[API测试示例](api_testing_examples.md)进行集成测试

## 联系方式

如有任何问题或建议，请联系：

- **技术支持**: support@example.com
- **文档维护**: docs@example.com

## 更新日志

- **2023-07-15**: 初始版本
- **2023-07-20**: 添加租户管理API文档
- **2023-07-25**: 更新错误码文档
- **2023-08-01**: 添加API测试示例 