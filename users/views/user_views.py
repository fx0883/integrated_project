"""
用户相关视图
"""
import logging
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from rest_framework.pagination import PageNumberPagination

from common.permissions import IsAdmin, IsSuperAdmin
from users.models import User
from users.serializers import (
    UserSerializer, 
    UserCreateSerializer, 
    ChangePasswordSerializer,
    SuperAdminCreateSerializer,
    UserRoleSerializer
)
from tenants.models import Tenant

logger = logging.getLogger(__name__)

class CurrentUserView(APIView):
    """
    获取当前登录用户信息
    """
    def get(self, request, *args, **kwargs):
        # 使用自定义序列化器返回详细用户信息
        serializer = UserSerializer(request.user)
        logger.info(f"用户 {request.user.username} 获取了自己的信息")
        return Response(serializer.data)

class UserListCreateView(generics.ListCreateAPIView):
    """
    用户列表和创建视图
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = UserSerializer
    pagination_class = PageNumberPagination
    
    def get_serializer_class(self):
        # 创建用户时使用创建序列化器
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer
    
    def get_queryset(self):
        """
        获取查询集，支持过滤
        """
        user = self.request.user
        
        # 超级管理员可以看到所有用户
        if user.is_super_admin:
            queryset = User.objects.filter(is_deleted=False)
        # 租户管理员只能看到自己租户的用户
        elif user.is_admin and user.tenant:
            queryset = User.objects.filter(tenant=user.tenant, is_deleted=False)
        # 普通用户只能看到自己
        else:
            queryset = User.objects.filter(pk=user.pk, is_deleted=False)
        
        # 搜索条件
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) | 
                Q(email__icontains=search) | 
                Q(nick_name__icontains=search) |
                Q(phone__icontains=search)
            )
        
        # 状态过滤
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # 角色过滤
        is_admin = self.request.query_params.get('is_admin', None)
        if is_admin is not None:
            is_admin = is_admin.lower() == 'true'
            queryset = queryset.filter(is_admin=is_admin)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        创建用户
        """
        user = self.request.user
        
        # 设置租户
        tenant = None
        if not user.is_super_admin:
            tenant = user.tenant
        
        # 如果传入了tenant_id参数并且是超级管理员
        tenant_id = self.request.data.get('tenant_id')
        if tenant_id and user.is_super_admin:
            tenant = get_object_or_404(Tenant, pk=tenant_id)
        
        logger.info(f"用户 {user.username} 创建新用户，租户设置为: {tenant.name if tenant else '无租户'}")
        serializer.save(tenant=tenant)

class UserRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """
    用户详情、更新和删除视图
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        获取查询集
        """
        user = self.request.user
        
        # 超级管理员可以操作所有用户
        if user.is_super_admin:
            return User.objects.filter(is_deleted=False)
        
        # 租户管理员只能操作自己租户的用户
        if user.is_admin and user.tenant:
            return User.objects.filter(tenant=user.tenant, is_deleted=False)
        
        # 普通用户只能操作自己
        return User.objects.filter(pk=user.pk, is_deleted=False)
    
    def destroy(self, request, *args, **kwargs):
        """
        删除用户（软删除）
        """
        instance = self.get_object()
        
        # 不能删除自己
        if instance.pk == request.user.pk:
            return Response(
                {"detail": "不能删除当前登录的用户账号"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 软删除
        instance.soft_delete()
        logger.info(f"用户 {request.user.username} 删除了用户 {instance.username}")
        
        return Response(status=status.HTTP_204_NO_CONTENT)

class ChangePasswordView(generics.UpdateAPIView):
    """
    修改密码视图
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            # 检查旧密码
            if not user.check_password(serializer.data.get('old_password')):
                return Response(
                    {"old_password": ["旧密码不正确"]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 设置新密码
            user.set_password(serializer.data.get('new_password'))
            user.save()
            logger.info(f"用户 {user.username} 修改了密码")
            
            return Response(
                {"detail": "密码修改成功"},
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SuperAdminCreateView(generics.CreateAPIView):
    """
    创建超级管理员账号视图
    """
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    serializer_class = SuperAdminCreateSerializer
    
    def perform_create(self, serializer):
        # 设置为超级管理员
        user = serializer.save(is_super_admin=True, is_admin=True, is_staff=True)
        logger.info(f"超级管理员 {self.request.user.username} 创建了新的超级管理员账号 {user.username}")

class GrantSuperAdminView(APIView):
    """
    授予超级管理员权限视图
    """
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    
    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        
        # 已经是超级管理员
        if user.is_super_admin:
            return Response(
                {"detail": "该用户已经是超级管理员"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 授予权限
        user.is_super_admin = True
        user.is_admin = True
        user.is_staff = True
        user.tenant = None  # 超级管理员不属于任何租户
        user.save()
        
        logger.info(f"超级管理员 {request.user.username} 将用户 {user.username} 提升为超级管理员")
        return Response(
            {"detail": f"已将用户 {user.username} 提升为超级管理员"},
            status=status.HTTP_200_OK
        )

class RevokeSuperAdminView(APIView):
    """
    撤销超级管理员权限视图
    """
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    
    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        
        # 不是超级管理员
        if not user.is_super_admin:
            return Response(
                {"detail": "该用户不是超级管理员"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 不能撤销自己的超级管理员权限
        if user.pk == request.user.pk:
            return Response(
                {"detail": "不能撤销自己的超级管理员权限"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 撤销权限
        user.is_super_admin = False
        user.is_staff = False
        user.save()
        
        logger.info(f"超级管理员 {request.user.username} 撤销了用户 {user.username} 的超级管理员权限")
        return Response(
            {"detail": f"已撤销用户 {user.username} 的超级管理员权限"},
            status=status.HTTP_200_OK
        )

class UserRoleUpdateView(APIView):
    """
    更新用户角色视图
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    
    def post(self, request, pk):
        # 获取用户
        user = self.request.user
        target_user = get_object_or_404(User, pk=pk)
        
        # 管理员权限检查
        if not user.is_super_admin and user.tenant != target_user.tenant:
            raise PermissionDenied("无权限更改其他租户的用户角色")
        
        # 不能修改超级管理员的角色
        if target_user.is_super_admin:
            return Response(
                {"detail": "不能修改超级管理员的角色"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 序列化处理
        serializer = UserRoleSerializer(target_user, data=request.data)
        if serializer.is_valid():
            serializer.save()
            logger.info(f"用户 {user.username} 更新了用户 {target_user.username} 的角色")
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TenantUserListView(generics.ListAPIView):
    """
    租户用户列表视图
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    pagination_class = PageNumberPagination
    
    def get_queryset(self):
        """
        获取查询集
        """
        user = self.request.user
        tenant_id = self.kwargs.get('tenant_id')
        
        # 获取租户
        tenant = get_object_or_404(Tenant, pk=tenant_id)
        
        # 超级管理员可以查看任何租户的用户
        if user.is_super_admin:
            return User.objects.filter(tenant=tenant, is_deleted=False)
        
        # 非超级管理员只能查看自己租户的用户
        if user.tenant and user.tenant.pk == tenant.pk and user.is_admin:
            return User.objects.filter(tenant=tenant, is_deleted=False)
        
        # 其他情况无权限
        raise PermissionDenied("无权限查看其他租户的用户列表") 