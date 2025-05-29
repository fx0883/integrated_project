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
from users.serializers import (
    LoginSerializer, TokenRefreshSerializer, RegisterSerializer,
    ChangePasswordSerializer
)
from users.schema import (
    login_responses, login_request_examples, login_response_examples,
    token_refresh_responses, token_refresh_request_examples, token_refresh_response_examples,
    token_verify_responses, token_verify_response_examples,
    register_responses, register_request_examples, register_response_examples
)
from common.schema import api_schema
from rest_framework import generics
from rest_framework import permissions
from rest_framework import serializers
from drf_spectacular.utils import OpenApiResponse, OpenApiExample
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from users.models import User

logger = logging.getLogger(__name__)

class RegisterView(APIView):
    """
    用户注册视图
    """
    permission_classes = [AllowAny]
    
    @extend_schema(
        summary="用户注册",
        description="新用户注册接口，可选关联到指定租户",
        request=RegisterSerializer,
        responses=register_responses,
        examples=register_request_examples + register_response_examples,
        tags=["认证"]
    )
    def post(self, request):
        """
        处理用户注册请求
        """
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            # 创建用户
            user = serializer.save()
            
            # 生成JWT令牌
            tokens = generate_jwt_token(user)
            token = tokens['access_token']
            refresh_token = tokens['refresh_token']
            
            # 记录IP
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
                'is_member': user.is_member,
                'avatar': user.avatar or '',
            }
            
            # 添加租户信息
            if user.tenant:
                user_data['tenant_id'] = user.tenant.id
                user_data['tenant_name'] = user.tenant.name
            
            # 记录注册成功
            logger.info(f"新用户 {user.username} 注册成功, IP: {ip}")
            
            return Response({
                'success': True,
                'code': 2000,
                'message': '注册成功',
                'data': {
                    'token': token,
                    'refresh_token': refresh_token,
                    'user': user_data
                }
            }, status=status.HTTP_201_CREATED)
        
        # 记录注册失败
        logger.warning(f"用户注册失败: {serializer.errors}, IP: {self.get_client_ip(request)}")
        
        return Response({
            'success': False,
            'code': 4000,
            'message': '注册失败',
            'data': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
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


class LoginView(APIView):
    """
    用户登录视图
    """
    permission_classes = [AllowAny]
    
    @extend_schema(
        summary="用户登录",
        description="用户登录接口，验证用户名和密码，返回JWT令牌",
        request=LoginSerializer,
        responses=login_responses,
        examples=login_request_examples + login_response_examples,
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
        summary="刷新访问令牌",
        description="使用刷新令牌获取新的访问令牌和刷新令牌",
        request=TokenRefreshSerializer,
        responses=token_refresh_responses,
        examples=token_refresh_request_examples + token_refresh_response_examples,
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
                'code': 4000,
                'message': '无效的刷新令牌',
                'data': None
            }, status=status.HTTP_400_BAD_REQUEST)


class TokenVerifyView(APIView):
    """
    验证Token视图
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="验证访问令牌",
        description="验证当前令牌是否有效，返回用户信息",
        responses=token_verify_responses,
        examples=token_verify_response_examples,
        tags=["认证"]
    )
    def get(self, request):
        """
        验证当前令牌是否有效
        如果请求能到达这里，说明令牌有效，因为已经通过了认证中间件
        """
        user = request.user
        
        # 构建用户信息
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'nick_name': user.nick_name or '',
            'is_admin': user.is_admin,
            'is_super_admin': user.is_super_admin
        }
        
        # 添加租户信息
        if user.tenant:
            user_data['tenant_id'] = user.tenant.id
            user_data['tenant_name'] = user.tenant.name
        
        logger.info(f"用户 {user.username} 验证令牌成功")
        
        return Response({
            'success': True,
            'code': 2000,
            'message': '令牌有效',
            'data': {
                'is_valid': True,
                'user': user_data
            }
        })


class ChangePasswordView(generics.UpdateAPIView):
    """
    修改密码视图
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    @extend_schema(
        summary="修改用户密码",
        description="允许已认证用户修改自己的密码，需要提供旧密码和新密码",
        responses={
            200: OpenApiResponse(
                description="密码修改成功",
                examples=[
                    OpenApiExample(
                        name="密码修改成功示例",
                        value={
                            "success": True,
                            "code": 2000,
                            "message": "密码修改成功",
                            "data": {
                                "detail": "密码修改成功"
                            }
                        }
                    )
                ]
            ),
            400: OpenApiResponse(
                description="请求数据无效或旧密码不正确",
                examples=[
                    OpenApiExample(
                        name="密码修改成功示例",
                        value={
                            "success": True,
                            "code": 2000,
                            "message": "密码修改成功",
                            "data": {
                                "detail": "密码修改成功"
                            }
                        }
                    )
                ]
            ),
        },
        tags=["认证"]
    )
    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            # 设置新密码
            user.set_password(serializer.validated_data.get('new_password'))
            user.save()
            logger.info(f"用户 {user.username} 修改了密码")
            
            return Response(
                {"detail": "密码修改成功"},
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # 去掉 put 方法的 DRF 注解
    def put(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)
    
    # 去掉 patch 方法的 DRF 注解
    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)
    
    # 去掉 post 方法的 DRF 注解
    def post(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

# 管理员修改用户密码的序列化器
class AdminChangePasswordSerializer(serializers.Serializer):
    """
    管理员修改用户密码的序列化器
    """
    new_password = serializers.CharField(required=True, write_only=True)
    confirm_password = serializers.CharField(required=True, write_only=True)
    
    def validate(self, data):
        """
        验证两次输入的密码是否一致
        """
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "两次输入的密码不一致"})
        
        # 验证新密码强度
        from django.contrib.auth.password_validation import validate_password
        validate_password(data['new_password'])
        
        return data

