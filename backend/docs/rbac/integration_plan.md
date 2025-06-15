# RBAC权限控制集成方案

## 1. 概述

本文档提供将基于角色的访问控制（RBAC）集成到现有Django多租户系统的方案。RBAC将增强系统的安全性和灵活性，允许更精细的权限管理。

## 2. 现状分析

### 2.1 现有权限模型

当前系统使用简单的权限模型：
- 用户分为三类：超级管理员、租户管理员和普通用户
- 权限基于用户类型进行硬编码控制
- 使用Django REST Framework的权限类进行API访问控制
- 没有细粒度的功能权限控制

### 2.2 现有代码结构

- 用户模型(`users/models.py`)中包含基本角色标志：`is_super_admin`、`is_admin`、`is_member`
- 权限控制在`common/permissions.py`中实现，包括`IsSuperAdmin`、`IsAdmin`等权限类
- 认证通过JWT实现，在`common/authentication/jwt_auth.py`中

## 3. RBAC模型设计

### 3.1 核心实体

我们将引入以下核心实体：

1. **权限(Permission)**
   - 最小粒度的权限单元，表示对特定资源的特定操作
   - 例如：`view_user`、`edit_user`、`delete_user`等

2. **角色(Role)**
   - 权限的集合
   - 可分配给用户
   - 支持租户隔离

3. **用户-角色关联(UserRole)**
   - 用户和角色的多对多关系
   - 支持时间限制和状态控制

### 3.2 数据模型

```python
# 权限模型
class Permission(models.Model):
    """权限定义"""
    code = models.CharField("权限代码", max_length=100, unique=True)
    name = models.CharField("权限名称", max_length=100)
    description = models.TextField("权限描述", blank=True)
    category = models.CharField("权限类别", max_length=50)
    is_system = models.BooleanField("是否系统权限", default=False)
    created_at = models.DateTimeField("创建时间", auto_now_add=True)
    
    class Meta:
        verbose_name = "权限"
        verbose_name_plural = "权限列表"
        db_table = "rbac_permission"
        ordering = ["category", "code"]

# 角色模型
class Role(models.Model):
    """角色定义"""
    name = models.CharField("角色名称", max_length=100)
    code = models.CharField("角色代码", max_length=100)
    description = models.TextField("角色描述", blank=True)
    permissions = models.ManyToManyField(Permission, related_name="roles", verbose_name="权限列表")
    is_system = models.BooleanField("是否系统角色", default=False)
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="roles",
        verbose_name="所属租户"
    )
    created_at = models.DateTimeField("创建时间", auto_now_add=True)
    updated_at = models.DateTimeField("更新时间", auto_now=True)
    
    class Meta:
        verbose_name = "角色"
        verbose_name_plural = "角色列表"
        db_table = "rbac_role"
        unique_together = [["code", "tenant"]]
        ordering = ["tenant", "name"]

# 用户-角色关联
class UserRole(models.Model):
    """用户角色关联"""
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name="user_roles", verbose_name="用户")
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="user_roles", verbose_name="角色")
    is_active = models.BooleanField("是否激活", default=True)
    start_time = models.DateTimeField("生效时间", null=True, blank=True)
    end_time = models.DateTimeField("失效时间", null=True, blank=True)
    created_at = models.DateTimeField("创建时间", auto_now_add=True)
    
    class Meta:
        verbose_name = "用户角色"
        verbose_name_plural = "用户角色列表"
        db_table = "rbac_user_role"
        unique_together = [["user", "role"]]
```

## 4. 权限检查机制

### 4.1 权限检查层次

1. **API级别**
   - 继承DRF的权限类，实现基于RBAC的权限检查
   - 支持基于角色和权限的访问控制

2. **对象级别**
   - 实现对象级权限检查，控制用户对特定对象的访问
   - 支持数据行级权限控制

3. **界面级别**
   - 前端根据用户权限动态显示/隐藏UI元素
   - 通过API返回用户权限列表供前端使用

### 4.2 权限检查实现

```python
class HasPermission(permissions.BasePermission):
    """
    检查用户是否拥有指定权限
    """
    def __init__(self, required_permission):
        self.required_permission = required_permission
        
    def has_permission(self, request, view):
        user = request.user
        
        # 超级管理员拥有所有权限
        if user.is_super_admin:
            return True
            
        # 检查用户是否拥有指定权限
        return user.has_permission(self.required_permission)
```

## 5. 用户模型扩展

扩展现有用户模型，添加权限检查方法：

```python
# 在User模型中添加
def has_permission(self, permission_code):
    """
    检查用户是否拥有指定权限
    
    Args:
        permission_code: 权限代码
        
    Returns:
        布尔值，指示用户是否拥有权限
    """
    # 超级管理员拥有所有权限
    if self.is_super_admin:
        return True
        
    # 从缓存获取用户权限
    permissions = self.get_all_permissions()
    
    return permission_code in permissions
    
def get_all_permissions(self):
    """
    获取用户所有权限
    
    Returns:
        权限代码集合
    """
    # 使用缓存减少数据库查询
    cache_key = f"user_permissions_{self.id}"
    permissions = cache.get(cache_key)
    
    if permissions is None:
        # 从数据库获取权限
        permissions = set()
        for user_role in self.user_roles.filter(is_active=True):
            # 检查角色是否在有效期内
            if user_role.is_active and user_role.is_in_valid_period():
                for permission in user_role.role.permissions.all():
                    permissions.add(permission.code)
        
        # 缓存结果
        cache.set(cache_key, permissions, 3600)  # 缓存1小时
        
    return permissions
```

## 6. 集成步骤

### 6.1 数据库模型集成

1. 创建新的Django应用`rbac`
2. 定义权限、角色和用户角色模型
3. 创建并应用数据库迁移

### 6.2 权限检查集成

1. 实现权限检查装饰器和中间件
2. 扩展DRF权限类
3. 在视图中使用新的权限类

### 6.3 初始数据设置

1. 创建系统默认权限和角色
2. 为现有用户分配适当的角色
3. 实现权限和角色管理接口

### 6.4 前端集成

1. 实现权限和角色管理界面
2. 基于用户权限动态渲染UI元素
3. 实现权限错误处理和提示

## 7. 缓存策略

为提高性能，我们将实施以下缓存策略：

1. 用户权限缓存
2. 角色权限缓存
3. 权限检查结果缓存

## 8. 安全考虑

1. 防止权限提升攻击
2. 租户间权限隔离
3. 权限变更审计日志

## 9. 兼容性和迁移策略

1. 保持与现有权限系统的兼容
2. 平滑迁移现有权限控制到RBAC
3. 支持回滚机制

## 10. 后续工作

1. 实现更细粒度的权限控制
2. 支持动态权限规则
3. 权限分析和优化工具

## 11. 待讨论问题

1. 是否需要支持权限继承机制？
2. 如何处理跨租户的权限控制？
3. 是否需要支持临时权限授予？
4. 权限与业务流程的集成方式？
5. 权限变更的审批流程？ 