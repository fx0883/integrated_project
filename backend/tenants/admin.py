"""
租户模型的Admin配置
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from tenants.models import Tenant, TenantQuota, TenantBusinessInfo
from common.admin import TenantAdminMixin

# 添加调试信息
print("=== Running tenants/admin.py ===")

class TenantQuotaInline(admin.StackedInline):
    """
    在租户详情页面内嵌显示配额信息
    """
    model = TenantQuota
    can_delete = False
    verbose_name = _("配额")
    verbose_name_plural = _("配额")
    fields = (
        ('max_users', 'max_admins'), 
        ('max_storage_mb', 'current_storage_used_mb'),
        'max_products',
    )
    readonly_fields = ('current_storage_used_mb',)


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    """
    租户管理界面配置
    """
    list_display = ('name', 'code', 'status', 'contact_name', 'contact_phone', 
                    'user_count', 'storage_usage', 'created_at')
    list_filter = ('status', 'is_deleted', 'created_at')
    search_fields = ('name', 'code', 'contact_name', 'contact_email', 'contact_phone')
    readonly_fields = ('created_at', 'updated_at')
    inlines = (TenantQuotaInline,)
    
    fieldsets = (
        (_('基本信息'), {
            'fields': ('name', 'code', 'status', 'is_deleted')
        }),
        (_('联系人信息'), {
            'fields': ('contact_name', 'contact_email', 'contact_phone')
        }),
        (_('时间信息'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['activate_tenants', 'suspend_tenants', 'delete_tenants']
    
    def user_count(self, obj):
        """
        显示租户的用户数
        """
        # 避免循环导入
        from users.models import User
        count = User.objects.filter(tenant=obj).count()
        max_users = getattr(obj.quota, 'max_users', 0)
        
        if max_users > 0:
            percentage = (count / max_users) * 100
            if percentage >= 90:
                color = 'red'
            elif percentage >= 70:
                color = 'orange'
            else:
                color = 'green'
                
            return format_html(
                '<span style="color: {}">{} / {}</span>',
                color, count, max_users
            )
        return count
    
    user_count.short_description = _("用户数")
    
    def storage_usage(self, obj):
        """
        显示租户的存储使用情况
        """
        try:
            used = obj.quota.current_storage_used_mb
            total = obj.quota.max_storage_mb
            
            if total > 0:
                percentage = (used / total) * 100
                if percentage >= 90:
                    color = 'red'
                elif percentage >= 70:
                    color = 'orange'
                else:
                    color = 'green'
                    
                # 转换为更易读的格式
                if used >= 1024:
                    used_str = f"{used/1024:.1f} GB"
                else:
                    used_str = f"{used} MB"
                    
                if total >= 1024:
                    total_str = f"{total/1024:.1f} GB"
                else:
                    total_str = f"{total} MB"
                    
                return format_html(
                    '<span style="color: {}">{} / {} ({:.1f}%)</span>',
                    color, used_str, total_str, percentage
                )
            return f"{used} MB"
        except:
            return _("未设置")
    
    storage_usage.short_description = _("存储使用")
    
    def activate_tenants(self, request, queryset):
        """
        批量激活租户
        """
        updated = queryset.update(status='active', is_deleted=False)
        self.message_user(request, _('成功激活 {} 个租户').format(updated))
    
    activate_tenants.short_description = _("激活选中的租户")
    
    def suspend_tenants(self, request, queryset):
        """
        批量暂停租户
        """
        updated = queryset.update(status='suspended')
        self.message_user(request, _('成功暂停 {} 个租户').format(updated))
    
    suspend_tenants.short_description = _("暂停选中的租户")
    
    def delete_tenants(self, request, queryset):
        """
        批量软删除租户
        """
        updated = queryset.update(status='deleted', is_deleted=True)
        self.message_user(request, _('成功删除 {} 个租户').format(updated))
    
    delete_tenants.short_description = _("删除选中的租户")


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


@admin.register(TenantBusinessInfo)
class TenantBusinessInfoAdmin(admin.ModelAdmin):
    """
    租户企业信息管理界面配置
    """
    list_display = ('company_name', 'tenant', 'legal_representative', 
                    'unified_social_credit_code', 'verification_status', 
                    'license_display', 'created_at')
    list_filter = ('verification_status', 'business_status', 'created_at')
    search_fields = ('company_name', 'tenant__name', 'legal_representative', 
                     'unified_social_credit_code', 'registration_number')
    readonly_fields = ('created_by', 'updated_by', 'created_at', 'updated_at',
                       'verification_status', 'verification_time', 'verification_user')
    
    fieldsets = (
        (_('关联租户'), {
            'fields': ('tenant',)
        }),
        (_('企业基本信息'), {
            'fields': ('company_name', 'legal_representative', 'unified_social_credit_code',
                      'registration_number', 'company_type', 
                      ('registered_capital', 'registered_capital_currency'),
                      'business_scope')
        }),
        (_('日期信息'), {
            'fields': ('establishment_date', 'business_term_start', 'business_term_end')
        }),
        (_('注册信息'), {
            'fields': ('registration_authority', 'approval_date', 'business_status', 
                       'registered_address')
        }),
        (_('联系信息'), {
            'fields': ('office_address', 'contact_person', 'contact_phone', 'email', 'website')
        }),
        (_('营业执照信息'), {
            'fields': ('license_image_url', 'license_image_preview', 'license_issue_date', 
                       'license_expiry_date')
        }),
        (_('验证信息'), {
            'fields': ('verification_status', 'verification_time', 'verification_user',
                       'rejection_reason')
        }),
        (_('其他信息'), {
            'fields': ('remark',)
        }),
        (_('审计信息'), {
            'fields': ('created_by', 'created_at', 'updated_by', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['verify_business_info', 'reject_business_info', 'mark_as_expired']
    
    def license_display(self, obj):
        """
        显示营业执照缩略图
        """
        if obj.license_image_url:
            return format_html(
                '<a href="{}" target="_blank"><img src="{}" height="30" /></a>',
                obj.license_image_url, obj.license_image_url
            )
        return '-'
    
    license_display.short_description = _("营业执照")
    
    def license_image_preview(self, obj):
        """
        显示营业执照预览
        """
        if obj.license_image_url:
            return format_html(
                '<a href="{0}" target="_blank"><img src="{0}" height="300" /></a>',
                obj.license_image_url
            )
        return _("未上传营业执照图片")
    
    license_image_preview.short_description = _("营业执照预览")
    
    def verify_business_info(self, request, queryset):
        """
        批量验证企业信息
        """
        from django.utils import timezone
        
        for business_info in queryset:
            business_info.verification_status = 'verified'
            business_info.verification_time = timezone.now()
            business_info.verification_user = request.user
            business_info.save(update_fields=[
                'verification_status', 'verification_time', 'verification_user', 'updated_at'
            ])
            
        self.message_user(request, _('成功验证 {} 条企业信息').format(queryset.count()))
    
    verify_business_info.short_description = _("批量验证选中的企业信息")
    
    def reject_business_info(self, request, queryset):
        """
        批量拒绝企业信息
        """
        from django.utils import timezone
        
        for business_info in queryset:
            business_info.verification_status = 'rejected'
            business_info.verification_time = timezone.now()
            business_info.verification_user = request.user
            business_info.save(update_fields=[
                'verification_status', 'verification_time', 'verification_user', 'updated_at'
            ])
            
        self.message_user(request, _('成功拒绝 {} 条企业信息').format(queryset.count()))
    
    reject_business_info.short_description = _("批量拒绝选中的企业信息")
    
    def mark_as_expired(self, request, queryset):
        """
        批量标记企业信息为已过期
        """
        from django.utils import timezone
        
        for business_info in queryset:
            business_info.verification_status = 'expired'
            business_info.verification_time = timezone.now()
            business_info.verification_user = request.user
            business_info.save(update_fields=[
                'verification_status', 'verification_time', 'verification_user', 'updated_at'
            ])
            
        self.message_user(request, _('成功将 {} 条企业信息标记为已过期').format(queryset.count()))
    
    mark_as_expired.short_description = _("批量标记选中的企业信息为已过期")

# 添加调试信息
print("=== tenants/admin.py execution completed ===")
print(f"=== admin._registry contains Tenant model: {Tenant in admin.site._registry.keys()} ===")
print(f"=== admin._registry contains TenantQuota model: {TenantQuota in admin.site._registry.keys()} ===")
