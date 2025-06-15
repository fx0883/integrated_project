# RBAC迁移指南

本文档提供从现有权限系统迁移到RBAC权限控制系统的详细步骤和注意事项。

## 1. 迁移概述

从现有的基于角色标志（`is_super_admin`、`is_admin`、`is_member`）的权限系统迁移到完整的RBAC系统需要分阶段进行，确保系统在迁移过程中持续可用。

## 2. 迁移策略

### 2.1 平行运行策略

我们将采用"平行运行"策略，在一段时间内同时保持两套权限系统工作：

1. **第一阶段**：部署RBAC系统，但现有权限检查仍然使用旧系统
2. **第二阶段**：逐步将权限检查切换到RBAC系统，但保留旧系统作为备份
3. **第三阶段**：完全切换到RBAC系统，旧系统仅作为兼容层

### 2.2 回滚机制

为确保安全，我们将实现以下回滚机制：

1. 特性开关：通过配置控制是否使用RBAC系统
2. 双重检查：关键操作同时使用新旧系统进行权限检查
3. 监控告警：监控权限检查异常，及时发现问题

## 3. 准备工作

### 3.1 现有权限映射

首先，我们需要将现有的角色标志映射到RBAC权限：

| 角色标志 | 对应RBAC角色 | 包含权限 |
|---------|-------------|---------|
| is_super_admin | 系统超级管理员 | 所有系统权限 |
| is_admin (tenant) | 租户管理员 | 租户内所有权限 |
| is_member | 普通成员 | 基本操作权限 |

### 3.2 创建权限和角色映射表

创建详细的权限映射文档，记录每个现有视图函数/API的权限要求及其对应的RBAC权限：

```python
# 权限映射示例
PERMISSION_MAPPING = {
    # 用户管理
    'users.views.UserViewSet.list': ['user:view'],
    'users.views.UserViewSet.create': ['user:create'],
    'users.views.UserViewSet.update': ['user:edit'],
    'users.views.UserViewSet.destroy': ['user:delete'],
    
    # 租户管理
    'tenants.views.TenantViewSet.list': ['tenant:view'],
    'tenants.views.TenantViewSet.create': ['tenant:create'],
    # ...更多映射
}
```

## 4. 数据迁移

### 4.1 创建初始权限数据

```bash
# 运行初始化命令创建基本权限和角色
python manage.py init_rbac
```

### 4.2 为现有用户分配角色

创建迁移脚本`rbac/management/commands/migrate_user_roles.py`：

```python
from django.core.management.base import BaseCommand
from django.db import transaction
from users.models import User
from rbac.models import Role, UserRole

class Command(BaseCommand):
    help = '为现有用户分配RBAC角色'

    def handle(self, *args, **kwargs):
        self.stdout.write('开始为现有用户分配RBAC角色...')
        
        # 获取预定义角色
        try:
            super_admin_role = Role.objects.get(code='system_admin')
            tenant_admin_role = Role.objects.get(code='tenant_admin')
            member_role = Role.objects.get(code='tenant_member')
        except Role.DoesNotExist:
            self.stdout.write(self.style.ERROR('预定义角色不存在，请先运行init_rbac命令'))
            return
        
        # 为用户分配角色
        with transaction.atomic():
            # 处理超级管理员
            super_admins = User.objects.filter(is_super_admin=True)
            self.assign_role(super_admins, super_admin_role, '超级管理员')
            
            # 处理租户管理员
            tenant_admins = User.objects.filter(is_admin=True, is_super_admin=False)
            self.assign_role(tenant_admins, tenant_admin_role, '租户管理员')
            
            # 处理普通成员
            members = User.objects.filter(is_member=True, is_admin=False, is_super_admin=False)
            self.assign_role(members, member_role, '普通成员')
            
        self.stdout.write(self.style.SUCCESS('用户角色分配完成!'))
    
    def assign_role(self, users, role, role_name):
        """为用户分配角色"""
        count = 0
        for user in users:
            # 检查是否已分配该角色
            if not UserRole.objects.filter(user=user, role=role).exists():
                UserRole.objects.create(user=user, role=role, is_active=True)
                count += 1
        
        self.stdout.write(f'为 {count} 个{role_name}分配了角色 {role.name}')
```

运行迁移命令：

```bash
python manage.py migrate_user_roles
```

## 5. 代码迁移

### 5.1 创建兼容层

在`rbac/compatibility.py`中创建兼容层：

