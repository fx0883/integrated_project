"""
租户模型的Admin配置
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from tenants.models import Tenant, TenantQuota
from common.admin import TenantAdminMixin

# 添加调试信息
print("=== Running tenants/admin.py ===")

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    """
    租户模型的Admin配置
    注意：租户模型本身是顶层实体，不需要租户隔离
    但普通管理员只能看到自己所属的租户
    """
    list_display = ('id', 'name', 'status', 'contact_name', 'contact_email', 'created_at')
    list_filter = ('status', 'is_deleted', 'created_at')
    search_fields = ('name', 'contact_name', 'contact_email')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('name', 'status', 'is_deleted')
        }),
        (_('联系人信息'), {
            'fields': ('contact_name', 'contact_email', 'contact_phone')
        }),
        (_('时间信息'), {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def get_queryset(self, request):
        """
        超级管理员可以看到所有租户
        普通管理员只能看到自己所属的租户
        """
        qs = super().get_queryset(request)
        
        # 超级管理员可以看到所有租户
        if request.user.is_superuser or getattr(request.user, 'is_super_admin', False):
            return qs
        
        # 普通用户只能看到自己所属的租户
        tenant = getattr(request.user, 'tenant', None)
        if tenant:
            return qs.filter(id=tenant.id)
        
        # 没有租户的用户看不到任何租户
        return qs.none()


@admin.register(TenantQuota)
class TenantQuotaAdmin(TenantAdminMixin, admin.ModelAdmin):
    """
    租户配额模型的Admin配置
    每个租户只有一个配额记录，与租户是一对一关系
    """
    list_display = ('id', 'tenant', 'max_users', 'max_admins', 'max_storage_mb', 'current_storage_used_mb')
    list_filter = ('tenant__status',)
    search_fields = ('tenant__name',)
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('tenant',)
        }),
        (_('配额设置'), {
            'fields': ('max_users', 'max_admins', 'max_storage_mb', 'max_products')
        }),
        (_('使用情况'), {
            'fields': ('current_storage_used_mb',)
        }),
        (_('时间信息'), {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def get_queryset(self, request):
        """
        重写get_queryset，租户配额与租户是一对一关系
        需要特殊处理查询逻辑
        """
        qs = super(admin.ModelAdmin, self).get_queryset(request)
        
        # 超级管理员可以看到所有租户配额
        if request.user.is_superuser or getattr(request.user, 'is_super_admin', False):
            return qs
        
        # 普通用户只能看到自己所属租户的配额
        tenant = getattr(request.user, 'tenant', None)
        if tenant:
            return qs.filter(tenant=tenant)
        
        # 没有租户的用户看不到任何配额
        return qs.none()
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """
        重写formfield_for_foreignkey方法，限制租户选择
        对于租户字段，限制只能选择当前用户关联的租户（除非是超级管理员）
        """
        if db_field.name == 'tenant':
            # 超级管理员可以选择所有租户
            if request.user.is_superuser or getattr(request.user, 'is_super_admin', False):
                pass  # 不做限制，可以选择任何租户
            else:
                # 非超级管理员只能选择自己所属的租户
                tenant = getattr(request.user, 'tenant', None)
                if tenant:
                    kwargs["queryset"] = Tenant.objects.filter(id=tenant.id)
                else:
                    kwargs["queryset"] = Tenant.objects.none()
        
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
    def save_model(self, request, obj, form, change):
        """
        重写save_model方法，确保租户配额关联到正确的租户
        """
        # 如果是新建记录且没有指定租户
        if not change and not obj.tenant:
            # 非超级管理员用户，使用当前用户的租户
            if not (request.user.is_superuser or getattr(request.user, 'is_super_admin', False)):
                obj.tenant = getattr(request.user, 'tenant', None)
        
        super().save_model(request, obj, form, change)
    
    def has_add_permission(self, request):
        """
        控制添加权限：
        - 超级管理员可以添加任何租户的配额
        - 普通用户只能为自己所属的租户添加配额（如果尚不存在）
        """
        # 超级管理员始终可以添加
        if request.user.is_superuser or getattr(request.user, 'is_super_admin', False):
            return True
        
        # 获取当前用户关联的租户
        tenant = getattr(request.user, 'tenant', None)
        if not tenant:
            return False
        
        # 检查该租户是否已有配额记录
        has_quota = TenantQuota.objects.filter(tenant=tenant).exists()
        
        # 只有在租户没有配额记录的情况下才允许添加
        return not has_quota
        
    def has_change_permission(self, request, obj=None):
        """
        控制修改权限：
        - 超级管理员可以修改任何租户的配额
        - 普通用户只能修改自己所属租户的配额
        """
        # 超级管理员始终可以修改
        if request.user.is_superuser or getattr(request.user, 'is_super_admin', False):
            return True
        
        # 如果没有指定对象，返回通用权限
        if obj is None:
            return True
        
        # 获取当前用户关联的租户
        tenant = getattr(request.user, 'tenant', None)
        if not tenant:
            return False
        
        # 只能修改自己租户的配额
        return obj.tenant == tenant

# 添加调试信息
print("=== tenants/admin.py execution completed ===")
print(f"=== admin._registry contains Tenant model: {Tenant in admin.site._registry.keys()} ===")
print(f"=== admin._registry contains TenantQuota model: {TenantQuota in admin.site._registry.keys()} ===")
