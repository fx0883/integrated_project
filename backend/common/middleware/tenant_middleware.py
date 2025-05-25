"""
租户中间件，用于处理请求中的租户上下文
"""
import logging
from django.utils.deprecation import MiddlewareMixin
from rest_framework.exceptions import PermissionDenied, ValidationError
from common.utils.tenant_context import get_current_tenant, set_current_tenant, clear_current_tenant

logger = logging.getLogger(__name__)

class TenantMiddleware(MiddlewareMixin):
    """
    租户中间件，用于从请求中提取租户信息并设置租户上下文
    
    处理以下租户信息来源:
    1. X-Tenant-ID 请求头
    2. 用户关联的租户
    """
    
    def process_request(self, request):
        """
        处理请求，设置当前租户
        
        Args:
            request: HTTP请求对象
        
        Returns:
            None
        """
        # 清除之前的租户上下文
        clear_current_tenant()
        
        # 从请求头获取租户ID并验证
        header_tenant_id = request.headers.get('X-Tenant-ID')
        
        # 验证租户ID是否为有效整数
        if header_tenant_id:
            try:
                header_tenant_id = int(header_tenant_id)
                # 转换为字符串以便后续比较
                header_tenant_id = str(header_tenant_id)
            except (ValueError, TypeError):
                logger.warning(f"无效的租户ID格式: {header_tenant_id}")
                raise ValidationError({"detail": f"无效的租户ID格式: {header_tenant_id}，租户ID必须是整数"})
        
        # 将租户ID保存到请求对象，方便视图使用
        request.tenant_id = header_tenant_id
        
        # 未登录用户只能使用请求头中的租户ID
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            if header_tenant_id:
                logger.debug(f"未认证用户使用请求头租户ID: {header_tenant_id}")
                # 这里只保存ID，不设置租户上下文，因为未认证用户没有权限访问多数资源
            return None
        
        # 获取用户关联的租户
        user_tenant = getattr(request.user, 'tenant', None)
        user_tenant_id = str(user_tenant.id) if user_tenant else None
        
        # 如果请求头中有租户ID，验证与用户租户是否匹配
        if header_tenant_id and user_tenant_id and header_tenant_id != user_tenant_id:
            # 超级管理员可以访问任何租户的资源
            if not getattr(request.user, 'is_super_admin', False):
                logger.warning(f"用户 {request.user.username} 尝试访问不属于其租户的资源，租户ID不匹配")
                raise PermissionDenied("无法访问其他租户的资源")
        
        # 确定最终使用的租户ID
        # 优先使用请求头中的租户ID，如果没有则使用用户关联的租户ID
        effective_tenant_id = header_tenant_id or user_tenant_id
        
        # 如果没有设置租户ID，请求头和用户关联的租户都为空
        if not effective_tenant_id:
            # 超级管理员可能没有关联租户
            if getattr(request.user, 'is_super_admin', False):
                logger.debug(f"超级管理员 {request.user.username} 访问，无租户上下文")
                return None
            else:
                logger.warning(f"用户 {request.user.username} 没有关联租户且未提供租户ID")
        
        # 设置最终的租户ID到请求对象
        request.tenant_id = effective_tenant_id
        
        # 设置当前线程的租户上下文
        if user_tenant:
            logger.debug(f"用户 {request.user.username} 属于租户 {user_tenant.name}")
            set_current_tenant(user_tenant)
        
        return None
    
    def process_response(self, request, response):
        """
        处理响应，清除当前租户
        
        Args:
            request: HTTP请求对象
            response: HTTP响应对象
        
        Returns:
            HTTP响应对象
        """
        # 请求结束后清除租户上下文
        clear_current_tenant()
        return response 