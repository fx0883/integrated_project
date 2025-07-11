"""
订单视图
"""
import logging
import pandas as pd
from datetime import datetime, timedelta
from django.db.models import Q, Sum, F, ExpressionWrapper, DecimalField, Count
from django.http import HttpResponse
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
import io

from common.permissions import IsAdmin
from orders.models import Order
from orders.serializers import (
    OrderSerializer, OrderCreateSerializer, OrderUpdateSerializer,
    OrderListSerializer, OrderDetailSerializer, OrderStatisticsSerializer
)

logger = logging.getLogger(__name__)


@extend_schema_view(
    list=extend_schema(
        summary="获取订单列表",
        description="获取系统中的所有订单，支持分页、排序和筛选",
        tags=["订单管理"],
        parameters=[
            OpenApiParameter(name="payment_status", description="按支付状态筛选订单", required=False, type=str),
            OpenApiParameter(name="service_type", description="按服务类型筛选订单", required=False, type=str),
            OpenApiParameter(name="language", description="按语种筛选订单", required=False, type=str),
            OpenApiParameter(name="customer_id", description="按客户ID筛选订单", required=False, type=int),
            OpenApiParameter(name="customer_type", description="按客户类型筛选订单", required=False, type=str),
            OpenApiParameter(name="service_time", description="按服务时间筛选订单", required=False, type=str),
            OpenApiParameter(name="search", description="搜索订单编号、客户名称等信息", required=False, type=str),
        ]
    ),
    retrieve=extend_schema(
        summary="获取单个订单",
        description="获取指定ID的订单详情",
        tags=["订单管理"]
    ),
    create=extend_schema(
        summary="创建订单",
        description="创建新的订单记录",
        tags=["订单管理"]
    ),
    update=extend_schema(
        summary="更新订单",
        description="更新指定ID的订单信息",
        tags=["订单管理"]
    ),
    partial_update=extend_schema(
        summary="部分更新订单",
        description="部分更新指定ID的订单信息",
        tags=["订单管理"]
    ),
    destroy=extend_schema(
        summary="删除订单",
        description="删除指定ID的订单（软删除）",
        tags=["订单管理"]
    ),
)
class OrderViewSet(viewsets.ModelViewSet):
    """
    订单管理视图集
    
    提供订单的增删改查、搜索、筛选、导出等功能
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['payment_status', 'service_type', 'language', 'customer', 'customer_type']
    search_fields = ['order_number', 'customer__name', 'translator', 'project_details']
    ordering_fields = ['created_at', 'order_date', 'customer_total_amount', 'payment_status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """
        根据不同的操作返回不同的序列化器
        """
        if self.action == 'list':
            return OrderListSerializer
        elif self.action == 'retrieve':
            return OrderDetailSerializer
        elif self.action == 'create':
            return OrderCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return OrderUpdateSerializer
        elif self.action == 'statistics':
            return OrderStatisticsSerializer
        return OrderSerializer
    
    def get_queryset(self):
        """
        获取订单查询集，默认不返回已删除的订单
        """
        queryset = Order.objects.all()
        
        # 默认不显示已删除订单，除非明确要求
        show_deleted = self.request.query_params.get('show_deleted', 'false').lower() == 'true'
        if not show_deleted:
            queryset = queryset.filter(is_deleted=False)
        
        # 按客户ID筛选
        customer_id = self.request.query_params.get('customer_id')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        # 按服务时间筛选
        service_time = self.request.query_params.get('service_time')
        if service_time:
            queryset = queryset.filter(service_time__icontains=service_time)
        
        # 按下单日期范围筛选
        order_date_from = self.request.query_params.get('order_date_from')
        order_date_to = self.request.query_params.get('order_date_to')
        if order_date_from:
            queryset = queryset.filter(order_date__gte=order_date_from)
        if order_date_to:
            queryset = queryset.filter(order_date__lte=order_date_to)
        
        return queryset
    
    def perform_destroy(self, instance):
        """
        执行软删除
        """
        instance.soft_delete()
    
    @extend_schema(
        summary="导出订单数据",
        description="导出订单数据为Excel文件",
        tags=["订单管理"],
        parameters=[
            OpenApiParameter(name="format", description="导出格式，支持 xlsx, csv", required=False, type=str, default="xlsx"),
        ]
    )
    @action(detail=False, methods=['get'])
    def export(self, request):
        """
        导出订单数据
        """
        # 获取过滤后的查询集
        queryset = self.filter_queryset(self.get_queryset())
        
        # 准备导出数据
        data = []
        for order in queryset:
            data.append({
                '订单编号': order.order_number,
                '客户': order.customer.name,
                '客户类型': order.customer_type or '',
                '来源平台': order.source_platform or '',
                '项目负责人': order.project_manager or '',
                '下单日期': order.order_date,
                '服务类型': order.service_type,
                '语种': order.language,
                '客户数量': order.customer_count or '',
                '翻译数量': order.translation_count or '',
                '服务时间': order.service_time or '',
                '项目地点': order.project_location or '',
                '客户联系人': order.customer_contact.name if order.customer_contact else '',
                '客户单价': order.customer_price or '',
                '客户总价': float(order.customer_total_amount),
                '译员': order.translator or '',
                '译员费用': float(order.translator_fee),
                '翻译单价': order.translator_price or '',
                '译费支付状态': order.translator_payment_status or '',
                '译费支付方式': order.translator_payment_method or '',
                '项目费用': float(order.project_fee),
                '项目明细': order.project_details or '',
                '费用明细': order.cost_details or '',
                '项目退款': float(order.refund_amount),
                '退款原因': order.refund_reason or '',
                '毛利': float(order.calculate_profit()),
                '毛利率': f"{order.calculate_profit_rate():.2%}",
                '支付状态': order.payment_status,
                '支付日期': order.payment_date,
                '支付方式': order.payment_method or '',
                '支付备注': order.payment_remarks or '',
                '发票状态': order.invoice_status,
                '发票信息': order.invoice_info or '',
                '合同编号': order.contract_number or '',
                '合同信息': order.contract_info or '',
                '合同备注': order.contract_remarks or '',
                '收件地址': order.delivery_address or '',
                '下单地址': order.order_address or '',
                '备注': order.remarks or '',
                '回访记录': order.follow_up_record or '',
                '创建时间': order.created_at,
                '更新时间': order.updated_at,
            })
        
        # 创建DataFrame
        df = pd.DataFrame(data)
        
        # 确定导出格式
        export_format = request.query_params.get('format', 'xlsx').lower()
        
        # 导出文件
        if export_format == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="orders.csv"'
            df.to_csv(response, index=False, encoding='utf-8-sig')
        else:  # xlsx 或其他格式默认为 xlsx
            response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = 'attachment; filename="orders.xlsx"'
            df.to_excel(response, index=False, engine='openpyxl')
        
        return response
    
    @extend_schema(
        summary="导入订单数据",
        description="从Excel文件导入订单数据",
        tags=["订单管理"],
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'file': {'type': 'string', 'format': 'binary'},
                    'update_existing': {'type': 'boolean', 'default': False}
                },
                'required': ['file']
            }
        },
        responses={200: {
            'type': 'object',
            'properties': {
                'status': {'type': 'string'},
                'total_records': {'type': 'integer'},
                'created': {'type': 'integer'},
                'updated': {'type': 'integer'},
                'failed': {'type': 'integer'},
                'errors': {'type': 'array', 'items': {'type': 'string'}}
            }
        }}
    )
    @action(detail=False, methods=['post'])
    def import_data(self, request):
        """
        导入订单数据
        """
        # 检查是否上传了文件
        if 'file' not in request.FILES:
            return Response(
                {"error": "未提供文件"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        file = request.FILES['file']
        update_existing = request.data.get('update_existing', 'false').lower() == 'true'
        
        # 检查文件类型
        if not file.name.endswith(('.xlsx', '.xls')):
            return Response(
                {"error": "仅支持Excel文件(.xlsx, .xls)"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # 读取Excel文件
            df = pd.read_excel(file)
            
            # 统计结果
            total_records = len(df)
            created_count = 0
            updated_count = 0
            failed_count = 0
            errors = []
            
            # 处理每一行数据
            for index, row in df.iterrows():
                try:
                    # 准备订单数据
                    order_data = {
                        'customer': row.get('客户ID'),
                        'service_type': row.get('服务类型'),
                        'language_direction': row.get('语言方向'),
                        'word_count': row.get('字数'),
                        'price': row.get('单价'),
                        'description': row.get('描述', ''),
                        'translator': row.get('译员', ''),
                        'start_date': row.get('开始日期'),
                        'due_date': row.get('截止日期'),
                        'status': row.get('状态', 'draft')
                    }
                    
                    # 检查必填字段
                    if not all([order_data['customer'], order_data['service_type'], 
                              order_data['language_direction'], order_data['word_count']]):
                        errors.append(f"第{index+1}行: 缺少必填字段")
                        failed_count += 1
                        continue
                    
                    # 检查是否有订单编号（用于更新）
                    order_number = row.get('订单编号')
                    
                    if order_number and update_existing:
                        # 尝试更新现有订单
                        try:
                            order = Order.objects.get(order_number=order_number)
                            for key, value in order_data.items():
                                if pd.notna(value):  # 只更新非空值
                                    setattr(order, key, value)
                            order.save()
                            updated_count += 1
                        except Order.DoesNotExist:
                            # 如果订单不存在，创建新订单
                            serializer = OrderCreateSerializer(
                                data=order_data,
                                context={'request': request}
                            )
                            if serializer.is_valid():
                                serializer.save()
                                created_count += 1
                            else:
                                errors.append(f"第{index+1}行: {serializer.errors}")
                                failed_count += 1
                    else:
                        # 创建新订单
                        serializer = OrderCreateSerializer(
                            data=order_data,
                            context={'request': request}
                        )
                        if serializer.is_valid():
                            serializer.save()
                            created_count += 1
                        else:
                            errors.append(f"第{index+1}行: {serializer.errors}")
                            failed_count += 1
                
                except Exception as e:
                    errors.append(f"第{index+1}行: {str(e)}")
                    failed_count += 1
            
            # 返回导入结果
            return Response({
                'status': 'success',
                'total_records': total_records,
                'created': created_count,
                'updated': updated_count,
                'failed': failed_count,
                'errors': errors
            })
        
        except Exception as e:
            return Response(
                {"error": f"导入失败: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @extend_schema(
        summary="获取订单统计数据",
        description="获取订单的统计数据，包括总数、总金额、平均金额等",
        tags=["订单管理"],
        parameters=[
            OpenApiParameter(name="period", description="统计周期，可选值: daily, weekly, monthly, yearly", required=False, type=str, default="monthly"),
            OpenApiParameter(name="start_date", description="开始日期", required=False, type=str),
            OpenApiParameter(name="end_date", description="结束日期", required=False, type=str),
            OpenApiParameter(name="customer", description="客户ID", required=False, type=int),
            OpenApiParameter(name="service_type", description="服务类型", required=False, type=str),
        ]
    )
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        获取订单统计数据
        """
        # 获取过滤后的查询集
        queryset = self.filter_queryset(self.get_queryset())
        
        # 获取查询参数
        period = request.query_params.get('period', 'monthly')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # 如果没有提供日期范围，默认为最近一年
        if not start_date:
            start_date = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
        
        # 按日期范围筛选
        queryset = queryset.filter(created_at__gte=start_date, created_at__lte=end_date)
        
        # 计算基本统计数据
        total_count = queryset.count()
        
        # 如果没有订单，返回空统计数据
        if total_count == 0:
            return Response({
                'period': period,
                'start_date': start_date,
                'end_date': end_date,
                'total_orders': 0,
                'customer_total_amount': 0,
                'total_profit': 0,
                'average_profit_rate': 0,
                'by_period': [],
                'by_service_type': [],
                'by_payment_status': []
            })
        
        # 计算总金额和毛利
        amount_stats = queryset.aggregate(
            total_amount=Sum('customer_total_amount'),
            total_translator_fee=Sum('translator_fee'),
            total_project_fee=Sum('project_fee')
        )
        
        total_amount = amount_stats['total_amount'] or 0
        total_translator_fee = amount_stats['total_translator_fee'] or 0
        total_project_fee = amount_stats['total_project_fee'] or 0
        total_profit = total_amount - total_translator_fee - total_project_fee
        
        # 计算平均毛利率
        average_profit_rate = total_profit / total_amount if total_amount > 0 else 0
        
        # 按支付状态统计
        payment_status_stats = queryset.values('payment_status').annotate(
            count=Count('id'),
            amount=Sum('customer_total_amount')
        )
        by_payment_status = [
            {
                'payment_status': item['payment_status'],
                'orders': item['count'],
                'amount': float(item['amount'] or 0)
            } for item in payment_status_stats
        ]
        
        # 按服务类型统计
        service_type_stats = queryset.values('service_type').annotate(
            count=Count('id'),
            amount=Sum('customer_total_amount')
        )
        by_service_type = [
            {
                'service_type': item['service_type'],
                'orders': item['count'],
                'amount': float(item['amount'] or 0)
            } for item in service_type_stats
        ]
        
        # 按周期统计
        by_period = []
        if period == 'daily':
            # 按日统计
            date_stats = queryset.extra(
                select={'date': "DATE(created_at)"}
            ).values('date').annotate(
                count=Count('id'),
                amount=Sum('customer_total_amount'),
                profit=Sum('customer_total_amount') - Sum('translator_fee') - Sum('project_fee')
            ).order_by('date')
            
            by_period = [
                {
                    'period': item['date'].strftime('%Y-%m-%d'),
                    'orders': item['count'],
                    'amount': float(item['amount'] or 0),
                    'profit': float(item['profit'] or 0)
                } for item in date_stats
            ]
        elif period == 'weekly':
            # 按周统计
            date_stats = queryset.extra(
                select={'week': "CONCAT(YEAR(created_at), '-', WEEK(created_at))"}
            ).values('week').annotate(
                count=Count('id'),
                amount=Sum('customer_total_amount'),
                profit=Sum('customer_total_amount') - Sum('translator_fee') - Sum('project_fee')
            ).order_by('week')
            
            by_period = [
                {
                    'period': item['week'],
                    'orders': item['count'],
                    'amount': float(item['amount'] or 0),
                    'profit': float(item['profit'] or 0)
                } for item in date_stats
            ]
        elif period == 'monthly':
            # 按月统计
            date_stats = queryset.extra(
                select={'month': "DATE_FORMAT(created_at, '%Y-%m')"}
            ).values('month').annotate(
                count=Count('id'),
                amount=Sum('customer_total_amount'),
                profit=Sum('customer_total_amount') - Sum('translator_fee') - Sum('project_fee')
            ).order_by('month')
            
            by_period = [
                {
                    'period': item['month'],
                    'orders': item['count'],
                    'amount': float(item['amount'] or 0),
                    'profit': float(item['profit'] or 0)
                } for item in date_stats
            ]
        elif period == 'yearly':
            # 按年统计
            date_stats = queryset.extra(
                select={'year': "YEAR(created_at)"}
            ).values('year').annotate(
                count=Count('id'),
                amount=Sum('customer_total_amount'),
                profit=Sum('customer_total_amount') - Sum('translator_fee') - Sum('project_fee')
            ).order_by('year')
            
            by_period = [
                {
                    'period': str(item['year']),
                    'orders': item['count'],
                    'amount': float(item['amount'] or 0),
                    'profit': float(item['profit'] or 0)
                } for item in date_stats
            ]
        
        # 返回统计数据
        return Response({
            'period': period,
            'start_date': start_date,
            'end_date': end_date,
            'total_orders': total_count,
            'customer_total_amount': float(total_amount),
            'total_profit': float(total_profit),
            'average_profit_rate': float(average_profit_rate),
            'by_period': by_period,
            'by_service_type': by_service_type,
            'by_payment_status': by_payment_status
        })
    
    @extend_schema(
        summary="获取订单提醒",
        description="获取需要关注的订单提醒",
        tags=["订单管理"],
        parameters=[
            OpenApiParameter(name="days", description="近期天数范围", required=False, type=int, default=7),
            OpenApiParameter(name="keyword", description="关键字筛选", required=False, type=str),
        ]
    )
    @action(detail=False, methods=['get'])
    def reminders(self, request):
        """
        获取订单提醒，基于service_time字段分析近期需要关注的订单
        """
        # 获取查询参数
        days = int(request.query_params.get('days', 7))
        keyword = request.query_params.get('keyword', '')
        
        # 计算日期范围
        today = datetime.now().date()
        future_date = today + timedelta(days=days)
        today_str = today.strftime('%Y-%m-%d')
        future_str = future_date.strftime('%Y-%m-%d')
        
        # 初始化查询集，筛选未删除订单
        queryset = Order.objects.filter(is_deleted=False)
        
        # 对service_time字段进行筛选，寻找可能包含近期日期的订单
        # 使用简单的包含判断来预筛选，后续会更精确处理
        if keyword:
            queryset = queryset.filter(
                Q(service_time__icontains=keyword) | 
                Q(service_time__icontains=today_str) | 
                Q(service_time__icontains=future_str)
            )
        else:
            # 简单筛选今明两天相关的订单
            today_short = today.strftime('%-m月%-d日')  # 例如：6月1日
            tomorrow = today + timedelta(days=1)
            tomorrow_short = tomorrow.strftime('%-m月%-d日')
            
            queryset = queryset.filter(
                Q(service_time__icontains=today_str) | 
                Q(service_time__icontains=future_str) |
                Q(service_time__icontains=today_short) |
                Q(service_time__icontains=tomorrow_short)
            )
        
        reminders = []
        
        # 处理结果
        for order in queryset:
            reminders.append({
                'id': order.id,
                'order_number': order.order_number,
                'customer': {
                    'id': order.customer.id,
                    'name': order.customer.name
                },
                'service_time': order.service_time,
                'service_type': order.service_type,
                'language': order.language,
                'customer_count': order.customer_count,
                'project_location': order.project_location,
                'payment_status': order.payment_status
            })
        
        return Response({
            'count': len(reminders),
            'reminders': reminders
        }) 