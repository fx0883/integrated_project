# RBAC最佳实践

本文档提供RBAC权限控制系统的最佳实践和设计建议。

## 1. 权限设计原则

### 1.1 权限粒度

权限粒度应根据业务需求合理设计，既不能过粗也不能过细：

- **过粗的粒度**：如只有"用户管理"这一个权限，无法区分查看、创建、编辑等操作
- **过细的粒度**：如将"编辑用户名"和"编辑用户邮箱"分为两个权限，增加管理复杂度

推荐的粒度是按照资源类型和操作类型组合：

| 资源类型 | 操作类型 | 权限代码 |
|--------|---------|---------|
| 用户 | 查看 | user:view |
| 用户 | 创建 | user:create |
| 用户 | 编辑 | user:edit |
| 用户 | 删除 | user:delete |

### 1.2 权限命名规范

采用一致的命名规范可以提高可读性和可维护性：

- 使用冒号分隔资源和操作：`resource:action`
- 资源名使用单数形式：`user` 而非 `users`
- 操作名使用简单的动词：`view`, `create`, `edit`, `delete`
- 全部使用小写字母

示例：`tenant:create`, `role:assign`, `permission:manage`

### 1.3 权限分类

将权限按功能模块分类，便于管理：

- 用户管理：`user:*`
- 租户管理：`tenant:*`
- 角色管理：`role:*`
- 权限管理：`permission:*`
- 系统管理：`system:*`

## 2. 角色设计原则

### 2.1 角色层次结构

设计合理的角色层次结构：

1. **系统角色**：适用于所有租户的基础角色
   - 超级管理员
   - 系统运维
   - 审计员

2. **租户角色**：特定租户内的角色
   - 租户管理员
   - 部门管理员
   - 普通用户

3. **功能角色**：基于特定功能模块的角色
   - 内容编辑
   - 数据分析师
   - 客服人员

### 2.2 角色命名规范

角色命名应当简洁明了，反映角色的职责：

- 使用名词或名词短语
- 避免使用数字编号作为角色名
- 角色代码使用下划线分隔：`tenant_admin`, `content_editor`

### 2.3 避免角色爆炸

避免创建过多的角色，导致角色管理复杂：

- 使用权限组合而非创建新角色
- 实现角色继承机制
- 定期审查和清理不必要的角色

## 3. 权限检查最佳实践

### 3.1 性能优化

权限检查是高频操作，需要注意性能：

1. **缓存用户权限**
   ```python
   # 使用缓存减少数据库查询
   cache_key = f"user_permissions_{user.id}"
   permissions = cache.get(cache_key)
   
   if permissions is None:
       # 从数据库获取权限
       permissions = set()
       # ... 查询逻辑 ...
       cache.set(cache_key, permissions, 3600)  # 缓存1小时
   ```

2. **批量预加载权限**
   ```python
   # 在用户登录时预加载权限
   def login_view(request):
       # 认证用户
       # ...
       
       # 预加载权限
       user.get_all_permissions()
       
       # 返回响应
       # ...
   ```

3. **使用位掩码优化存储**
   
   对于固定的权限集合，可以使用位掩码优化存储和检查：
   ```python
   # 权限定义
   VIEW = 1      # 0001
   CREATE = 2    # 0010
   EDIT = 4      # 0100
   DELETE = 8    # 1000
   
   # 权限检查
   def has_permission(user_permissions, permission):
       return (user_permissions & permission) == permission
   ```

### 3.2 安全考虑

1. **深度防御**
   
   在多个层次实施权限检查：
   - API级别（DRF权限类）
   - 视图级别（装饰器）
   - 模型级别（重写save方法）

2. **最小权限原则**
   
   默认拒绝所有权限，只授予必要的权限：
   ```python
   # 默认拒绝
   if permission_code not in user_permissions:
       return False
   ```

3. **防止权限提升**
   
   确保用户不能修改自己的权限：
   ```python
   # 检查是否尝试修改权限
   if 'is_admin' in request.data and not request.user.is_super_admin:
       return Response({"error": "不允许修改管理员状态"}, status=403)
   ```

### 3.3 调试和日志

添加详细的权限检查日志，便于调试：

```python
def has_permission(self, request, view):
    user = request.user
    permission = self.required_permission
    result = user.has_permission(permission)
    
    logger.debug(
        f"权限检查: 用户={user.username}, "
        f"权限={permission}, 结果={'通过' if result else '拒绝'}"
    )
    
    return result
```

