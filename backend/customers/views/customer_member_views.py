"""
客户-联系人关系视图
"""
import logging
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter

from common.permissions import IsAdmin, IsSuperAdmin
from customers.models import Customer, CustomerMemberRelation
from customers.serializers import CustomerMemberRelationSerializer, CustomerMemberRelationDetailSerializer
from users.models import Member
from users.serializers import MemberSerializer
from customers.serializers import CustomerListSerializer

logger = logging.getLogger(__name__)


@extend_schema_view(
    list=extend_schema(
        summary="获取客户的联系人关系列表",
        description="获取指定客户的所有联系人关系",
        tags=["客户-联系人关系"],
        parameters=[
            OpenApiParameter(name="customer_id", description="客户ID", required=True, type=int),
        ]
    ),
    retrieve=extend_schema(
        summary="获取客户-联系人关系详情",
        description="获取指定ID的客户-联系人关系详情",
        tags=["客户-联系人关系"]
    ),
    create=extend_schema(
        summary="创建客户-联系人关系",
        description="为客户添加新的联系人关系",
        tags=["客户-联系人关系"]
    ),
    update=extend_schema(
        summary="更新客户-联系人关系",
        description="更新指定ID的客户-联系人关系",
        tags=["客户-联系人关系"]
    ),
    partial_update=extend_schema(
        summary="部分更新客户-联系人关系",
        description="部分更新指定ID的客户-联系人关系",
        tags=["客户-联系人关系"]
    ),
    destroy=extend_schema(
        summary="删除客户-联系人关系",
        description="删除指定ID的客户-联系人关系",
        tags=["客户-联系人关系"]
    ),
)
class CustomerMemberRelationViewSet(viewsets.ModelViewSet):
    """
    客户-联系人关系视图集
    
    提供客户与联系人关系的管理功能
    """
    permission_classes = [IsAdmin]
    
    def get_serializer_class(self):
        """
        根据不同的操作返回不同的序列化器
        """
        if self.action == 'list' or self.action == 'retrieve':
            return CustomerMemberRelationDetailSerializer
        return CustomerMemberRelationSerializer
    
    def get_queryset(self):
        """
        获取查询集，可以按客户ID过滤
        """
        queryset = CustomerMemberRelation.objects.all()
        
        # 如果提供了customer_id参数，则按客户ID过滤
        customer_id = self.request.query_params.get('customer_id')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        return queryset
    
    @extend_schema(
        summary="设置主要联系人",
        description="将指定的联系人设置为客户的主要联系人",
        tags=["客户-联系人关系"],
        responses={200: CustomerMemberRelationDetailSerializer()}
    )
    @action(detail=True, methods=['post'], url_path='set-primary')
    def set_primary(self, request, pk=None):
        """
        设置主要联系人
        """
        relation = self.get_object()
        relation.is_primary = True
        relation.save()  # 保存时会自动处理其他联系人的主要状态
        
        serializer = CustomerMemberRelationDetailSerializer(relation)
        return Response(serializer.data)
    
    @extend_schema(
        summary="获取客户的主要联系人",
        description="获取指定客户的主要联系人",
        tags=["客户-联系人关系"],
        parameters=[
            OpenApiParameter(name="customer_id", description="客户ID", required=True, type=int),
        ],
        responses={200: CustomerMemberRelationDetailSerializer()}
    )
    @action(detail=False, methods=['get'], url_path='primary')
    def primary(self, request):
        """
        获取客户的主要联系人
        """
        customer_id = request.query_params.get('customer_id')
        if not customer_id:
            return Response({"error": "请提供客户ID"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            relation = CustomerMemberRelation.objects.get(customer_id=customer_id, is_primary=True)
            serializer = CustomerMemberRelationDetailSerializer(relation)
            return Response(serializer.data)
        except CustomerMemberRelation.DoesNotExist:
            return Response({"error": "未找到主要联系人"}, status=status.HTTP_404_NOT_FOUND)
            
    @extend_schema(
        summary="获取客户的所有联系人",
        description="获取指定客户ID下的所有联系人列表",
        tags=["客户-联系人关系"],
        parameters=[
            OpenApiParameter(name="customer_id", description="客户ID", required=True, type=int),
        ],
        responses={200: MemberSerializer(many=True)}
    )
    @action(detail=False, methods=['get'], url_path='customer-members')
    def customer_members(self, request):
        """
        获取客户的所有联系人
        """
        customer_id = request.query_params.get('customer_id')
        if not customer_id:
            return Response({"error": "请提供客户ID"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # 获取客户
            customer = Customer.objects.get(id=customer_id)
            
            # 获取与该客户关联的所有联系人ID
            member_ids = CustomerMemberRelation.objects.filter(
                customer=customer
            ).values_list('member_id', flat=True)
            
            # 获取这些联系人的详细信息
            members = Member.objects.filter(id__in=member_ids)
            
            serializer = MemberSerializer(members, many=True)
            return Response(serializer.data)
        except Customer.DoesNotExist:
            return Response({"error": "客户不存在"}, status=status.HTTP_404_NOT_FOUND)
    
    @extend_schema(
        summary="获取联系人所属的所有客户",
        description="获取指定联系人ID所属的所有客户列表",
        tags=["客户-联系人关系"],
        parameters=[
            OpenApiParameter(name="member_id", description="联系人ID", required=True, type=int),
        ],
        responses={200: CustomerListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'], url_path='member-customers')
    def member_customers(self, request):
        """
        获取联系人所属的所有客户
        """
        member_id = request.query_params.get('member_id')
        if not member_id:
            return Response({"error": "请提供联系人ID"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # 获取联系人
            member = Member.objects.get(id=member_id)
            
            # 获取与该联系人关联的所有客户ID
            customer_ids = CustomerMemberRelation.objects.filter(
                member=member
            ).values_list('customer_id', flat=True)
            
            # 获取这些客户的详细信息
            customers = Customer.objects.filter(id__in=customer_ids)
            
            serializer = CustomerListSerializer(customers, many=True)
            return Response(serializer.data)
        except Member.DoesNotExist:
            return Response({"error": "联系人不存在"}, status=status.HTTP_404_NOT_FOUND) 