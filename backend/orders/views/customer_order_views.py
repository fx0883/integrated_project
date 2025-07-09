"""
客户订单视图
"""
import logging
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter

from common.permissions import IsAdmin
from orders.models import Order
from orders.serializers import OrderListSerializer, OrderDetailSerializer
from customers.models import Customer

logger = logging.getLogger(__name__)


@extend_schema_view(
    list=extend_schema(
        summary="获取客户订单列表",
        description="获取特定客户的所有订单，支持分页、排序和筛选",
        tags=["客户订单"],
        parameters=[
            OpenApiParameter(name="customer_id", description="客户ID", required=True, type=int),
            OpenApiParameter(name="status", description="按状态筛选订单", required=False, type=str),
            OpenApiParameter(name="payment_status", description="按支付状态筛选订单", required=False, type=str),
            OpenApiParameter(name="service_type", description="按服务类型筛选订单", required=False, type=str),
            OpenApiParameter(name="start_date_from", description="按开始日期范围筛选（起始）", required=False, type=str),
            OpenApiParameter(name="start_date_to", description="按开始日期范围筛选（结束）", required=False, type=str),
            OpenApiParameter(name="due_date_from", description="按截止日期范围筛选（起始）", required=False, type=str),
            OpenApiParameter(name="due_date_to", description="按截止日期范围筛选（结束）", required=False, type=str),
            OpenApiParameter(name="search", description="搜索订单编号、描述等信息", required=False, type=str),
        ]
    ),
    retrieve=extend_schema(
        summary="获取客户订单详情",
        description="获取特定客户的指定订单详情",
        tags=["客户订单"],
        parameters=[
            OpenApiParameter(name="customer_id", description="客户ID", required=True, type=int),
            OpenApiParameter(name="id", description="订单ID", required=True, type=int),
        ]
    ),
)
class CustomerOrderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    客户订单视图集
    
    提供获取特定客户的所有订单功能
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_status', 'service_type']
    search_fields = ['order_number', 'description']
    ordering_fields = ['created_at', 'due_date', 'total_amount', 'payment_status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        获取特定客户的订单
        """
        customer_id = self.kwargs.get('customer_id')
        queryset = Order.objects.filter(customer_id=customer_id, is_deleted=False)
        
        # 按开始日期范围筛选
        start_date_from = self.request.query_params.get('start_date_from')
        start_date_to = self.request.query_params.get('start_date_to')
        if start_date_from:
            queryset = queryset.filter(start_date__gte=start_date_from)
        if start_date_to:
            queryset = queryset.filter(start_date__lte=start_date_to)
        
        # 按截止日期范围筛选
        due_date_from = self.request.query_params.get('due_date_from')
        due_date_to = self.request.query_params.get('due_date_to')
        if due_date_from:
            queryset = queryset.filter(due_date__gte=due_date_from)
        if due_date_to:
            queryset = queryset.filter(due_date__lte=due_date_to)
        
        return queryset
    
    def get_serializer_class(self):
        """
        根据不同的操作返回不同的序列化器
        """
        if self.action == 'retrieve':
            return OrderDetailSerializer
        return OrderListSerializer 