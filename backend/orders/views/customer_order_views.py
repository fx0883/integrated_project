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
            # 移除了status参数
            OpenApiParameter(name="payment_status", description="按支付状态筛选订单", required=False, type=str),
            OpenApiParameter(name="service_type", description="按服务类型筛选订单", required=False, type=str),
            OpenApiParameter(name="order_date_from", description="按订单日期范围筛选（起始）", required=False, type=str),
            OpenApiParameter(name="order_date_to", description="按订单日期范围筛选（结束）", required=False, type=str),
            OpenApiParameter(name="search", description="搜索订单编号、译员等信息", required=False, type=str),
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
    filterset_fields = ['payment_status', 'service_type'] # 移除了status字段
    search_fields = ['order_number', 'translator'] # 移除了description字段
    ordering_fields = ['created_at', 'order_date', 'customer_total_amount', 'payment_status'] # 更新了字段
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        获取特定客户的订单
        """
        customer_id = self.kwargs.get('customer_id')
        queryset = Order.objects.filter(customer_id=customer_id, is_deleted=False)
        
        # 按订单日期范围筛选
        order_date_from = self.request.query_params.get('order_date_from')
        order_date_to = self.request.query_params.get('order_date_to')
        if order_date_from:
            queryset = queryset.filter(order_date__gte=order_date_from)
        if order_date_to:
            queryset = queryset.filter(order_date__lte=order_date_to)
        
        return queryset
    
    def get_serializer_class(self):
        """
        根据不同的操作返回不同的序列化器
        """
        if self.action == 'retrieve':
            return OrderDetailSerializer
        return OrderListSerializer 