# 管理员修改用户密码视图
class AdminChangePasswordView(generics.UpdateAPIView):
    """
    管理员修改用户密码视图
    """
    serializer_class = AdminChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        user_id = self.kwargs.get('user_id')
        user = get_object_or_404(User, id=user_id)
        return user
    
    def check_permissions(self, request):
        """
        检查当前用户是否有权限修改指定用户密码
        """
        super().check_permissions(request)
        if not (request.user.is_admin or request.user.is_super_admin):
            raise PermissionDenied("只有管理员才能修改其他用户的密码")
    
    @extend_schema(
        summary="管理员修改用户密码",
        description="允许租户管理员或超级管理员修改其他用户的密码",
        responses={
            200: OpenApiResponse(
                description="密码修改成功",
                examples=[
                    OpenApiExample(
                        name="管理员修改密码成功示例",
                        value={
                            "success": True,
                            "code": 2000,
                            "message": "密码修改成功",
                            "data": {
                                "detail": "密码修改成功"
                            }
                        }
                    )
                ]
            ),
            400: OpenApiResponse(
                description="请求数据无效",
                examples=[
                    OpenApiExample(
                        name="数据验证失败示例",
                        value={
                            "success": False,
                            "code": 4000,
                            "message": "请求数据无效",
                            "data": {
                                "confirm_password": ["两次输入的密码不一致"]
                            }
                        }
                    )
                ]
            ),
            403: OpenApiResponse(
                description="权限不足",
                examples=[
                    OpenApiExample(
                        name="权限不足示例",
                        value={
                            "success": False,
                            "code": 4003,
                            "message": "权限不足",
                            "data": {
                                "detail": "只有管理员才能修改其他用户的密码"
                            }
                        }
                    )
                ]
            ),
            404: OpenApiResponse(
                description="用户不存在",
                examples=[
                    OpenApiExample(
                        name="用户不存在示例",
                        value={
                            "success": False,
                            "code": 4004,
                            "message": "用户不存在",
                            "data": {
                                "detail": "未找到指定用户"
                            }
                        }
                    )
                ]
            )
        },
        tags=["认证"]
    )
    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            # 设置新密码
            user.set_password(serializer.validated_data.get('new_password'))
            user.save()
            logger.info(f"管理员 {request.user.username} 修改了用户 {user.username} 的密码")
            
            return Response({
                'success': True,
                'code': 2000,
                'message': '密码修改成功',
                'data': {
                    "detail": "密码修改成功"
                }
            }, status=status.HTTP_200_OK)
        
        return Response({
            'success': False,
            'code': 4000,
            'message': '请求数据无效',
            'data': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)
    
    def patch(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)
    
    def post(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs) 