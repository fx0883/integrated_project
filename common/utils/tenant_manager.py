"""
租户管理器，用于自动过滤查询集
"""
import logging
from django.db import models
import threading

# 创建线程本地存储
_thread_local = threading.local()
logger = logging.getLogger(__name__)

def get_current_tenant():
    """
    获取当前线程中存储的租户
    
    Returns:
        当前租户对象，如果未设置则返回None
    """
    return getattr(_thread_local, 'tenant', None)

def set_current_tenant(tenant):
    """
    设置当前线程的租户
    
    Args:
        tenant: 租户对象，设置为None表示清除租户上下文
    """
    if tenant:
        logger.debug(f"设置当前租户: {tenant.name} (ID: {tenant.id})")
    else:
        logger.debug("清除当前租户上下文")
    
    _thread_local.tenant = tenant

def clear_current_tenant():
    """
    清除当前线程的租户上下文
    """
    if hasattr(_thread_local, 'tenant'):
        logger.debug("清除当前租户上下文")
        del _thread_local.tenant

class TenantManager(models.Manager):
    """
    租户模型管理器，自动根据当前租户过滤查询集
    """
    def get_queryset(self):
        """
        重写查询集方法，自动按当前租户过滤
        
        Returns:
            按当前租户过滤后的查询集，如果没有当前租户上下文则返回全部
        """
        queryset = super().get_queryset()
        tenant = get_current_tenant()
        
        if tenant:
            # 如果有租户上下文，则过滤结果
            logger.debug(f"TenantManager: 过滤租户 {tenant.name} (ID: {tenant.id}) 的数据")
            return queryset.filter(tenant=tenant)
        
        # 如果没有租户上下文（例如超级管理员访问），返回全部结果
        logger.debug("TenantManager: 无租户上下文，返回全部数据")
        return queryset 