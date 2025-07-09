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
            OpenApiParameter(name="status", description="按状态筛选订单", required=False, type=str),
            OpenApiParameter(name="payment_status", description="按支付状态筛选订单", required=False, type=str),
            OpenApiParameter(name="service_type", description="按服务类型筛选订单", required=False, type=str),
            OpenApiParameter(name="customer_id", description="按客户ID筛选订单", required=False, type=int),
            OpenApiParameter(name="start_date_from", description="按开始日期范围筛选（起始）", required=False, type=str),
            OpenApiParameter(name="start_date_to", description="按开始日期范围筛选（结束）", required=False, type=str),
            OpenApiParameter(name="due_date_from", description="按截止日期范围筛选（起始）", required=False, type=str),
            OpenApiParameter(name="due_date_to", description="按截止日期范围筛选（结束）", required=False, type=str),
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
    filterset_fields = ['status', 'payment_status', 'service_type', 'customer']
    search_fields = ['order_number', 'customer__name', 'translator_name', 'description']
    ordering_fields = ['created_at', 'due_date', 'total_amount', 'payment_status']
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
                '状态': order.get_status_display(),
                '服务类型': order.get_service_type_display(),
                '语言方向': order.get_language_direction_display(),
                '字数': order.word_count,
                '单价': order.price,
                '总金额': float(order.total_amount),
                '译员费用': float(order.translator_fee),
                '项目费用': float(order.project_fee),
                '其他成本': float(order.other_costs),
                '毛利': float(order.calculate_profit()),
                '毛利率': f"{order.calculate_profit_rate():.2%}",
                '译员': order.translator or '',
                '开始日期': order.start_date,
                '截止日期': order.due_date,
                '交付日期': order.delivery_date,
                '支付状态': order.get_payment_status_display(),
                '支付日期': order.payment_date,
                '支付方式': order.payment_method or '',
                '创建时间': order.created_at,
                '项目明细': order.project_details or '',
                '回访记录': order.follow_up_record or '',
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
                'total_amount': 0,
                'total_profit': 0,
                'average_profit_rate': 0,
                'by_period': [],
                'by_service_type': [],
                'by_status': []
            })
        
        # 计算总金额和毛利
        amount_stats = queryset.aggregate(
            total_amount=Sum('total_amount'),
            total_translator_fee=Sum('translator_fee'),
            total_other_costs=Sum('other_costs'),
            total_project_fee=Sum('project_fee')
        )
        
        total_amount = amount_stats['total_amount'] or 0
        total_translator_fee = amount_stats['total_translator_fee'] or 0
        total_other_costs = amount_stats['total_other_costs'] or 0
        total_project_fee = amount_stats['total_project_fee'] or 0
        total_profit = total_amount - total_translator_fee - total_other_costs - total_project_fee
        
        # 计算平均毛利率
        average_profit_rate = total_profit / total_amount if total_amount > 0 else 0
        
        # 按状态统计
        status_stats = queryset.values('status').annotate(
            count=Count('id'),
            amount=Sum('total_amount')
        )
        by_status = [
            {
                'status': item['status'],
                'orders': item['count'],
                'amount': float(item['amount'] or 0)
            } for item in status_stats
        ]
        
        # 按服务类型统计
        service_type_stats = queryset.values('service_type').annotate(
            count=Count('id'),
            amount=Sum('total_amount')
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
                amount=Sum('total_amount'),
                profit=Sum('total_amount') - Sum('translator_fee') - Sum('other_costs') - Sum('project_fee')
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
                amount=Sum('total_amount'),
                profit=Sum('total_amount') - Sum('translator_fee') - Sum('other_costs') - Sum('project_fee')
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
                amount=Sum('total_amount'),
                profit=Sum('total_amount') - Sum('translator_fee') - Sum('other_costs') - Sum('project_fee')
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
                amount=Sum('total_amount'),
                profit=Sum('total_amount') - Sum('translator_fee') - Sum('other_costs') - Sum('project_fee')
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
            'total_amount': float(total_amount),
            'total_profit': float(total_profit),
            'average_profit_rate': float(average_profit_rate),
            'by_period': by_period,
            'by_service_type': by_service_type,
            'by_status': by_status
        })
    
    @extend_schema(
        summary="获取订单提醒",
        description="获取即将开始或截止的订单提醒",
        tags=["订单管理"],
        parameters=[
            OpenApiParameter(name="type", description="提醒类型，可选值: start, due, all", required=False, type=str, default="all"),
            OpenApiParameter(name="days", description="天数范围", required=False, type=int, default=7),
        ]
    )
    @action(detail=False, methods=['get'])
    def reminders(self, request):
        """
        获取订单提醒
        """
        # 获取查询参数
        reminder_type = request.query_params.get('type', 'all')
        days = int(request.query_params.get('days', 7))
        
        # 计算日期范围
        today = datetime.now().date()
        future_date = today + timedelta(days=days)
        
        # 初始化查询集
        queryset = Order.objects.filter(is_deleted=False)
        
        reminders = []
        
        # 按提醒类型筛选
        if reminder_type == 'start' or reminder_type == 'all':
            # 获取即将开始的订单
            start_reminders = queryset.filter(
                start_date__gte=today,
                start_date__lte=future_date,
                status='draft'  # 只提醒草稿状态的订单
            )
            
            for order in start_reminders:
                days_left = (order.start_date - today).days
                reminders.append({
                    'id': order.id,
                    'order_number': order.order_number,
                    'customer': {
                        'id': order.customer.id,
                        'name': order.customer.name
                    },
                    'reminder_type': 'start',
                    'date': order.start_date,
                    'days_left': days_left,
                    'service_type': order.service_type,
                    'language_direction': order.language_direction
                })
        
        if reminder_type == 'due' or reminder_type == 'all':
            # 获取即将到期的订单
            due_reminders = queryset.filter(
                due_date__gte=today,
                due_date__lte=future_date,
                status='in_progress'  # 只提醒进行中的订单
            )
            
            for order in due_reminders:
                days_left = (order.due_date - today).days
                reminders.append({
                    'id': order.id,
                    'order_number': order.order_number,
                    'customer': {
                        'id': order.customer.id,
                        'name': order.customer.name
                    },
                    'reminder_type': 'due',
                    'date': order.due_date,
                    'days_left': days_left,
                    'service_type': order.service_type,
                    'language_direction': order.language_direction
                })
        
        # 按剩余天数排序
        reminders.sort(key=lambda x: x['days_left'])
        
        return Response({
            'count': len(reminders),
            'reminders': reminders
        }) 