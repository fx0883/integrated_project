# RBAC实施指南

本文档提供RBAC权限控制系统的具体实施步骤和最佳实践。

## 1. 创建RBAC应用

### 1.1 创建Django应用

```bash
python manage.py startapp rbac
```

### 1.2 注册应用

在`core/settings.py`中添加应用：

```python
INSTALLED_APPS = [
    # ...其他应用
    'rbac',
]
```

## 2. 实现数据模型

### 2.1 创建模型文件

在`rbac/models.py`中定义权限、角色和用户角色关联模型：

```python
from django.db import models
from django.utils.translation import gettext_lazy as _

class Permission(models.Model):
    """权限定义"""
    code = models.CharField(_("权限代码"), max_length=100, unique=True)
    name = models.CharField(_("权限名称"), max_length=100)
    description = models.TextField(_("权限描述"), blank=True)
    category = models.CharField(_("权限类别"), max_length=50)
    is_system = models.BooleanField(_("是否系统权限"), default=False)
    created_at = models.DateTimeField(_("创建时间"), auto_now_add=True)
    
    class Meta:
        verbose_name = _("权限")
        verbose_name_plural = _("权限列表")
        db_table = "rbac_permission"
        ordering = ["category", "code"]
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class Role(models.Model):
    """角色定义"""
    name = models.CharField(_("角色名称"), max_length=100)
    code = models.CharField(_("角色代码"), max_length=100)
    description = models.TextField(_("角色描述"), blank=True)
    permissions = models.ManyToManyField(
        Permission, 
        related_name="roles", 
        verbose_name=_("权限列表")
    )
    is_system = models.BooleanField(_("是否系统角色"), default=False)
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="roles",
        verbose_name=_("所属租户")
    )
    created_at = models.DateTimeField(_("创建时间"), auto_now_add=True)
    updated_at = models.DateTimeField(_("更新时间"), auto_now=True)
    
    class Meta:
        verbose_name = _("角色")
        verbose_name_plural = _("角色列表")
        db_table = "rbac_role"
        unique_together = [["code", "tenant"]]
        ordering = ["tenant", "name"]
    
    def __str__(self):
        tenant_name = self.tenant.name if self.tenant else "系统"
        return f"{self.name} ({tenant_name})"


class UserRole(models.Model):
    """用户角色关联"""
    user = models.ForeignKey(
        'users.User', 
        on_delete=models.CASCADE, 
        related_name="user_roles", 
        verbose_name=_("用户")
    )
    role = models.ForeignKey(
        Role, 
        on_delete=models.CASCADE, 
        related_name="user_roles", 
        verbose_name=_("角色")
    )
    is_active = models.BooleanField(_("是否激活"), default=True)
    start_time = models.DateTimeField(_("生效时间"), null=True, blank=True)
    end_time = models.DateTimeField(_("失效时间"), null=True, blank=True)
    created_at = models.DateTimeField(_("创建时间"), auto_now_add=True)
    
    class Meta:
        verbose_name = _("用户角色")
        verbose_name_plural = _("用户角色列表")
        db_table = "rbac_user_role"
        unique_together = [["user", "role"]]
    
    def __str__(self):
        return f"{self.user.username} - {self.role.name}"
    
    def is_in_valid_period(self):
        """检查是否在有效期内"""
        from django.utils import timezone
        now = timezone.now()
        
        # 检查开始时间
        if self.start_time and self.start_time > now:
            return False
        
        # 检查结束时间
        if self.end_time and self.end_time < now:
            return False
        
        return True
```

### 2.2 创建数据库迁移

```bash
python manage.py makemigrations rbac
python manage.py migrate
```

## 3. 扩展用户模型

### 3.1 在User模型中添加权限检查方法

在`users/models.py`中扩展User模型：

```python
from django.core.cache import cache

# 在User类中添加以下方法
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
        
        # 导入UserRole模型（避免循环导入）
        from rbac.models import UserRole
        
        # 获取用户的所有有效角色
        user_roles = UserRole.objects.filter(
            user=self,
            is_active=True
        ).select_related('role')
        
        for user_role in user_roles:
            # 检查角色是否在有效期内
            if user_role.is_in_valid_period():
                # 获取角色的所有权限
                for permission in user_role.role.permissions.all():
                    permissions.add(permission.code)
        
        # 缓存结果（1小时）
        cache.set(cache_key, permissions, 3600)
        
    return permissions

def clear_permission_cache(self):
    """清除用户权限缓存"""
    cache_key = f"user_permissions_{self.id}"
    cache.delete(cache_key)
```

