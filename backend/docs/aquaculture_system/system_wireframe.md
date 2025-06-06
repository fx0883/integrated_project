# 水产养殖系统线框图

## 系统架构图

```
+-----------------------------------------------------------+
|                      多租户平台                           |
+-----------------------------------------------------------+
|                                                           |
|  +---------------------+        +---------------------+   |
|  |                     |        |                     |   |
|  |     租户管理系统     |        |      用户管理系统    |   |
|  |                     |        |                     |   |
|  +---------------------+        +---------------------+   |
|             |                            |                |
|             v                            v                |
|  +-----------------------------------------------------------+
|  |                    多租户中间件                           |
|  |   (处理租户上下文、数据隔离、权限控制、跨租户操作等)        |
|  +-----------------------------------------------------------+
|             |                            |                |
|             v                            v                |
|  +---------------------+        +---------------------+   |
|  |                     |        |                     |   |
|  |   水产养殖管理系统   | <----> |     其他业务系统     |   |
|  |                     |        |                     |   |

```
+------------------------------------------------------+
|                     租户 A 数据                       |
| +-----------+ +-----------+ +-----------+ +--------+ |
| | 池塘数据   | | 水质数据   | | 批次数据   | |  ...   | |
| +-----------+ +-----------+ +-----------+ +--------+ |
+------------------------------------------------------+

+------------------------------------------------------+
|                     租户 B 数据                       |
| +-----------+ +-----------+ +-----------+ +--------+ |
| | 池塘数据   | | 水质数据   | | 批次数据   | |  ...   | |
| +-----------+ +-----------+ +-----------+ +--------+ |
+------------------------------------------------------+

+------------------------------------------------------+
|                     租户 C 数据                       |
| +-----------+ +-----------+ +-----------+ +--------+ |
| | 池塘数据   | | 水质数据   | | 批次数据   | |  ...   | |
| +-----------+ +-----------+ +-----------+ +--------+ |
+------------------------------------------------------+
```

## 水产养殖系统模块划分

```
+-----------------------------------------------------------+
|                    水产养殖管理系统                        |
+-----------------------------------------------------------+
|                                                           |
|  +---------------------+        +---------------------+   |
|  |                     |        |                     |   |
|  |     池塘管理模块     |        |     水质监测模块     |   |
|  |                     |        |                     |   |
|  +---------------------+        +---------------------+   |
|                                                           |
|  +---------------------+        +---------------------+   |
|  |                     |        |                     |   |
|  |     批次管理模块     |        |     投喂管理模块     |   |
|  |                     |        |                     |   |
|  +---------------------+        +---------------------+   |
|                                                           |
|  +---------------------+        +---------------------+   |
|  |                     |        |                     |   |
|  |     生长监控模块     |        |     疾病防治模块     |   |
|  |                     |        |                     |   |
|  +---------------------+        +---------------------+   |
|                                                           |
|  +---------------------+        +---------------------+   |
|  |                     |        |                     |   |
|  |   库存与物资管理模块  |        |     数据分析模块     |   |
|  |  (药品、饲料、设备)  |        |                     |   |
|  +---------------------+        +---------------------+   |
|                                                           |
|  +---------------------+        +---------------------+   |
|  |                     |        |                     |   |
|  |     成本管理模块     |        |     销售管理模块     |   |
|  |                     |        |                     |   |
|  +---------------------+        +---------------------+   |
|                                                           |
|  +---------------------+        +---------------------+   |
|  |                     |        |                     |   |
|  |  角色与权限管理模块  |        |     系统设置模块     |   |
|  |                     |        |                     |   |
|  +---------------------+        +---------------------+   |
|                                                           |
|  +---------------------+                                  |
|  |                     |                                  |
|  |    操作日志模块     |                                  |
|  |                     |                                  |
|  +---------------------+                                  |
|                                                           |
+-----------------------------------------------------------+
```

## 用户界面导航结构

```
+------------------------------------------------------------------+
|  系统导航栏 [租户选择器] [用户信息] [通知] [帮助] [设置]           |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------+  +---------------------------------------+ |
|  |                  |  |                                       | |
|  |  侧边导航菜单      |  |              主内容区域               | |
|  |                  |  |                                       | |
|  |  - 首页/仪表盘    |  |                                       | |
|  |  - 池塘管理       |  |                                       | |
|  |  - 批次管理       |  |                                       | |
|  |  - 水质监测       |  |                                       | |
|  |  - 投喂管理       |  |                                       | |
|  |  - 生长记录       |  |                                       | |
|  |  - 疾病防治       |  |                                       | |
|  |  - 物资管理       |  |                                       | |
|  |    - 饲料        |  |                                       | |
|  |    - 药品        |  |                                       | |
|  |    - 设备        |  |                                       | |
|  |  - 环境监测       |  |                                       | |
|  |  - 销售管理       |  |                                       | |
|  |  - 成本分析       |  |                                       | |
|  |  - 报表统计       |  |                                       | |
|  |  - 系统管理       |  |                                       | |
|  |    - 角色管理     |  |                                       | |
|  |    - 权限设置     |  |                                       | |
|  |    - 用户分配     |  |                                       | |
|  |    - 系统设置     |  |                                       | |
|  |    - 操作日志     |  |                                       | |
|  |                  |  |                                       | |
|  +------------------+  +---------------------------------------+ |
|                                                                  |
+------------------------------------------------------------------+
```

## 数据流图

```
+-------------+     +-------------+     +-------------+
|             |     |             |     |             |
|   用户界面   | --> |  业务逻辑层  | --> |  数据访问层  |
|             |     |             |     |             |
+-------------+     +-------------+     +-------------+
                           |                  |
                           v                  v
                    +-------------+    +-------------+
                    |             |    |             |
                    | 租户上下文   |    |   数据库     |
                    |             |    |             |
                    +-------------+    +-------------+
