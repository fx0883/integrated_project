"""
视图集基类，提供多租户支持
"""
import logging
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError

logger = logging.getLogger(__name__)

class TenantModelViewSet(viewsets.ModelViewSet):
    """
    多租户支持的模型视图集基类
    
    自动处理以下功能:
    1. 根据租户ID过滤查询集
    2. 创建对象时自动设置租户ID
    3. 验证对象所属租户与用户租户是否匹配
    """
    
    def get_queryset(self):
        """
        获取查询集并根据租户ID进行过滤
        
        如果模型有tenant字段，则自动按当前租户ID过滤
        超级管理员可以访问所有租户的数据
        """
        queryset = super().get_queryset()
        
        # 获取当前租户ID
        tenant_id = getattr(self.request, 'tenant_id', None)
        
        # 如果用户是超级管理员且未指定租户ID，则可以查看所有数据
        user = getattr(self.request, 'user', None)
        if user and getattr(user, 'is_super_admin', False) and not tenant_id:
            logger.debug("超级管理员访问，不过滤租户")
            return queryset
            
        # 如果模型有tenant字段且有租户ID，则按租户过滤
        if tenant_id and hasattr(queryset.model, 'tenant'):
            logger.debug(f"按租户ID过滤查询集: {tenant_id}")
            try:
                # 确保租户ID是整数
                tenant_id = int(tenant_id)
                return queryset.filter(tenant_id=tenant_id)
            except (ValueError, TypeError):
                # 这里不应该发生，因为中间件已经验证了租户ID
                logger.error(f"无效的租户ID: {tenant_id}")
                raise ValidationError({"detail": f"无效的租户ID: {tenant_id}"})
            
        return queryset
    
    def perform_create(self, serializer):
        """
        创建对象时自动设置租户ID
        """
        # 获取当前租户ID
        tenant_id = getattr(self.request, 'tenant_id', None)
        
        # 如果模型有tenant字段且有租户ID，则自动设置
        if tenant_id and hasattr(serializer.Meta.model, 'tenant'):
            logger.debug(f"创建对象时设置租户ID: {tenant_id}")
            try:
                # 确保租户ID是整数
                tenant_id = int(tenant_id)
                serializer.save(tenant_id=tenant_id)
            except (ValueError, TypeError):
                logger.error(f"无效的租户ID: {tenant_id}")
                raise ValidationError({"detail": f"无效的租户ID: {tenant_id}"})
        else:
            # 如果没有租户ID但模型需要，则拒绝创建
            if hasattr(serializer.Meta.model, 'tenant') and \
               serializer.Meta.model._meta.get_field('tenant').null is False:
                logger.warning("尝试创建对象但未提供租户ID")
                raise PermissionDenied("无法创建对象: 未提供租户ID")
            
            serializer.save()
    
    def perform_update(self, serializer):
        """
        更新对象时验证租户ID不变
        """
        # 获取当前对象
        instance = serializer.instance
        
        # 验证对象所属租户
        self._verify_tenant_ownership(instance)
        
        # 执行更新
        serializer.save()
    
    def perform_destroy(self, instance):
        """
        删除对象前验证租户ID
        """
        # 验证对象所属租户
        self._verify_tenant_ownership(instance)
        
        # 执行删除
        instance.delete()
    
    def _verify_tenant_ownership(self, obj):
        """
        验证对象所属租户与当前租户ID是否匹配
        
        Args:
            obj: 要验证的对象
            
        Raises:
            PermissionDenied: 如果对象不属于当前租户
        """
        # 如果对象没有tenant字段，则跳过验证
        if not hasattr(obj, 'tenant'):
            return
            
        # 获取当前租户ID
        tenant_id = getattr(self.request, 'tenant_id', None)
        
        # 如果用户是超级管理员，则可以操作所有租户的对象
        user = getattr(self.request, 'user', None)
        if user and getattr(user, 'is_super_admin', False):
            return
            
        # 如果没有设置租户ID或对象没有租户，则拒绝访问
        if not tenant_id:
            logger.warning("尝试操作对象但未提供租户ID")
            raise PermissionDenied("无法操作对象: 未提供租户ID")
            
        # 验证对象所属租户与当前租户ID是否匹配
        obj_tenant_id = str(obj.tenant.id) if obj.tenant else None
        if obj_tenant_id and obj_tenant_id != tenant_id:
            logger.warning(f"尝试操作不属于当前租户的对象: 对象租户ID={obj_tenant_id}, 当前租户ID={tenant_id}")
            raise PermissionDenied("无法操作不属于当前租户的对象") 