## 4. 实现权限检查

### 4.1 创建权限检查装饰器

在`rbac/decorators.py`中：

```python
from functools import wraps
from django.core.exceptions import PermissionDenied
from django.utils.translation import gettext as _

def permission_required(permission_code):
    """
    检查用户是否拥有指定权限的装饰器
    
    Args:
        permission_code: 权限代码
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_authenticated:
                raise PermissionDenied(_("用户未认证"))
            
            if not request.user.has_permission(permission_code):
                raise PermissionDenied(_("权限不足"))
            
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator
```

### 4.2 创建DRF权限类

在`rbac/permissions.py`中：

```python
from rest_framework import permissions

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


class HasAnyPermission(permissions.BasePermission):
    """
    检查用户是否拥有任意一个指定权限
    """
    def __init__(self, *required_permissions):
        self.required_permissions = required_permissions
        
    def has_permission(self, request, view):
        user = request.user
        
        # 超级管理员拥有所有权限
        if user.is_super_admin:
            return True
            
        # 检查用户是否拥有任意一个指定权限
        for permission in self.required_permissions:
            if user.has_permission(permission):
                return True
                
        return False


class HasAllPermissions(permissions.BasePermission):
    """
    检查用户是否拥有所有指定权限
    """
    def __init__(self, *required_permissions):
        self.required_permissions = required_permissions
        
    def has_permission(self, request, view):
        user = request.user
        
        # 超级管理员拥有所有权限
        if user.is_super_admin:
            return True
            
        # 检查用户是否拥有所有指定权限
        for permission in self.required_permissions:
            if not user.has_permission(permission):
                return False
                
        return True
```

## 5. 实现API视图

### 5.1 创建序列化器

在`rbac/serializers.py`中：

```python
from rest_framework import serializers
from .models import Permission, Role, UserRole

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'code', 'name', 'description', 'category', 'is_system', 'created_at']


class RoleSerializer(serializers.ModelSerializer):
    permission_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Role
        fields = ['id', 'name', 'code', 'description', 'is_system', 'tenant', 
                  'created_at', 'updated_at', 'permission_count']
    
    def get_permission_count(self, obj):
        return obj.permissions.count()


class RoleDetailSerializer(RoleSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)
    
    class Meta(RoleSerializer.Meta):
        fields = RoleSerializer.Meta.fields + ['permissions']


class UserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRole
        fields = ['id', 'user', 'role', 'is_active', 'start_time', 'end_time', 'created_at']
```

### 5.2 创建视图集

在`rbac/views.py`中：

