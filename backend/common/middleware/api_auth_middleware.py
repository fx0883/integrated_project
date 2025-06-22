"""
API请求认证中间件

在API请求中优先使用JWT令牌中的用户身份，覆盖会话中的用户
"""
import logging
import jwt
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
from users.models import User, Member

logger = logging.getLogger(__name__)

class APIAuthMiddleware(MiddlewareMixin):
    """
    API请求认证中间件
    
    如果是API请求且包含有效的JWT令牌，则覆盖request.user为JWT令牌中的用户
    这可确保API请求总是使用JWT令牌中的用户身份，而不是session中的用户
    """
    
    def process_request(self, request):
        # 只处理API请求
        if not request.path.startswith('/api/'):
            logger.debug(f"非API路径，跳过JWT认证中间件: {request.path}")
            return None
            
        # 从请求头获取令牌
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header or not auth_header.startswith('Bearer '):
            logger.debug("API请求没有Bearer认证头，跳过JWT用户设置")
            return None
            
        token = auth_header.split(' ')[1]
        
        try:
            # 解析令牌
            payload = jwt.decode(
                token,
                settings.JWT_AUTH['JWT_SECRET_KEY'],
                algorithms=[settings.JWT_AUTH['JWT_ALGORITHM']]
            )
            
            # 获取用户
            user_id = payload.get('user_id')
            model_type = payload.get('model_type', 'user')  # 默认为User模型
            
            if user_id:
                try:
                    # 根据model_type判断获取哪种用户
                    if model_type == 'member' and Member:
                        jwt_user = Member.objects.get(pk=user_id, is_active=True, is_deleted=False)
                    else:
                        jwt_user = User.objects.get(pk=user_id, is_active=True, is_deleted=False)
                        
                    # 检查用户状态
                    if jwt_user.status != 'active':
                        logger.warning(f"JWT令牌中的用户状态异常: {jwt_user.username} ({jwt_user.status})")
                        return None
                    
                    # 记录原始用户和新用户，方便调试
                    if hasattr(request, 'user') and request.user.is_authenticated:
                        original_user = request.user.username
                        logger.info(f"API认证中间件: 用户已从 {original_user} 替换为JWT用户 {jwt_user.username}")
                    else:
                        logger.info(f"API认证中间件: 用户已设置为JWT用户 {jwt_user.username}")
                    
                    # 替换request.user为JWT令牌中的用户
                    request.user = jwt_user
                    # 标记使用的是JWT认证
                    request.auth_type = 'jwt'
                    
                except (User.DoesNotExist, Member.DoesNotExist) if Member else User.DoesNotExist:
                    logger.warning(f"JWT令牌中的用户ID {user_id} 不存在或已被禁用")
        except Exception as e:
            logger.warning(f"JWT令牌解析错误: {str(e)}")
            
        return None 