## 4. 租户隔离

### 4.1 租户权限隔离

确保不同租户之间的权限隔离：

```python
def has_object_permission(self, request, view, obj):
    # 检查对象是否属于用户所在的租户
    if hasattr(obj, 'tenant') and obj.tenant != request.user.tenant:
        return False
    
    # 继续其他权限检查
    # ...
```

### 4.2 跨租户操作

对于需要跨租户操作的场景，设计专门的权限：

```python
# 跨租户权限
if user.has_permission('tenant:access_all') and user.is_super_admin:
    # 允许跨租户操作
    return True
```

### 4.3 租户管理员权限

租户管理员只能管理自己租户内的资源：

```python
class TenantAdminPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # 超级管理员可以访问所有对象
        if request.user.is_super_admin:
            return True
        
        # 租户管理员只能访问自己租户的对象
        if request.user.is_admin and hasattr(obj, 'tenant'):
            return obj.tenant == request.user.tenant
        
        return False
```

## 5. 前端集成

### 5.1 权限驱动的UI

基于用户权限动态调整UI：

```jsx
// 权限检查Hook
function usePermission() {
  const [permissions, setPermissions] = useState([]);
  
  useEffect(() => {
    // 获取用户权限
    async function fetchPermissions() {
      const response = await api.get('/api/rbac/my-permissions/');
      setPermissions(response.data.permissions.map(p => p.code));
    }
    
    fetchPermissions();
  }, []);
  
  const hasPermission = useCallback((permissionCode) => {
    return permissions.includes(permissionCode);
  }, [permissions]);
  
  return { permissions, hasPermission };
}

// 使用示例
function UserManagement() {
  const { hasPermission } = usePermission();
  
  return (
    <div>
      <h1>用户管理</h1>
      
      {hasPermission('user:view') && <UserList />}
      
      {hasPermission('user:create') && (
        <Button onClick={handleCreate}>创建用户</Button>
      )}
    </div>
  );
}
```

### 5.2 权限错误处理

优雅处理权限错误：

```jsx
function handleApiError(error) {
  if (error.response && error.response.status === 403) {
    notification.error({
      message: '权限不足',
      description: '您没有执行此操作的权限，请联系管理员。'
    });
  } else {
    notification.error({
      message: '操作失败',
      description: error.message
    });
  }
}
```

### 5.3 权限缓存

在前端缓存权限信息，减少API请求：

```jsx
// 在用户登录后获取并缓存权限
async function login(username, password) {
  // 登录请求
  const loginResponse = await api.post('/api/login/', { username, password });
  const { token } = loginResponse.data;
  
  // 存储令牌
  localStorage.setItem('token', token);
  
  // 获取并缓存权限
  const permissionsResponse = await api.get('/api/rbac/my-permissions/');
  localStorage.setItem('permissions', JSON.stringify(permissionsResponse.data));
  
  return loginResponse.data;
}
```

## 6. 权限审计

### 6.1 权限变更日志

记录所有权限变更操作：

```python
@receiver(m2m_changed, sender=Role.permissions.through)
def log_role_permission_changes(sender, instance, action, **kwargs):
    """记录角色权限变更"""
    if action in ['post_add', 'post_remove']:
        permission_ids = kwargs.get('pk_set', [])
        permissions = Permission.objects.filter(id__in=permission_ids)
        
        if action == 'post_add':
            logger.info(f"角色 {instance.name} 添加了权限: {', '.join([p.name for p in permissions])}")
        elif action == 'post_remove':
            logger.info(f"角色 {instance.name} 移除了权限: {', '.join([p.name for p in permissions])}")
```

### 6.2 权限使用分析

收集权限使用数据，分析权限使用情况：

```python
class PermissionUsageMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # 记录权限使用情况
        if hasattr(request, 'permission_checked') and request.user.is_authenticated:
            # 记录到数据库或缓存
            PermissionUsage.objects.create(
                user=request.user,
                permission_code=request.permission_checked,
                path=request.path,
                method=request.method,
                status_code=response.status_code
            )
        
        return response
```

### 6.3 定期权限审查

实现定期权限审查机制：