```python
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Permission, Role, UserRole
from .serializers import (
    PermissionSerializer, RoleSerializer, RoleDetailSerializer, UserRoleSerializer
)
from .permissions import HasPermission

class PermissionViewSet(viewsets.ModelViewSet):
    """
    权限管理视图集
    """
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [HasPermission('rbac:manage_permissions')]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # 过滤条件
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        
        if category:
            queryset = queryset.filter(category=category)
        
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) | 
                models.Q(code__icontains=search) |
                models.Q(description__icontains=search)
            )
        
        return queryset


class RoleViewSet(viewsets.ModelViewSet):
    """
    角色管理视图集
    """
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [HasPermission('rbac:manage_roles')]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RoleDetailSerializer
        return RoleSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # 过滤条件
        tenant_id = self.request.query_params.get('tenant_id')
        search = self.request.query_params.get('search')
        is_system = self.request.query_params.get('is_system')
        
        if tenant_id:
            if tenant_id == 'null':
                queryset = queryset.filter(tenant__isnull=True)
            else:
                queryset = queryset.filter(tenant_id=tenant_id)
        
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) | 
                models.Q(code__icontains=search) |
                models.Q(description__icontains=search)
            )
        
        if is_system is not None:
            is_system = is_system.lower() == 'true'
            queryset = queryset.filter(is_system=is_system)
        
        return queryset
    
    def perform_create(self, serializer):
        role = serializer.save()
        
        # 处理权限
        permissions = self.request.data.get('permissions', [])
        if permissions:
            role.permissions.set(permissions)
    
    def perform_update(self, serializer):
        role = serializer.save()
        
        # 处理权限
        permissions = self.request.data.get('permissions', [])
        if permissions:
            role.permissions.set(permissions)


class UserRoleViewSet(viewsets.ModelViewSet):
    """
    用户角色管理视图集
    """
    queryset = UserRole.objects.all()
    serializer_class = UserRoleSerializer
    permission_classes = [HasPermission('rbac:manage_user_roles')]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # 过滤条件
        user_id = self.request.query_params.get('user_id')
        role_id = self.request.query_params.get('role_id')
        is_active = self.request.query_params.get('is_active')
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        if role_id:
            queryset = queryset.filter(role_id=role_id)
        
        if is_active is not None:
            is_active = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active)
        
        return queryset
    
    def perform_create(self, serializer):
        user_role = serializer.save()
        
        # 清除用户权限缓存
        user_role.user.clear_permission_cache()
    
    def perform_update(self, serializer):
        user_role = serializer.save()
        
        # 清除用户权限缓存
        user_role.user.clear_permission_cache()
    
    def perform_destroy(self, instance):
        user = instance.user
        instance.delete()
        
        # 清除用户权限缓存
        user.clear_permission_cache()
```

## 6. 配置URL路由

### 6.1 创建URL配置

在`rbac/urls.py`中：

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'permissions', views.PermissionViewSet)
router.register(r'roles', views.RoleViewSet)
router.register(r'user-roles', views.UserRoleViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # 其他自定义API路径
]
```

### 6.2 添加到主URL配置

在`core/urls.py`中：

```python
urlpatterns = [
    # ...其他URL配置
    path('api/rbac/', include('rbac.urls')),
]
```

## 7. 初始化数据

### 7.1 创建初始权限和角色

创建`rbac/management/commands/init_rbac.py`：

```python
from django.core.management.base import BaseCommand
from rbac.models import Permission, Role
from django.db import transaction

class Command(BaseCommand):
    help = '初始化RBAC权限和角色'

    def handle(self, *args, **kwargs):
        self.stdout.write('开始初始化RBAC权限和角色...')
        
        with transaction.atomic():
            # 创建系统权限
            self.create_permissions()
            
            # 创建系统角色
            self.create_roles()
            
        self.stdout.write(self.style.SUCCESS('RBAC初始化完成!'))
    
    def create_permissions(self):
        # 用户管理权限
        user_permissions = [
            {'code': 'user:view', 'name': '查看用户', 'category': '用户管理'},
            {'code': 'user:create', 'name': '创建用户', 'category': '用户管理'},
            {'code': 'user:edit', 'name': '编辑用户', 'category': '用户管理'},
            {'code': 'user:delete', 'name': '删除用户', 'category': '用户管理'},
        ]
        
        # 租户管理权限
        tenant_permissions = [
            {'code': 'tenant:view', 'name': '查看租户', 'category': '租户管理'},
            {'code': 'tenant:create', 'name': '创建租户', 'category': '租户管理'},
            {'code': 'tenant:edit', 'name': '编辑租户', 'category': '租户管理'},
            {'code': 'tenant:delete', 'name': '删除租户', 'category': '租户管理'},
        ]
        
        # RBAC权限管理
        rbac_permissions = [
            {'code': 'rbac:view_permissions', 'name': '查看权限', 'category': 'RBAC管理'},
            {'code': 'rbac:manage_permissions', 'name': '管理权限', 'category': 'RBAC管理'},
            {'code': 'rbac:view_roles', 'name': '查看角色', 'category': 'RBAC管理'},
            {'code': 'rbac:manage_roles', 'name': '管理角色', 'category': 'RBAC管理'},
            {'code': 'rbac:manage_user_roles', 'name': '管理用户角色', 'category': 'RBAC管理'},
        ]
        
        # 合并所有权限
        all_permissions = user_permissions + tenant_permissions + rbac_permissions
        
        # 创建权限
        for perm_data in all_permissions:
            Permission.objects.get_or_create(
                code=perm_data['code'],
                defaults={
                    'name': perm_data['name'],
                    'category': perm_data['category'],
                    'is_system': True,
                }
            )
            
        self.stdout.write(f'创建了 {len(all_permissions)} 个系统权限')
    
    def create_roles(self):
        # 创建系统管理员角色
        admin_role, created = Role.objects.get_or_create(
            code='system_admin',
            defaults={
                'name': '系统管理员',
                'description': '拥有所有系统权限的角色',
                'is_system': True,
                'tenant': None,
            }
        )
        
        # 为系统管理员分配所有权限
        admin_role.permissions.set(Permission.objects.all())
        
        # 创建租户管理员角色
        tenant_admin_role, created = Role.objects.get_or_create(
            code='tenant_admin',
            defaults={
                'name': '租户管理员',
                'description': '租户级管理员角色',
                'is_system': True,
                'tenant': None,
            }
        )
        
        # 为租户管理员分配相关权限
        tenant_admin_permissions = Permission.objects.filter(
            code__in=[
                'user:view', 'user:create', 'user:edit', 'user:delete',
                'rbac:view_roles', 'rbac:view_permissions', 'rbac:manage_user_roles'
            ]
        )
        tenant_admin_role.permissions.set(tenant_admin_permissions)
        
        self.stdout.write('创建了系统角色')
