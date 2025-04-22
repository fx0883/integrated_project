"""
通用应用的Admin配置
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from common.models import APILog

@admin.register(APILog)
class APILogAdmin(admin.ModelAdmin):
    """
    API日志的Admin配置
    """
    list_display = ('id', 'request_method', 'request_path', 'status_code', 'user', 'tenant', 'response_time', 'created_at')
    list_filter = ('request_method', 'status_code', 'status_type', 'created_at', 'tenant')
    search_fields = ('request_path', 'ip_address', 'user__username', 'tenant__name')
    readonly_fields = (
        'user', 'tenant', 'ip_address', 'request_method', 'request_path', 
        'query_params', 'request_body', 'status_code', 'response_time', 
        'status_type', 'error_message', 'user_agent', 'created_at'
    )
    fieldsets = (
        (None, {
            'fields': ('user', 'tenant', 'ip_address')
        }),
        (_('请求信息'), {
            'fields': ('request_method', 'request_path', 'query_params', 'request_body', 'user_agent')
        }),
        (_('响应信息'), {
            'fields': ('status_code', 'status_type', 'response_time', 'error_message')
        }),
        (_('时间信息'), {
            'fields': ('created_at',)
        }),
    )
    
    def has_add_permission(self, request):
        """
        禁止手动添加日志记录
        """
        return False
    
    def has_change_permission(self, request, obj=None):
        """
        禁止修改日志记录
        """
        return False
