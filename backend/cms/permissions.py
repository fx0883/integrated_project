"""
CMS系统权限控制
"""
import logging
from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied

logger = logging.getLogger(__name__)


class CMSBasePermission(permissions.BasePermission):
    """
    CMS系统基础权限类
    - 超级管理员可以管理所有资源
    - 用户必须关联租户才能访问API
    - 租户管理员可以查看和管理其租户内的所有资源
    - 普通用户只能操作自己的资源
    - 所有GET请求允许匿名访问
    """
    
    def has_permission(self, request, view):
        """
        检查用户是否有权限访问该视图
        
        所有GET请求允许匿名访问
        创建/更新/删除操作需要检查角色和参数
        """
        # 允许所有GET请求匿名访问
        if request.method in permissions.SAFE_METHODS:
            return True
            
        user = request.user
        
        # 未认证用户无权限执行非安全方法
        if not user or not user.is_authenticated:
            logger.warning(f"未认证用户尝试访问 {request.path}")
            return False
        
        # 检查用户是否关联租户
        if not hasattr(user, 'tenant') or not user.tenant:
            logger.warning(f"用户 {user.username} 未关联租户，拒绝访问 {request.path}")
            raise PermissionDenied("用户未关联租户，无法访问CMS系统")
        
        # 超级管理员和租户管理员
        if user.is_super_admin or user.is_admin:
            return True
        
        # 普通用户只能操作自己的资源
        if hasattr(view, 'get_object'):
            try:
                obj = view.get_object()
                return self.has_object_permission(request, view, obj)
            except:
                pass
        
        # 普通用户创建资源时，自动设置为自己的资源
        if request.method == 'POST':
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """
        检查用户是否有权限操作特定对象
        
        - 超级管理员可以操作所有资源
        - 租户管理员可以操作其租户内的所有资源
        - 普通用户只能操作自己的资源
        """
        user = request.user
        
        # 检查用户是否关联租户
        if not hasattr(user, 'tenant') or not user.tenant:
            logger.warning(f"用户 {user.username} 未关联租户，拒绝访问对象 {obj.__class__.__name__} #{getattr(obj, 'id', 'unknown')}")
            raise PermissionDenied("用户未关联租户，无法访问CMS系统")
        
        # 验证对象所属租户与用户租户一致
        if hasattr(obj, 'tenant') and obj.tenant != user.tenant:
            logger.warning(f"用户 {user.username} 尝试操作不属于其租户的对象 {obj.__class__.__name__} #{getattr(obj, 'id', 'unknown')}")
            raise PermissionDenied("不能操作其他租户的资源")
        
        # 超级管理员可以操作所有资源
        if user.is_super_admin:
            return True
        
        # 租户管理员可以操作其租户内的所有资源
        if user.is_admin and hasattr(obj, 'tenant') and obj.tenant == user.tenant:
            return True
        
        # 获取对象的所有者
        obj_author_id = None
        if hasattr(obj, 'author_id'):
            obj_author_id = obj.author_id
        elif hasattr(obj, 'author'):
            obj_author_id = obj.author.id if obj.author else None
        elif hasattr(obj, 'user_id'):
            obj_author_id = obj.user_id
        elif hasattr(obj, 'user'):
            obj_author_id = obj.user.id if obj.user else None
        
        # 自己的资源
        if obj_author_id == user.id:
            return True
        
        logger.warning(f"用户 {user.username} 尝试访问不属于他的对象 {obj.__class__.__name__} #{getattr(obj, 'id', 'unknown')}")
        return False


class ArticlePermission(CMSBasePermission):
    """
    文章权限控制
    
    额外规则：
    - 所有GET请求允许匿名访问
    - 草稿、待审核和私有文章，只有作者和管理员可以查看
    """
    
    def has_object_permission(self, request, view, obj):
        # GET请求允许匿名访问已发布且公开的文章
        if request.method in permissions.SAFE_METHODS:
            if obj.status == 'published' and obj.visibility == 'public':
                return True
                
        # 首先检查基本权限
        if super().has_object_permission(request, view, obj):
            return True
        
        return False


class CategoryPermission(CMSBasePermission):
    """
    分类权限控制
    """
    pass


class TagPermission(CMSBasePermission):
    """
    标签权限控制
    """
    pass


class CommentPermission(CMSBasePermission):
    """
    评论权限控制
    
    额外规则：
    - 所有认证用户都可以给开放评论的文章添加评论
    - 评论作者可以编辑或删除自己的评论
    - 文章作者可以管理其文章下的所有评论
    """
    
    def has_permission(self, request, view):
        # 添加评论需要检查文章是否允许评论
        if request.method == 'POST':
            article_id = request.data.get('article') or request.data.get('article_id')
            if article_id:
                from .models import Article
                try:
                    article = Article.objects.get(id=article_id, tenant=request.user.tenant)
                    if not article.allow_comment:
                        return False
                except Article.DoesNotExist:
                    return False
        
        return super().has_permission(request, view)
    
    def has_object_permission(self, request, view, obj):
        # 首先检查基本权限
        if super().has_object_permission(request, view, obj):
            return True
        
        # 文章作者可以管理其文章下的所有评论
        user = request.user
        if hasattr(obj, 'article') and obj.article.author_id == user.id:
            return True
        
        return False


class ArticleVersionPermission(CMSBasePermission):
    """
    文章版本权限控制
    """
    pass


class ArticleMetaPermission(CMSBasePermission):
    """
    文章元数据权限控制
    """
    pass


class ArticleStatisticsPermission(CMSBasePermission):
    """
    文章统计权限控制
    """
    pass


class InteractionPermission(CMSBasePermission):
    """
    用户互动权限控制
    """
    pass 