```python
from django.conf import settings

# 是否启用RBAC
RBAC_ENABLED = getattr(settings, 'RBAC_ENABLED', False)

def check_permission_compatibility(user, permission_code):
    """
    兼容层权限检查
    
    如果启用RBAC，使用RBAC权限检查
    否则使用旧的角色标志检查
    
    Args:
        user: 用户对象
        permission_code: RBAC权限代码
    
    Returns:
        布尔值，指示用户是否有权限
    """
    # 未认证用户没有权限
    if not user.is_authenticated:
        return False
    
    # 如果启用RBAC，使用RBAC权限检查
    if RBAC_ENABLED:
        return user.has_permission(permission_code)
    
    # 否则使用旧的角色标志检查
    
    # 超级管理员拥有所有权限
    if user.is_super_admin:
        return True
    
    # 用户管理权限
    if permission_code.startswith('user:'):
        # 租户管理员可以管理用户
        if user.is_admin:
            return True
        # 普通用户只能查看
        if permission_code == 'user:view' and user.is_member:
            return True
    
    # 租户管理权限
    if permission_code.startswith('tenant:'):
        # 只有超级管理员可以管理租户（前面已处理）
        return False
    
    # 默认拒绝
    return False
```

### 5.2 更新权限检查装饰器

创建兼容性装饰器`rbac/decorators_compat.py`：

```python
from functools import wraps
from django.core.exceptions import PermissionDenied
from django.utils.translation import gettext as _
from .compatibility import check_permission_compatibility

def permission_required_compat(permission_code):
    """
    兼容版权限检查装饰器
    
    Args:
        permission_code: 权限代码
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_authenticated:
                raise PermissionDenied(_("用户未认证"))
            
            if not check_permission_compatibility(request.user, permission_code):
                raise PermissionDenied(_("权限不足"))
            
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator
```

### 5.3 更新DRF权限类

创建兼容性权限类`rbac/permissions_compat.py`：

```python
from rest_framework import permissions
from .compatibility import check_permission_compatibility

class HasPermissionCompat(permissions.BasePermission):
    """
    兼容版权限检查类
    """
    def __init__(self, required_permission):
        self.required_permission = required_permission
        
    def has_permission(self, request, view):
        return check_permission_compatibility(request.user, self.required_permission)
```

## 6. 逐步替换现有权限检查

### 6.1 配置特性开关

在`core/settings.py`中添加：

```python
# RBAC特性开关
RBAC_ENABLED = os.getenv('RBAC_ENABLED', 'False').lower() == 'true'
```

### 6.2 替换权限检查

逐步将现有权限检查替换为兼容版：

```python
# 旧代码
from common.permissions import IsAdmin

class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
```

替换为：

```python
# 新代码
from rbac.permissions_compat import HasPermissionCompat

class UserViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action == 'list' or self.action == 'retrieve':
            permission_classes = [HasPermissionCompat('user:view')]
        elif self.action == 'create':
            permission_classes = [HasPermissionCompat('user:create')]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [HasPermissionCompat('user:edit')]
        elif self.action == 'destroy':
            permission_classes = [HasPermissionCompat('user:delete')]
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
```

## 7. 测试和验证

### 7.1 单元测试

创建测试用例验证权限检查：

```python
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from users.models import User
from rbac.models import Permission, Role, UserRole

class RBACCompatibilityTestCase(TestCase):
    def setUp(self):
        # 创建测试用户
        self.admin_user = User.objects.create_user(
            username='admin',
            password='password',
            is_admin=True
        )
        
        self.normal_user = User.objects.create_user(
            username='user',
            password='password',
            is_member=True
        )
        
        # 创建测试权限和角色
        self.view_permission = Permission.objects.create(
            code='user:view',
            name='查看用户',
            category='用户管理'
        )
        
        self.admin_role = Role.objects.create(
            name='管理员',
            code='admin'
        )
        self.admin_role.permissions.add(self.view_permission)
        
        # 分配角色
        UserRole.objects.create(
            user=self.admin_user,
            role=self.admin_role,
            is_active=True
        )
        
        # 创建API客户端
        self.client = APIClient()
    
    def test_rbac_disabled_compatibility(self):
        """测试RBAC禁用时的兼容性"""
        with self.settings(RBAC_ENABLED=False):
            # 管理员应该可以访问
            self.client.force_authenticate(user=self.admin_user)
            response = self.client.get(reverse('user-list'))
            self.assertEqual(response.status_code, 200)
            
            # 普通用户应该可以访问（根据旧权限规则）
            self.client.force_authenticate(user=self.normal_user)
            response = self.client.get(reverse('user-list'))
            self.assertEqual(response.status_code, 200)
    
    def test_rbac_enabled(self):
        """测试RBAC启用时的权限检查"""
        with self.settings(RBAC_ENABLED=True):
            # 管理员应该可以访问（有角色和权限）
            self.client.force_authenticate(user=self.admin_user)
            response = self.client.get(reverse('user-list'))
            self.assertEqual(response.status_code, 200)
            
            # 普通用户应该被拒绝（没有分配角色和权限）
            self.client.force_authenticate(user=self.normal_user)
            response = self.client.get(reverse('user-list'))
            self.assertEqual(response.status_code, 403)
```

### 7.2 集成测试

创建端到端测试验证完整流程：