```

### 7.2 运行初始化命令

```bash
python manage.py init_rbac
```

## 8. 集成到现有视图

### 8.1 在视图中使用权限检查

示例：

```python
from rbac.permissions import HasPermission

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action == 'list' or self.action == 'retrieve':
            permission_classes = [HasPermission('user:view')]
        elif self.action == 'create':
            permission_classes = [HasPermission('user:create')]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [HasPermission('user:edit')]
        elif self.action == 'destroy':
            permission_classes = [HasPermission('user:delete')]
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
```

## 9. 权限缓存管理

### 9.1 创建信号处理器

在`rbac/signals.py`中：

```python
from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from .models import UserRole, Role

@receiver(post_save, sender=UserRole)
@receiver(post_delete, sender=UserRole)
def clear_user_permission_cache(sender, instance, **kwargs):
    """当用户角色变更时，清除用户权限缓存"""
    if hasattr(instance, 'user') and instance.user:
        instance.user.clear_permission_cache()

@receiver(m2m_changed, sender=Role.permissions.through)
def clear_role_users_permission_cache(sender, instance, action, **kwargs):
    """当角色权限变更时，清除所有拥有该角色的用户的权限缓存"""
    if action in ['post_add', 'post_remove', 'post_clear']:
        # 获取拥有该角色的所有用户
        user_roles = instance.user_roles.all()
        for user_role in user_roles:
            if user_role.user:
                user_role.user.clear_permission_cache()
```

### 9.2 注册信号处理器

在`rbac/apps.py`中：

```python
from django.apps import AppConfig

class RbacConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'rbac'
    
    def ready(self):
        import rbac.signals
```

## 10. 前端集成

### 10.1 获取用户权限

在前端登录成功后，获取用户权限：

```javascript
// 获取当前用户权限
async function fetchUserPermissions() {
  try {
    const response = await fetch('/api/rbac/my-permissions/', {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('获取权限失败');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('获取用户权限出错:', error);
    return { permissions: [], roles: [] };
  }
}
```

### 10.2 权限检查组件

创建权限检查组件：

```jsx
// PermissionGuard.jsx
import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

const PermissionGuard = ({ permission, children, fallback = null }) => {
  const { hasPermission } = usePermissions();
  
  if (hasPermission(permission)) {
    return children;
  }
  
  return fallback;
};

export default PermissionGuard;
```

### 10.3 使用示例

```jsx
import PermissionGuard from '../components/PermissionGuard';

function UserManagement() {
  return (
    <div>
      <h1>用户管理</h1>
      
      {/* 只有拥有查看用户权限的用户才能看到用户列表 */}
      <PermissionGuard permission="user:view">
        <UserList />
      </PermissionGuard>
      
      {/* 只有拥有创建用户权限的用户才能看到创建按钮 */}
      <PermissionGuard permission="user:create">
        <button>创建用户</button>
      </PermissionGuard>
    </div>
  );
}
``` 