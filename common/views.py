from django.shortcuts import render
import logging
from django.db.models import Q
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from common.permissions import IsSuperAdminUser, IsAdminUser
from common.models import APILog
from common.serializers import APILogSerializer, APILogDetailSerializer

logger = logging.getLogger(__name__)

class APILogListView(generics.ListAPIView):
    """
    API日志列表视图
    超级管理员可查看所有日志，租户管理员只能查看自己租户的日志
    """
    serializer_class = APILogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    @extend_schema(
        parameters=[
            {
                'name': 'search',
                'type': 'string',
                'description': '搜索关键词(路径/用户名)'
            },
            {
                'name': 'start_date',
                'type': 'string',
                'format': 'date',
                'description': '开始日期 (YYYY-MM-DD)'
            },
            {
                'name': 'end_date',
                'type': 'string',
                'format': 'date',
                'description': '结束日期 (YYYY-MM-DD)'
            },
            {
                'name': 'status_type',
                'type': 'string',
                'description': '状态类型 (success/error)'
            },
            {
                'name': 'request_method',
                'type': 'string',
                'description': '请求方法 (GET/POST/PUT/DELETE)'
            },
            {
                'name': 'tenant_id',
                'type': 'integer',
                'description': '租户ID'
            }
        ],
        responses={200: APILogSerializer(many=True)},
        description="获取API日志列表，支持多种筛选条件",
        summary="获取API日志列表",
        tags=["系统", "日志"]
    )
    def get_queryset(self):
        """
        获取API日志查询集
        """
        user = self.request.user
        
        # 基础查询集
        if user.is_super_admin:
            # 超级管理员可查看所有日志
            queryset = APILog.objects.all()
        else:
            # 租户管理员只能查看自己租户的日志
            if user.tenant:
                queryset = APILog.objects.filter(tenant=user.tenant)
            else:
                # 如果用户没有关联租户，只能查看自己的日志
                queryset = APILog.objects.filter(user=user)
        
        # 应用过滤条件
        queryset = self._apply_filters(queryset)
        
        return queryset
    
    def _apply_filters(self, queryset):
        """
        应用过滤条件
        
        Args:
            queryset: 初始查询集
        
        Returns:
            过滤后的查询集
        """
        params = self.request.query_params
        
        # 搜索过滤
        search = params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(request_path__icontains=search) |
                Q(user__username__icontains=search)
            )
        
        # 日期范围过滤
        start_date = params.get('start_date')
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        
        end_date = params.get('end_date')
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
        
        # 状态类型过滤
        status_type = params.get('status_type')
        if status_type:
            queryset = queryset.filter(status_type=status_type)
        
        # 请求方法过滤
        request_method = params.get('request_method')
        if request_method:
            queryset = queryset.filter(request_method=request_method)
        
        # 租户过滤 (仅超级管理员可用)
        if self.request.user.is_super_admin:
            tenant_id = params.get('tenant_id')
            if tenant_id:
                queryset = queryset.filter(tenant_id=tenant_id)
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """
        重写列表方法，自定义响应格式
        """
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'code': 2000,
            'message': '获取成功',
            'data': {
                'count': queryset.count(),
                'results': serializer.data
            }
        })


class APILogDetailView(generics.RetrieveAPIView):
    """
    API日志详情视图
    """
    serializer_class = APILogDetailSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    lookup_field = 'pk'
    
    @extend_schema(
        responses={200: APILogDetailSerializer()},
        description="获取API日志详情",
        summary="获取API日志详情",
        tags=["系统", "日志"]
    )
    def get_queryset(self):
        """
        获取API日志查询集
        """
        user = self.request.user
        
        # 基础查询集
        if user.is_super_admin:
            # 超级管理员可查看所有日志
            return APILog.objects.all()
        
        # 租户管理员只能查看自己租户的日志
        if user.tenant:
            return APILog.objects.filter(tenant=user.tenant)
        
        # 如果用户没有关联租户，只能查看自己的日志
        return APILog.objects.filter(user=user)
    
    def retrieve(self, request, *args, **kwargs):
        """
        重写查询方法，自定义响应格式
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        return Response({
            'success': True,
            'code': 2000,
            'message': '获取成功',
            'data': serializer.data
        })
