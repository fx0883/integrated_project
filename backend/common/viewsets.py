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
    
    权限控制规则：
    - GET请求允许匿名访问，但需要租户ID
    - 非GET请求需要认证，并且用户必须关联租户
    - 超级管理员可以通过X-Tenant-ID请求头指定租户进行操作
    - 只有URL路径中包含"cms"的API才需要进行租户ID验证
    """
    
    def get_queryset(self):
        """
        获取查询集并根据租户ID进行过滤
        
        如果模型有tenant字段，则自动按当前租户ID过滤
        """
        queryset = super().get_queryset()
        
        # 检查请求路径是否包含"cms"，如果不包含，则跳过租户验证
        if "/cms/" not in self.request.path:
            logger.debug(f"非CMS路径，跳过租户过滤: {self.request.path}")
            return queryset
        
        # 获取当前租户ID
        tenant_id = getattr(self.request, 'tenant_id', None)
        
        # 如果没有租户ID，则返回空查询集
        if not tenant_id:
            logger.warning("尝试获取查询集但未提供租户ID")
            return queryset.none()
            
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
        # 检查请求路径是否包含"cms"，如果不包含，则跳过租户验证
        if "/cms/" not in self.request.path:
            logger.debug(f"非CMS路径，跳过租户设置: {self.request.path}")
            return serializer.save()
        
        # 获取当前租户ID
        tenant_id = getattr(self.request, 'tenant_id', None)
        
        # 如果没有租户ID，则拒绝创建
        if not tenant_id:
            logger.warning("尝试创建对象但未提供租户ID")
            raise ValidationError({"detail": "未提供租户ID，无法创建对象"})
        
        # 如果模型有tenant字段且有租户ID，则自动设置
        if tenant_id and hasattr(serializer.Meta.model, 'tenant'):
            logger.debug(f"创建对象时设置租户ID: {tenant_id}")
            try:
                # 确保租户ID是整数
                tenant_id = int(tenant_id)
                
                # 超级管理员特殊处理：允许通过X-Tenant-ID请求头指定租户进行操作
                user = self.request.user
                is_super_admin = getattr(user, 'is_super_admin', False)
                
                if is_super_admin:
                    # 超级管理员已经在中间件中验证了租户ID的有效性
                    logger.info(f"超级管理员 {user.username} 在租户 {tenant_id} 中创建对象")
                    serializer.save(tenant_id=tenant_id)
                    return
                
                # 验证普通用户是否关联该租户
                if user.is_authenticated and hasattr(user, 'tenant') and user.tenant:
                    if str(user.tenant.id) != str(tenant_id):
                        logger.warning(f"用户 {user.username} 尝试在其他租户创建对象")
                        raise PermissionDenied("无法在其他租户创建对象")
                
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
        # 检查请求路径是否包含"cms"，如果不包含，则跳过租户验证
        if "/cms/" not in self.request.path:
            logger.debug(f"非CMS路径，跳过租户验证: {self.request.path}")
            return serializer.save()
        
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
        # 检查请求路径是否包含"cms"，如果不包含，则跳过租户验证
        if "/cms/" not in self.request.path:
            logger.debug(f"非CMS路径，跳过租户验证: {self.request.path}")
            return instance.delete()
        
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
        # 检查请求路径是否包含"cms"，如果不包含，则跳过租户验证
        if "/cms/" not in self.request.path:
            logger.debug(f"非CMS路径，跳过租户验证: {self.request.path}")
            return
        
        # 如果对象没有tenant字段，则跳过验证
        if not hasattr(obj, 'tenant'):
            return
            
        # 获取当前租户ID
        tenant_id = getattr(self.request, 'tenant_id', None)
        
        # 如果没有设置租户ID，则拒绝访问
        if not tenant_id:
            logger.warning("尝试操作对象但未提供租户ID")
            raise PermissionDenied("无法操作对象: 未提供租户ID")
            
        # 验证对象所属租户与当前租户ID是否匹配
        obj_tenant_id = str(obj.tenant.id) if obj.tenant else None
        if obj_tenant_id and obj_tenant_id != str(tenant_id):
            logger.warning(f"尝试操作不属于当前租户的对象: 对象租户ID={obj_tenant_id}, 当前租户ID={tenant_id}")
            raise PermissionDenied("无法操作不属于当前租户的对象") 