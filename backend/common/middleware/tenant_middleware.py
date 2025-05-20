"""
租户中间件，用于处理请求中的租户上下文
"""
import logging
from django.utils.deprecation import MiddlewareMixin
from common.utils.tenant_manager import set_current_tenant, clear_current_tenant

logger = logging.getLogger(__name__)

class TenantMiddleware(MiddlewareMixin):
    """
    租户中间件，用于从请求中提取租户信息并设置租户上下文
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
        
        # 未登录用户没有租户上下文
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return None
        
        # 获取用户关联的租户
        tenant = getattr(request.user, 'tenant', None)
        
        # 超级管理员可能没有关联租户
        if tenant is None and request.user.is_super_admin:
            logger.debug(f"超级管理员 {request.user.username} 访问，无租户上下文")
            return None
        
        # 设置当前线程的租户上下文
        if tenant:
            logger.debug(f"用户 {request.user.username} 属于租户 {tenant.name}")
            set_current_tenant(tenant)
        else:
            logger.warning(f"用户 {request.user.username} 没有关联租户")
        
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