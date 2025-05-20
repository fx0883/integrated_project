"""
用户模型的Admin配置
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.utils.translation import gettext_lazy as _
from users.models import User
from common.admin import TenantAdminMixin

# 添加调试信息
print("=== 正在执行users/admin.py ===")

@admin.register(User)
class UserAdmin(TenantAdminMixin, DjangoUserAdmin):
    """
    自定义用户模型的Admin配置
    """
    list_display = ('id', 'username', 'email', 'display_role', 'is_active', 'tenant', 'parent', 'date_joined')
    list_filter = ('is_active', 'is_super_admin', 'is_admin', 'is_member', 'tenant__name', 'status', 'parent')
    search_fields = ('username', 'email', 'nick_name', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('个人信息'), {'fields': ('first_name', 'last_name', 'email', 'phone', 'nick_name', 'avatar')}),
        (_('权限'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'is_super_admin', 'is_admin', 'is_member', 
                     'groups', 'user_permissions'),
        }),
        (_('租户和账号关系'), {'fields': ('tenant', 'status', 'is_deleted', 'parent')}),
        (_('重要日期'), {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'tenant', 'parent'),
        }),
    )
    
    def save_model(self, request, obj, form, change):
        """
        重写保存方法，处理特殊情况：
        - 超级管理员不需要关联租户
        - 普通用户保存时自动关联当前用户的租户（如果没有指定）
        """
        # 如果是超级管理员，清除租户关联
        if obj.is_super_admin and obj.tenant:
            obj.tenant = None
        
        # 如果非超级管理员没有指定租户，使用当前用户的租户
        if not obj.is_super_admin and not obj.tenant:
            obj.tenant = getattr(request.user, 'tenant', None)
        
        super().save_model(request, obj, form, change)
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """
        重写formfield_for_foreignkey方法，过滤租户选项
        """
        if db_field.name == "tenant":
            # 超级管理员可以选择所有租户
            if request.user.is_superuser or getattr(request.user, 'is_super_admin', False):
                pass  # 不做过滤
            else:
                # 非超级管理员只能选择自己所属的租户
                tenant = getattr(request.user, 'tenant', None)
                if tenant:
                    kwargs["queryset"] = db_field.related_model.objects.filter(id=tenant.id)
                else:
                    kwargs["queryset"] = db_field.related_model.objects.none()
        
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
    def display_role(self, obj):
        """
        显示用户角色
        """
        return obj.display_role
    display_role.short_description = _('角色')

# 添加调试信息
print("=== users/admin.py执行完毕 ===")
print(f"=== admin._registry包含User模型: {User in admin.site._registry.keys()} ===")