```

## 典型用户流程

### 1. 池塘管理流程

```
+----------+     +----------+     +----------+     +----------+
|          |     |          |     |          |     |          |
| 创建池塘  | --> | 配置信息  | --> | 分配批次  | --> | 监控数据  |
|          |     |          |     |          |     |          |
+----------+     +----------+     +----------+     +----------+
```

### 2. 养殖批次流程

```
+----------+     +----------+     +----------+     +----------+     +----------+
|          |     |          |     |          |     |          |     |          |
| 创建批次  | --> | 投苗放养  | --> | 日常管理  | --> | 收获管理  | --> | 销售记录  |
|          |     |          |     |          |     |          |     |          |
+----------+     +----------+     +----------+     +----------+     +----------+
                                      |
                                      v
                               +-------------+
                               |             |
                               | 投喂、监测、  |
                               | 疾病防治等   |
                               |             |
                               +-------------+
```

### 3. 水质监测流程

```
+----------+     +----------+     +----------+     +----------+
|          |     |          |     |          |     |          |
| 数据采集  | --> | 数据记录  | --> | 数据分析  | --> | 预警处理  |
|          |     |          |     |          |     |          |
+----------+     +----------+     +----------+     +----------+
```

### 4. 角色与权限管理流程

```
+----------+     +----------+     +----------+     +----------+
|          |     |          |     |          |     |          |
| 创建角色  | --> | 设置权限  | --> | 分配用户  | --> | 审计跟踪  |
|          |     |          |     |          |     |          |
+----------+     +----------+     +----------+     +----------+
```

## 角色与权限模型

```
+-----------------------+        +-----------------------+
|                       |        |                       |
|        用户表          |        |        角色表          |
|     (系统用户管理)     |        |       (roles)         |
|                       |        |                       |
+-----------------------+        +-----------------------+
        |  |                              |  |
        |  |                              |  |
        |  |                              |  |
        |  |                              |  |
        |  |                              |  |
        v  v                              v  v
+-----------------------+        +-----------------------+
|                       |        |                       |
|      用户角色表        |        |      角色权限表        |
|    (user_roles)       |        |  (role_permissions)   |
|                       |        |                       |
+-----------------------+        +-----------------------+
                                          |
                                          |
                                          v
                                +-----------------------+
                                |                       |
                                |        权限表         |
                                |    (permissions)      |
                                |                       |
                                +-----------------------+
                                          |
                                          |
                                          v
                                +-----------------------+
                                |                       |
                                |      业务功能模块      |
                                |                       |
                                +-----------------------+
```

### 审计与日志

```
+----------------------+     +----------------------+     +----------------------+
|                      |     |                      |     |                      |
|    用户操作行为       | --> |    权限安全检查      | --> |    操作日志记录      |
|                      |     |                      |     |                      |
+----------------------+     +----------------------+     +----------------------+
                                                                    |
                                                                    v
                                                          +----------------------+
                                                          |                      |
                                                          |    安全审计分析      |
                                                          |                      |
                                                          +----------------------+
```

## 权限控制矩阵

| 角色 | 池塘管理 | 批次管理 | 水质监测 | 投喂管理 | 生长记录 | 疾病防治 | 物资管理 | 销售管理 | 成本分析 | 报表统计 | 角色权限管理 | 操作日志 |
|------|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|------------|---------|
| 超级管理员 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 租户管理员 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 养殖技术员 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - | - | ✓ | - | - |
| 销售人员 | - | ✓ | - | - | - | - | - | ✓ | - | ✓ | - | - |
| 数据录入员 | - | - | ✓ | ✓ | ✓ | ✓ | - | - | - | - | - | - |
| 系统管理员 | - | - | - | - | - | - | - | - | - | ✓ | ✓ | ✓ |
| 只读用户 | 只读 | 只读 | 只读 | 只读 | 只读 | 只读 | 只读 | 只读 | 只读 | 只读 | - | 只读 |

## 权限详细说明

每个功能模块的权限细分为四种操作类型：

| 操作类型 | 描述 | 权限代码示例 |
|---------|------|------------|
| 查看(View) | 允许查看数据，但不能修改 | pond.view |
| 创建(Create) | 允许创建新数据 | pond.create |
| 编辑(Edit) | 允许修改现有数据 | pond.edit |
| 删除(Delete) | 允许删除数据 | pond.delete |

例如，对于池塘管理模块，权限可细分为：
- 查看池塘信息(pond.view)
- 创建新池塘(pond.create)
- 编辑池塘信息(pond.edit)
- 删除池塘(pond.delete)

租户管理员可以针对每个角色精确配置这些细粒度的权限，实现更精细化的权限控制。

## 数据库审计与安全

系统通过以下机制实现数据库级的审计与安全：

1. 创建人和更新人追踪
   - 所有表记录创建人(created_by)和更新人(updated_by)
   - 自动记录记录创建时间(created_at)和更新时间(updated_at)

2. 操作日志记录
   - 记录所有关键业务操作
   - 包含操作类型、模块、操作人、时间、结果等信息
   - 支持按租户、用户、时间、操作类型等多维度查询

3. 数据隔离
   - 所有业务表都包含tenant_id字段
   - 所有查询自动附加tenant_id条件
   - 系统级表(如权限表)由平台统一管理