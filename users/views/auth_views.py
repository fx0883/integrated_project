"""
认证相关视图
"""
import logging
import jwt
from django.conf import settings
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from drf_spectacular.utils import extend_schema
from common.authentication.jwt_auth import generate_jwt_token, refresh_jwt_token
from users.serializers import LoginSerializer, TokenRefreshSerializer

logger = logging.getLogger(__name__)

class LoginView(APIView):
    """
    用户登录视图
    """
    permission_classes = [AllowAny]
    
    @extend_schema(
        request=LoginSerializer,
        responses={200: {"type": "object", "properties": {
            "success": {"type": "boolean"},
            "code": {"type": "integer"},
            "message": {"type": "string"},
            "data": {"type": "object", "properties": {
                "token": {"type": "string"},
                "refresh_token": {"type": "string"},
                "user": {"type": "object"}
            }}
        }}},
        description="用户登录接口",
        summary="用户登录",
        tags=["认证"]
    )
    def post(self, request):
        """
        处理用户登录请求
        """
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # 生成JWT令牌
            tokens = generate_jwt_token(user)
            token = tokens['access_token']
            refresh_token = tokens['refresh_token']
            
            # 记录IP和更新登录时间
            ip = self.get_client_ip(request)
            user.last_login_ip = ip
            user.save(update_fields=['last_login_ip', 'last_login'])
            
            # 构建用户信息
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'nick_name': user.nick_name or '',
                'is_admin': user.is_admin,
                'is_super_admin': user.is_super_admin,
                'avatar': user.avatar or '',
            }
            
            # 添加租户信息
            if user.tenant:
                user_data['tenant_id'] = user.tenant.id
                user_data['tenant_name'] = user.tenant.name
            
            # 记录登录成功
            logger.info(f"用户 {user.username} 登录成功, IP: {ip}")
            
            return Response({
                'success': True,
                'code': 2000,
                'message': '登录成功',
                'data': {
                    'token': token,
                    'refresh_token': refresh_token,
                    'user': user_data
                }
            })
        
        # 记录登录失败
        logger.warning(f"登录失败: {serializer.errors}, IP: {self.get_client_ip(request)}")
        
        return Response({
            'success': False,
            'code': 4002,
            'message': '用户名或密码错误',
            'data': None
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    def get_client_ip(self, request):
        """
        获取客户端IP地址
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class TokenRefreshView(APIView):
    """
    刷新Token视图
    """
    permission_classes = [AllowAny]
    
    @extend_schema(
        request=TokenRefreshSerializer,
        responses={200: {"type": "object", "properties": {
            "success": {"type": "boolean"},
            "code": {"type": "integer"},
            "message": {"type": "string"},
            "data": {"type": "object", "properties": {
                "token": {"type": "string"},
                "refresh_token": {"type": "string"}
            }}
        }}},
        description="刷新访问令牌",
        summary="刷新令牌",
        tags=["认证"]
    )
    def post(self, request):
        """
        处理刷新Token请求
        """
        serializer = TokenRefreshSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'code': 4000,
                'message': '无效的刷新令牌',
                'data': None
            }, status=status.HTTP_400_BAD_REQUEST)
        
        refresh_token = serializer.validated_data['refresh_token']
        
        try:
            # 解析刷新令牌
            payload = jwt.decode(
                refresh_token,
                settings.JWT_AUTH['JWT_SECRET_KEY'],
                algorithms=[settings.JWT_AUTH['JWT_ALGORITHM']]
            )
            
            # 确认是刷新令牌
            if payload.get('token_type') != 'refresh':
                raise jwt.InvalidTokenError('令牌类型错误')
            
            # 获取用户
            from users.models import User
            user_id = payload.get('user_id')
            if not user_id:
                raise jwt.InvalidTokenError('令牌中缺少用户ID')
            
            user = User.objects.get(id=user_id)
            
            # 检查用户状态
            if not user.is_active:
                return Response({
                    'success': False,
                    'code': 4003,
                    'message': '用户已被禁用',
                    'data': None
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 生成新令牌
            tokens = generate_jwt_token(user)
            token = tokens['access_token']
            new_refresh_token = tokens['refresh_token']
            
            logger.info(f"用户 {user.username} 刷新令牌成功")
            
            return Response({
                'success': True,
                'code': 2000,
                'message': '令牌刷新成功',
                'data': {
                    'token': token,
                    'refresh_token': new_refresh_token
                }
            })
            
        except jwt.ExpiredSignatureError:
            return Response({
                'success': False,
                'code': 4001,
                'message': '刷新令牌已过期',
                'data': None
            }, status=status.HTTP_401_UNAUTHORIZED)
            
        except (jwt.InvalidTokenError, User.DoesNotExist) as e:
            logger.warning(f"刷新令牌失败: {str(e)}")
            return Response({
                'success': False,
                'code': 4001,
                'message': '无效的刷新令牌',
                'data': None
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        except Exception as e:
            logger.exception(f"刷新令牌时发生异常: {str(e)}")
            return Response({
                'success': False,
                'code': 5000,
                'message': '服务器错误',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TokenVerifyView(APIView):
    """
    验证Token视图
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={200: {"type": "object", "properties": {
            "success": {"type": "boolean"},
            "code": {"type": "integer"},
            "message": {"type": "string"},
            "data": {"type": "object", "properties": {
                "is_valid": {"type": "boolean"},
                "user": {"type": "object"}
            }}
        }}},
        description="验证当前令牌是否有效",
        summary="验证令牌",
        tags=["认证"]
    )
    def get(self, request):
        """
        验证当前令牌是否有效
        """
        user = request.user
        
        # 构建用户信息
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'nick_name': user.nick_name or '',
            'is_admin': user.is_admin,
            'is_super_admin': user.is_super_admin,
            'avatar': user.avatar or '',
        }
        
        # 添加租户信息
        if user.tenant:
            user_data['tenant_id'] = user.tenant.id
            user_data['tenant_name'] = user.tenant.name
        
        return Response({
            'success': True,
            'code': 2000,
            'message': '令牌有效',
            'data': {
                'is_valid': True,
                'user': user_data
            }
        }) 