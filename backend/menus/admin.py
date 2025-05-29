from django.contrib import admin
from .models import Menu, UserMenu

@admin.register(Menu)
class MenuAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'path', 'order', 'parent', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'code', 'path')
    list_editable = ('order', 'is_active')
    ordering = ('order',)
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('基本信息', {
            'fields': ('name', 'code', 'is_active', 'order')
        }),
        ('菜单配置', {
            'fields': ('icon', 'path', 'component', 'parent')
        }),
        ('其他信息', {
            'fields': ('remarks', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(UserMenu)
class UserMenuAdmin(admin.ModelAdmin):
    list_display = ('user', 'menu', 'is_active', 'created_at')
    list_filter = ('user__is_admin', 'user__is_super_admin', 'is_active')
    search_fields = ('user__username', 'user__email', 'menu__name')
    list_editable = ('is_active',)
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('user', 'menu')
    fieldsets = (
        ('关联信息', {
            'fields': ('user', 'menu', 'is_active')
        }),
        ('时间信息', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
