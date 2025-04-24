"""
租户相关视图
"""
import logging
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from common.permissions import IsSuperAdminUser, IsAdminUser
from tenants.models import Tenant, TenantQuota
from tenants.serializers import (
    TenantSerializer, TenantCreateSerializer, TenantDetailSerializer,
    TenantQuotaSerializer, TenantQuotaUpdateSerializer, TenantQuotaUsageSerializer
)
from django.contrib.auth import get_user_model
from users.serializers import UserListSerializer
from common.schema import api_schema, common_search_parameter, common_pagination_parameters, tenant_status_parameter
from tenants.schema import (
    tenant_list_responses, tenant_create_responses, tenant_detail_responses,
    tenant_quota_responses, tenant_quota_update_responses, tenant_quota_usage_responses,
    tenant_suspend_responses, tenant_activate_responses, tenant_users_responses,
    tenant_create_request_examples, tenant_quota_update_request_examples
)
from drf_spectacular.utils import OpenApiParameter

User = get_user_model()
logger = logging.getLogger(__name__)

class TenantListCreateView(generics.ListCreateAPIView):
    """
    租户列表和创建视图
    """
    permission_classes = [IsAuthenticated, IsSuperAdminUser]
    
    def get_serializer_class(self):
        """
        根据请求方法获取序列化器
        """
        if self.request.method == 'POST':
            return TenantCreateSerializer
        return TenantSerializer
    
    @api_schema(
        summary="获取租户列表",
        description="获取所有租户的列表，支持搜索和状态过滤，仅超级管理员可访问",
        responses=tenant_list_responses,
        parameters=[common_search_parameter, tenant_status_parameter] + common_pagination_parameters,
        tags=["租户"]
    )
    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)
    
    @api_schema(
        summary="创建新租户",
        description="创建新的租户，包括租户名称、状态和联系人信息，仅超级管理员可访问",
        request_body=TenantCreateSerializer,
        responses=tenant_create_responses,
        examples=tenant_create_request_examples,
        tags=["租户"]
    )
    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)
    
    def get_queryset(self):
        """
        获取租户列表
        超级管理员可以查看所有租户
        """
        # 查询参数
        search = self.request.query_params.get('search', '')
        status_filter = self.request.query_params.get('status', '')
        
        # 基础查询集，不包含已删除的租户
        queryset = Tenant.objects.filter(is_deleted=False)
        
        # 搜索
        if search:
            queryset = queryset.filter(
                name__icontains=search
            ) | queryset.filter(
                contact_name__icontains=search
            ) | queryset.filter(
                contact_email__icontains=search
            )
        
        # 状态过滤
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """
        创建租户
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            with transaction.atomic():
                tenant = serializer.save()
                logger.info(f"超级管理员 {request.user.username} 创建了新的租户 '{tenant.name}'")
                
                return Response({
                    'success': True,
                    'code': 2000,
                    'message': '创建租户成功',
                    'data': TenantSerializer(tenant).data
                }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            logger.exception(f"创建租户失败: {str(e)}")
            return Response({
                'success': False,
                'code': 5000,
                'message': f'创建租户失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TenantRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """
    租户详情、更新和删除视图
    """
    serializer_class = TenantDetailSerializer
    permission_classes = [IsAuthenticated, IsSuperAdminUser]
    lookup_field = 'pk'
    
    @api_schema(
        summary="获取租户详情",
        description="获取指定租户的详细信息，包括配额和用户统计，仅超级管理员可访问",
        responses=tenant_detail_responses,
        tags=["租户"]
    )
    def get(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)
    
    @api_schema(
        summary="更新租户信息",
        description="更新指定租户的信息，包括名称、状态和联系人信息，仅超级管理员可访问",
        request_body=TenantDetailSerializer,
        responses=tenant_detail_responses,
        tags=["租户"]
    )
    def put(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)
    
    @api_schema(
        summary="部分更新租户信息",
        description="部分更新指定租户的信息，仅超级管理员可访问",
        request_body=TenantDetailSerializer,
        responses=tenant_detail_responses,
        tags=["租户"]
    )
    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)
    
    @api_schema(
        summary="删除租户",
        description="软删除指定的租户（标记为已删除状态），仅超级管理员可访问",
        responses={204: None},
        tags=["租户"]
    )
    def delete(self, request, *args, **kwargs):
        return self.destroy(request, *args, **kwargs)
    
    def get_queryset(self):
        """
        获取租户查询集
        """
        return Tenant.objects.filter(is_deleted=False)
    
    def perform_destroy(self, instance):
        """
        软删除租户
        """
        instance.soft_delete()
        logger.info(f"超级管理员 {self.request.user.username} 删除了租户 '{instance.name}'")
    
    def update(self, request, *args, **kwargs):
        """
        更新租户信息
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        try:
            with transaction.atomic():
                self.perform_update(serializer)
                logger.info(f"超级管理员 {request.user.username} 更新了租户 '{instance.name}' 的信息")
                
                return Response({
                    'success': True,
                    'code': 2000,
                    'message': '更新租户成功',
                    'data': serializer.data
                })
        
        except Exception as e:
            logger.exception(f"更新租户失败: {str(e)}")
            return Response({
                'success': False,
                'code': 5000,
                'message': f'更新租户失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TenantQuotaUpdateView(APIView):
    """
    租户配额更新视图
    """
    permission_classes = [IsAuthenticated, IsSuperAdminUser]
    
    @api_schema(
        summary="获取租户配额",
        description="获取指定租户的配额信息，包括最大用户数、管理员数量和存储空间等，仅超级管理员可访问",
        responses=tenant_quota_responses,
        tags=["租户", "配额"]
    )
    def get(self, request, pk):
        """
        获取租户配额
        """
        tenant = get_object_or_404(Tenant, pk=pk, is_deleted=False)
        quota = tenant.quota
        serializer = TenantQuotaSerializer(quota)
        
        return Response({
            'success': True,
            'code': 2000,
            'message': '获取成功',
            'data': serializer.data
        })
    
    @api_schema(
        summary="更新租户配额",
        description="更新指定租户的配额设置，包括最大用户数、管理员数量和存储空间等，仅超级管理员可访问",
        request_body=TenantQuotaUpdateSerializer,
        responses=tenant_quota_update_responses,
        examples=tenant_quota_update_request_examples,
        tags=["租户", "配额"]
    )
    def put(self, request, pk):
        """
        更新租户配额
        """
        tenant = get_object_or_404(Tenant, pk=pk, is_deleted=False)
        quota = tenant.quota
        
        serializer = TenantQuotaUpdateSerializer(quota, data=request.data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    updated_quota = serializer.save()
                    logger.info(f"超级管理员 {request.user.username} 更新了租户 '{tenant.name}' 的配额设置")
                    
                    return Response({
                        'success': True,
                        'code': 2000,
                        'message': '更新配额成功',
                        'data': TenantQuotaSerializer(updated_quota).data
                    })
            except Exception as e:
                logger.exception(f"更新租户配额失败: {str(e)}")
                return Response({
                    'success': False,
                    'code': 5000,
                    'message': f'更新配额失败: {str(e)}',
                    'data': None
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'success': False,
            'code': 4000,
            'message': '参数错误',
            'data': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class TenantQuotaUsageView(APIView):
    """
    租户配额使用情况视图
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    @api_schema(
        summary="获取租户配额使用情况",
        description="获取指定租户资源配额使用情况，包括用户数量、存储空间等使用百分比，超级管理员可查看任意租户，租户管理员只能查看自己租户",
        responses=tenant_quota_usage_responses,
        tags=["租户", "配额"]
    )
    def get(self, request, pk):
        """
        获取租户配额使用情况
        """
        user = request.user
        
        try:
            # 超级管理员可以查看任何租户的配额
            if user.is_super_admin:
                tenant = get_object_or_404(Tenant, pk=pk, is_deleted=False)
            # 租户管理员只能查看自己租户的配额
            elif user.is_admin and user.tenant and user.tenant.id == pk:
                tenant = user.tenant
            else:
                return Response({
                    'success': False,
                    'code': 4003,
                    'message': '您没有权限查看此租户的配额使用情况',
                    'data': None
                }, status=status.HTTP_403_FORBIDDEN)
            
            quota = tenant.quota
            serializer = TenantQuotaUsageSerializer(quota)
            
            return Response({
                'success': True,
                'code': 2000,
                'message': '获取成功',
                'data': serializer.data
            })
        
        except Exception as e:
            logger.exception(f"获取租户配额使用情况失败: {str(e)}")
            return Response({
                'success': False,
                'code': 5000,
                'message': f'获取租户配额使用情况失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TenantSuspendView(APIView):
    """
    暂停租户视图
    """
    permission_classes = [IsAuthenticated, IsSuperAdminUser]
    
    @api_schema(
        summary="暂停租户",
        description="暂停指定租户的服务，将租户状态更改为暂停状态，仅超级管理员可访问",
        responses=tenant_suspend_responses,
        tags=["租户", "状态管理"]
    )
    def post(self, request, pk):
        """
        暂停租户
        """
        try:
            tenant = get_object_or_404(Tenant, pk=pk, is_deleted=False)
            
            if tenant.status == 'suspended':
                return Response({
                    'success': False,
                    'code': 4000,
                    'message': '租户已经处于暂停状态',
                    'data': None
                }, status=status.HTTP_400_BAD_REQUEST)
            
            with transaction.atomic():
                tenant.status = 'suspended'
                tenant.save(update_fields=['status', 'updated_at'])
                
                logger.info(f"超级管理员 {request.user.username} 暂停了租户 '{tenant.name}'")
                
                return Response({
                    'success': True,
                    'code': 2000,
                    'message': '暂停租户成功',
                    'data': {'id': tenant.id, 'name': tenant.name, 'status': tenant.status}
                })
        
        except Exception as e:
            logger.exception(f"暂停租户失败: {str(e)}")
            return Response({
                'success': False,
                'code': 5000,
                'message': f'暂停租户失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TenantActivateView(APIView):
    """
    激活租户视图
    """
    permission_classes = [IsAuthenticated, IsSuperAdminUser]
    
    @api_schema(
        summary="激活租户",
        description="激活指定的暂停租户，将租户状态更改为活跃状态，仅超级管理员可访问",
        responses=tenant_activate_responses,
        tags=["租户", "状态管理"]
    )
    def post(self, request, pk):
        """
        激活租户
        """
        try:
            tenant = get_object_or_404(Tenant, pk=pk, is_deleted=False)
            
            if tenant.status == 'active':
                return Response({
                    'success': False,
                    'code': 4000,
                    'message': '租户已经处于活跃状态',
                    'data': None
                }, status=status.HTTP_400_BAD_REQUEST)
            
            with transaction.atomic():
                tenant.status = 'active'
                tenant.save(update_fields=['status', 'updated_at'])
                
                logger.info(f"超级管理员 {request.user.username} 激活了租户 '{tenant.name}'")
                
                return Response({
                    'success': True,
                    'code': 2000,
                    'message': '激活租户成功',
                    'data': {'id': tenant.id, 'name': tenant.name, 'status': tenant.status}
                })
        
        except Exception as e:
            logger.exception(f"激活租户失败: {str(e)}")
            return Response({
                'success': False,
                'code': 5000,
                'message': f'激活租户失败: {str(e)}',
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TenantUserListView(generics.ListAPIView):
    """
    获取租户用户列表视图
    """
    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    @api_schema(
        summary="获取租户用户列表",
        description="获取指定租户的用户列表，支持按用户名、邮箱搜索和状态过滤，超级管理员可查看任意租户，租户管理员只能查看自己租户",
        responses=tenant_users_responses,
        parameters=[
            OpenApiParameter(
                name='search',
                description='搜索关键词(用户名/昵称/邮箱)',
                type=str,
                required=False
            ),
            OpenApiParameter(
                name='is_admin',
                description='是否只显示管理员用户',
                type=bool,
                required=False
            ),
            OpenApiParameter(
                name='status',
                description='用户状态(active/suspended/inactive)',
                type=str,
                required=False
            )
        ] + common_pagination_parameters,
        tags=["租户", "用户管理"]
    )
    def get_queryset(self):
        """
        获取租户用户列表
        """
        user = self.request.user
        tenant_id = self.kwargs.get('pk')
        
        # 获取查询参数
        search = self.request.query_params.get('search', '')
        is_admin = self.request.query_params.get('is_admin', '').lower() == 'true'
        status_filter = self.request.query_params.get('status', '')
        
        # 超级管理员可以查看任何租户的用户
        if user.is_super_admin:
            tenant = get_object_or_404(Tenant, pk=tenant_id, is_deleted=False)
        # 租户管理员只能查看自己租户的用户
        elif user.is_admin and user.tenant and str(user.tenant.id) == str(tenant_id):
            tenant = user.tenant
        else:
            # 无权限的情况返回空查询集
            logger.warning(f"用户 {user.username} 尝试查看无权限的租户 {tenant_id} 用户列表")
            return User.objects.none()
        
        # 基础查询集，获取指定租户的用户
        queryset = User.objects.filter(tenant=tenant, is_deleted=False)
        
        # 搜索
        if search:
            queryset = queryset.filter(
                username__icontains=search
            ) | queryset.filter(
                email__icontains=search
            ) | queryset.filter(
                nick_name__icontains=search
            )
        
        # 管理员过滤
        if is_admin:
            queryset = queryset.filter(is_admin=True)
        
        # 状态过滤
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """
        重写列表方法，使用标准响应格式
        """
        queryset = self.filter_queryset(self.get_queryset())
        
        if not queryset.exists():
            # 如果查询集为空，则可能是无权限或没有符合条件的用户
            if self.request.user.is_super_admin or (self.request.user.is_admin and self.request.user.tenant):
                # 返回空列表但不使用自定义响应格式
                return Response({
                    'count': 0,
                    'results': []
                })
            else:
                # 无权限访问，返回权限错误但不使用自定义响应格式
                return Response(
                    {"detail": "无权查看此租户的用户列表"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        # 返回标准响应，让中间件处理格式化
        return Response({
            'count': queryset.count(),
            'results': serializer.data
        })