```python
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from users.models import User
from rbac.models import Permission, Role, UserRole

class RBACIntegrationTestCase(TestCase):
    def setUp(self):
        # 创建测试数据
        self.setup_users()
        self.setup_rbac()
        self.client = APIClient()
    
    def setup_users(self):
        # 创建各类用户
        self.super_admin = User.objects.create_user(
            username='superadmin',
            password='password',
            is_super_admin=True
        )
        
        self.tenant_admin = User.objects.create_user(
            username='tenantadmin',
            password='password',
            is_admin=True
        )
        
        self.normal_user = User.objects.create_user(
            username='normaluser',
            password='password',
            is_member=True
        )
    
    def setup_rbac(self):
        # 创建权限
        self.view_user_perm = Permission.objects.create(
            code='user:view',
            name='查看用户',
            category='用户管理'
        )
        
        self.create_user_perm = Permission.objects.create(
            code='user:create',
            name='创建用户',
            category='用户管理'
        )
        
        # 创建角色
        self.admin_role = Role.objects.create(
            name='系统管理员',
            code='system_admin',
            is_system=True
        )
        self.admin_role.permissions.add(self.view_user_perm, self.create_user_perm)
        
        self.tenant_admin_role = Role.objects.create(
            name='租户管理员',
            code='tenant_admin',
            is_system=True
        )
        self.tenant_admin_role.permissions.add(self.view_user_perm)
        
        # 分配角色
        UserRole.objects.create(
            user=self.super_admin,
            role=self.admin_role,
            is_active=True
        )
        
        UserRole.objects.create(
            user=self.tenant_admin,
            role=self.tenant_admin_role,
            is_active=True
        )
    
    def test_full_rbac_workflow(self):
        """测试完整RBAC工作流程"""
        with self.settings(RBAC_ENABLED=True):
            # 1. 超级管理员可以查看和创建用户
            self.client.force_authenticate(user=self.super_admin)
            
            # 查看用户列表
            response = self.client.get(reverse('user-list'))
            self.assertEqual(response.status_code, 200)
            
            # 创建用户
            response = self.client.post(reverse('user-list'), {
                'username': 'newuser',
                'password': 'password',
                'email': 'newuser@example.com'
            })
            self.assertEqual(response.status_code, 201)
            
            # 2. 租户管理员可以查看但不能创建用户
            self.client.force_authenticate(user=self.tenant_admin)
            
            # 查看用户列表
            response = self.client.get(reverse('user-list'))
            self.assertEqual(response.status_code, 200)
            
            # 尝试创建用户（应该被拒绝）
            response = self.client.post(reverse('user-list'), {
                'username': 'anotheruser',
                'password': 'password',
                'email': 'another@example.com'
            })
            self.assertEqual(response.status_code, 403)
            
            # 3. 普通用户不能查看或创建用户
            self.client.force_authenticate(user=self.normal_user)
            
            # 尝试查看用户列表
            response = self.client.get(reverse('user-list'))
            self.assertEqual(response.status_code, 403)
            
            # 尝试创建用户
            response = self.client.post(reverse('user-list'), {
                'username': 'yetanotheruser',
                'password': 'password',
                'email': 'yetanother@example.com'
            })
            self.assertEqual(response.status_code, 403)
```

## 8. 部署和切换

### 8.1 部署步骤

1. 部署RBAC代码但保持禁用状态
2. 运行数据迁移脚本
3. 在测试环境中启用RBAC
4. 验证功能正常后在生产环境中启用

### 8.2 切换计划

| 阶段 | 时间 | 操作 |
|-----|------|-----|
| 准备阶段 | 第1周 | 部署代码，运行数据迁移 |
| 测试阶段 | 第2周 | 在测试环境启用RBAC |
| 灰度发布 | 第3周 | 对部分用户启用RBAC |
| 全面切换 | 第4周 | 对所有用户启用RBAC |
| 清理阶段 | 第5周 | 移除旧权限代码 |

### 8.3 监控和告警

设置以下监控指标：

1. 权限检查失败率
2. API错误率
3. 用户投诉数量

如果指标异常，立即回滚到旧系统。

## 9. 培训和文档

### 9.1 开发人员培训

为开发团队提供以下培训：

1. RBAC基本概念
2. 如何使用新的权限API
3. 如何编写权限测试

### 9.2 管理员培训

为系统管理员提供以下培训：

1. 如何管理角色和权限
2. 如何分配用户角色
3. 如何排查权限问题

### 9.3 用户文档

更新用户手册，包括：

1. 权限系统变更说明
2. 新功能使用指南
3. 常见问题解答

## 10. 后续优化

### 10.1 性能优化

1. 优化权限缓存策略
2. 减少数据库查询
3. 实现权限预加载

### 10.2 功能增强

1. 实现权限继承机制
2. 添加时间限制权限
3. 实现动态权限规则

### 10.3 工具支持

1. 开发权限分析工具
2. 实现权限可视化界面
3. 创建权限审计报告 