```python
class Command(BaseCommand):
    help = '生成权限审计报告'

    def handle(self, *args, **kwargs):
        # 生成报告日期范围
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)
        
        # 获取未使用的权限
        all_permissions = set(Permission.objects.values_list('code', flat=True))
        used_permissions = set(PermissionUsage.objects.filter(
            created_at__range=(start_date, end_date)
        ).values_list('permission_code', flat=True).distinct())
        
        unused_permissions = all_permissions - used_permissions
        
        # 生成报告
        self.stdout.write(f"权限审计报告 ({start_date.date()} 至 {end_date.date()})")
        self.stdout.write(f"总权限数: {len(all_permissions)}")
        self.stdout.write(f"已使用权限数: {len(used_permissions)}")
        self.stdout.write(f"未使用权限数: {len(unused_permissions)}")
        
        if unused_permissions:
            self.stdout.write("\n未使用的权限:")
            for perm in sorted(unused_permissions):
                self.stdout.write(f"- {perm}")
```

## 7. 高级功能

### 7.1 权限继承

实现角色继承机制：

```python
class Role(models.Model):
    # ... 其他字段 ...
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children',
        verbose_name=_("父角色")
    )
    
    def get_all_permissions(self):
        """获取角色的所有权限，包括继承的权限"""
        permission_ids = set(self.permissions.values_list('id', flat=True))
        
        # 递归获取父角色的权限
        if self.parent:
            parent_permissions = self.parent.get_all_permissions()
            permission_ids.update(parent_permissions)
        
        return permission_ids
```

### 7.2 动态权限规则

实现基于条件的动态权限规则：

```python
class DynamicPermission(models.Model):
    """动态权限规则"""
    name = models.CharField(_("规则名称"), max_length=100)
    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        related_name="dynamic_rules",
        verbose_name=_("权限")
    )
    condition_field = models.CharField(_("条件字段"), max_length=100)
    condition_operator = models.CharField(
        _("条件运算符"),
        max_length=20,
        choices=[
            ('eq', '等于'),
            ('neq', '不等于'),
            ('gt', '大于'),
            ('lt', '小于'),
            ('in', '包含'),
            ('not_in', '不包含'),
        ]
    )
    condition_value = models.JSONField(_("条件值"))
    
    def check_condition(self, obj):
        """检查对象是否满足条件"""
        if not hasattr(obj, self.condition_field):
            return False
        
        field_value = getattr(obj, self.condition_field)
        
        if self.condition_operator == 'eq':
            return field_value == self.condition_value
        elif self.condition_operator == 'neq':
            return field_value != self.condition_value
        elif self.condition_operator == 'gt':
            return field_value > self.condition_value
        elif self.condition_operator == 'lt':
            return field_value < self.condition_value
        elif self.condition_operator == 'in':
            return field_value in self.condition_value
        elif self.condition_operator == 'not_in':
            return field_value not in self.condition_value
        
        return False
```

### 7.3 临时权限

实现临时权限授予机制：

```python
class TemporaryPermission(models.Model):
    """临时权限"""
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name="temporary_permissions",
        verbose_name=_("用户")
    )
    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        related_name="temporary_grants",
        verbose_name=_("权限")
    )
    granted_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name="granted_permissions",
        verbose_name=_("授权人")
    )
    reason = models.TextField(_("授权原因"))
    start_time = models.DateTimeField(_("生效时间"))
    end_time = models.DateTimeField(_("失效时间"))
    is_active = models.BooleanField(_("是否激活"), default=True)
    created_at = models.DateTimeField(_("创建时间"), auto_now_add=True)
    
    def is_valid(self):
        """检查临时权限是否有效"""
        now = timezone.now()
        return (
            self.is_active and
            self.start_time <= now and
            self.end_time >= now
        )
```

## 8. 常见问题与解决方案

### 8.1 权限检查性能问题

**问题**：频繁的权限检查导致性能下降

**解决方案**：
1. 实现多级缓存策略
2. 使用批量权限检查
3. 优化数据库查询

### 8.2 权限管理复杂性

**问题**：随着系统规模增长，权限管理变得复杂

**解决方案**：
1. 实现权限分组和分类
2. 提供可视化的权限管理界面
3. 实现权限模板和预设

### 8.3 权限与业务逻辑耦合

**问题**：权限逻辑与业务逻辑紧密耦合

**解决方案**：
1. 使用装饰器和中间件分离权限检查
2. 实现权限检查AOP（面向切面编程）
3. 使用权限服务集中管理权限逻辑 