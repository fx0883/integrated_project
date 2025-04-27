"""
打卡系统视图
"""
from django.db.models import Q
from django.utils.translation import gettext_lazy as _
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample, OpenApiResponse

from common.permissions import IsSuperAdmin, IsAdmin
from common.pagination import StandardResultsSetPagination
from .models import TaskCategory, Task, CheckRecord, TaskTemplate
from .serializers import (
    TaskCategorySerializer, TaskSerializer, 
    CheckRecordSerializer, TaskTemplateSerializer
)


@extend_schema_view(
    list=extend_schema(
        summary="获取打卡类型列表",
        description="获取打卡类型列表，支持分页、过滤和搜索",
        tags=["打卡系统-类型管理"],
        parameters=[
            OpenApiParameter(name="is_system", description="是否为系统预设类型", required=False, type=bool),
            OpenApiParameter(name="search", description="搜索关键词", required=False, type=str),
        ],
        examples=[
            OpenApiExample(
                'List Categories Example',
                summary='获取打卡类型列表示例',
                description='获取打卡类型列表，支持分页、过滤和搜索',
                value={
                    'page': 1,
                    'page_size': 10,
                    'is_system': True,
                    'search': '早起'
                }
            )
        ]
    ),
    retrieve=extend_schema(
        summary="获取打卡类型详情",
        description="获取单个打卡类型的详细信息",
        tags=["打卡系统-类型管理"],
        examples=[
            OpenApiExample(
                'Retrieve Category Example',
                summary='获取打卡类型详情示例',
                description='获取单个打卡类型的详细信息',
                value={
                    'id': 1
                }
            )
        ]
    ),
    create=extend_schema(
        summary="创建打卡类型",
        description="创建新的打卡类型",
        tags=["打卡系统-类型管理"],
        examples=[
            OpenApiExample(
                'Custom Category Example',
                summary='自定义打卡类型示例',
                description='创建一个自定义的打卡类型',
                value={
                    'name': '早起打卡',
                    'description': '每天早上6点前起床打卡',
                    'is_system': False,
                    'icon': 'sunrise',
                    'translations': {
                        'en': {
                            'name': 'Early Rising',
                            'description': 'Check in before 6:00 AM every day'
                        },
                        'zh-hans': {
                            'name': '早起打卡',
                            'description': '每天早上6点前起床打卡'
                        }
                    }
                }
            ),
            OpenApiExample(
                'System Category Example',
                summary='系统预设类型示例',
                description='创建一个系统预设的打卡类型（仅供超级管理员使用）',
                value={
                    'name': '健身打卡',
                    'description': '记录每天的健身情况',
                    'is_system': True,
                    'icon': 'dumbbell',
                    'translations': {
                        'en': {
                            'name': 'Fitness',
                            'description': 'Record daily workout activities'
                        },
                        'zh-hans': {
                            'name': '健身打卡',
                            'description': '记录每天的健身情况'
                        }
                    }
                }
            )
        ]
    ),
    update=extend_schema(
        summary="更新打卡类型",
        description="更新现有打卡类型的所有字段",
        tags=["打卡系统-类型管理"],
        examples=[
            OpenApiExample(
                'Update Category Example',
                summary='更新打卡类型示例',
                description='更新现有打卡类型的所有字段',
                value={
                    'name': '早起打卡',
                    'description': '每天早上6点前起床打卡，养成早起好习惯',
                    'is_system': False,
                    'icon': 'sunrise',
                    'translations': {
                        'en': {
                            'name': 'Early Rising',
                            'description': 'Check in before 6:00 AM every day, develop a habit of early rising'
                        },
                        'zh-hans': {
                            'name': '早起打卡',
                            'description': '每天早上6点前起床打卡，养成早起好习惯'
                        }
                    }
                }
            )
        ]
    ),
    partial_update=extend_schema(
        summary="部分更新打卡类型",
        description="更新现有打卡类型的部分字段",
        tags=["打卡系统-类型管理"],
        examples=[
            OpenApiExample(
                'Partial Update Category Example',
                summary='部分更新打卡类型示例',
                description='仅更新打卡类型的描述字段',
                value={
                    'description': '每天早上6点前起床打卡，养成早起好习惯，提高效率',
                    'translations': {
                        'en': {
                            'description': 'Check in before 6:00 AM every day, develop a habit of early rising, improve efficiency'
                        },
                        'zh-hans': {
                            'description': '每天早上6点前起床打卡，养成早起好习惯，提高效率'
                        }
                    }
                }
            )
        ]
    ),
    destroy=extend_schema(
        summary="删除打卡类型",
        description="删除现有打卡类型",
        tags=["打卡系统-类型管理"],
        examples=[
            OpenApiExample(
                'Delete Category Example',
                summary='删除打卡类型示例',
                description='删除现有打卡类型',
                value={
                    'id': 1
                }
            )
        ]
    ),
)
class TaskCategoryViewSet(viewsets.ModelViewSet):
    """
    打卡类型视图集，提供增删改查API
    
    可以管理系统预设和用户自定义的打卡类型，支持多语言。
    - 普通用户: 只能查看系统预设类型和自己创建的类型
    - 租户管理员: 可以查看系统预设类型和该租户下的所有类型
    - 超级管理员: 可以查看所有类型
    """
    serializer_class = TaskCategorySerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_system']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        获取查询集，根据用户角色过滤
        - 普通用户: 只能查看系统预设类型和自己创建的类型
        - 租户管理员: 可以查看系统预设类型和该租户下的所有类型
        - 超级管理员: 可以查看所有类型
        """
        user = self.request.user
        
        # 基础查询：系统预设类型 + 用户自己的类型
        base_query = Q(is_system=True) | Q(user=user)
        
        # 管理员可以查看本租户的所有类型
        if user.is_admin and not user.is_super_admin and user.tenant:
            base_query |= Q(tenant=user.tenant)
        
        # 超级管理员可以查看所有类型
        if user.is_super_admin:
            return TaskCategory.objects.all()
        
        return TaskCategory.objects.filter(base_query)
    
    def perform_create(self, serializer):
        """
        创建打卡类型时自动关联当前用户
        """
        # 设置用户和租户
        user = self.request.user
        serializer.save(
            user=user,
            tenant=user.tenant
        )
    
    def perform_update(self, serializer):
        """
        更新打卡类型时进行权限检查
        """
        instance = self.get_object()
        user = self.request.user
        
        # 检查权限
        if instance.user != user and not user.is_admin:
            raise permissions.PermissionDenied(_("您没有权限修改此打卡类型"))
        
        # 设置租户（如果用户变更）
        if 'user' in serializer.validated_data:
            new_user = serializer.validated_data['user']
            serializer.validated_data['tenant'] = new_user.tenant
        
        serializer.save()


@extend_schema_view(
    list=extend_schema(
        summary="获取打卡任务列表",
        description="获取打卡任务列表，支持分页、过滤和搜索",
        tags=["打卡系统-任务管理"],
        parameters=[
            OpenApiParameter(name="category", description="打卡类型ID", required=False, type=int),
            OpenApiParameter(name="status", description="任务状态", required=False, type=str),
            OpenApiParameter(name="search", description="搜索关键词", required=False, type=str),
        ],
        examples=[
            OpenApiExample(
                'List Tasks Example',
                summary='获取打卡任务列表示例',
                description='获取打卡任务列表，支持分页、过滤和搜索',
                value={
                    'page': 1,
                    'page_size': 10,
                    'category': 1,
                    'status': 'active',
                    'search': '早起'
                }
            )
        ]
    ),
    retrieve=extend_schema(
        summary="获取打卡任务详情",
        description="获取单个打卡任务的详细信息",
        tags=["打卡系统-任务管理"],
        examples=[
            OpenApiExample(
                'Retrieve Task Example',
                summary='获取打卡任务详情示例',
                description='获取单个打卡任务的详细信息',
                value={
                    'id': 1
                }
            )
        ]
    ),
    create=extend_schema(
        summary="创建打卡任务",
        description="创建新的打卡任务",
        tags=["打卡系统-任务管理"],
        examples=[
            OpenApiExample(
                'Create Task Example',
                summary='创建打卡任务示例',
                description='创建一个新的打卡任务',
                value={
                    'name': '每日早起',
                    'description': '每天早上6点前起床，培养良好作息习惯',
                    'category': 1,
                    'start_date': '2025-05-01',
                    'end_date': '2025-05-31',
                    'status': 'active',
                    'reminder': True,
                    'reminder_time': '05:30:00'
                }
            ),
            OpenApiExample(
                'Create Long-term Task Example',
                summary='创建长期打卡任务示例',
                description='创建一个没有结束日期的长期打卡任务',
                value={
                    'name': '健身打卡',
                    'description': '每天健身30分钟，保持健康体魄',
                    'category': 2,
                    'start_date': '2025-05-01',
                    'status': 'active',
                    'reminder': False
                }
            )
        ]
    ),
    update=extend_schema(
        summary="更新打卡任务",
        description="更新现有打卡任务的所有字段",
        tags=["打卡系统-任务管理"],
        examples=[
            OpenApiExample(
                'Update Task Example',
                summary='更新打卡任务示例',
                description='更新现有打卡任务的所有字段',
                value={
                    'name': '每日早起',
                    'description': '每天早上6点前起床，培养良好作息习惯，提高工作效率',
                    'category': 1,
                    'start_date': '2025-05-01',
                    'end_date': '2025-06-30',
                    'status': 'active',
                    'reminder': True,
                    'reminder_time': '05:45:00'
                }
            )
        ]
    ),
    partial_update=extend_schema(
        summary="部分更新打卡任务",
        description="更新现有打卡任务的部分字段",
        tags=["打卡系统-任务管理"],
        examples=[
            OpenApiExample(
                'Change Task Status Example',
                summary='更改任务状态示例',
                description='暂停一个正在进行的打卡任务',
                value={
                    'status': 'paused'
                }
            ),
            OpenApiExample(
                'Update Reminder Example',
                summary='更新提醒设置示例',
                description='修改任务提醒时间',
                value={
                    'reminder': True,
                    'reminder_time': '06:00:00'
                }
            )
        ]
    ),
    destroy=extend_schema(
        summary="删除打卡任务",
        description="删除现有打卡任务",
        tags=["打卡系统-任务管理"],
        examples=[
            OpenApiExample(
                'Delete Task Example',
                summary='删除打卡任务示例',
                description='删除现有打卡任务',
                value={
                    'id': 1
                }
            )
        ]
    ),
)
class TaskViewSet(viewsets.ModelViewSet):
    """
    打卡任务视图集，提供增删改查API
    
    可以创建和管理打卡任务，支持任务提醒。
    - 普通用户: 只能查看自己的任务
    - 租户管理员: 可以查看该租户下的所有任务
    - 超级管理员: 可以查看所有任务
    """
    serializer_class = TaskSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'status']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name', 'start_date', 'end_date']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        获取查询集，根据用户角色过滤
        - 普通用户: 只能查看自己的任务
        - 租户管理员: 可以查看该租户下的所有任务
        - 超级管理员: 可以查看所有任务
        """
        user = self.request.user
        
        # 基础查询：用户自己的任务
        base_query = Q(user=user)
        
        # 管理员可以查看本租户的所有任务
        if user.is_admin and not user.is_super_admin and user.tenant:
            base_query |= Q(tenant=user.tenant)
        
        # 超级管理员可以查看所有任务
        if user.is_super_admin:
            return Task.objects.all()
        
        return Task.objects.filter(base_query)
    
    def perform_create(self, serializer):
        """
        创建任务时自动关联当前用户
        """
        # 设置用户和租户
        user = self.request.user
        serializer.save(
            user=user,
            tenant=user.tenant
        )
    
    def perform_update(self, serializer):
        """
        更新任务时进行权限检查
        """
        instance = self.get_object()
        user = self.request.user
        
        # 检查权限
        if instance.user != user and not user.is_admin:
            raise permissions.PermissionDenied(_("您没有权限修改此任务"))
        
        # 设置租户（如果用户变更）
        if 'user' in serializer.validated_data:
            new_user = serializer.validated_data['user']
            serializer.validated_data['tenant'] = new_user.tenant
        
        serializer.save()
    
    @extend_schema(
        summary="打卡接口",
        description="为指定任务创建打卡记录",
        tags=["打卡系统-任务管理"],
        request=CheckRecordSerializer,
        responses={201: CheckRecordSerializer},
        examples=[
            OpenApiExample(
                'Check-in Example',
                summary='打卡示例',
                description='为指定任务创建打卡记录',
                value={
                    'check_date': '2025-05-01',
                    'check_time': '06:00:00',
                    'remarks': '今天起得很早，感觉很棒！'
                }
            )
        ]
    )
    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        """
        任务打卡接口
        """
        task = self.get_object()
        user = request.user
        
        # 检查权限
        if task.user != user and not user.is_admin:
            return Response(
                {"detail": _("您没有权限为此任务打卡")},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # 创建打卡记录
        serializer = CheckRecordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(task=task, user=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema_view(
    list=extend_schema(
        summary="获取打卡记录列表",
        description="获取打卡记录列表，支持分页、过滤和搜索",
        tags=["打卡系统-打卡记录"],
        parameters=[
            OpenApiParameter(name="task", description="任务ID", required=False, type=int),
            OpenApiParameter(name="check_date", description="打卡日期", required=False, type=str),
            OpenApiParameter(name="search", description="搜索关键词", required=False, type=str),
        ],
        examples=[
            OpenApiExample(
                'List Records Example',
                summary='获取打卡记录列表示例',
                description='获取打卡记录列表，支持分页、过滤和搜索',
                value={
                    'page': 1,
                    'page_size': 10,
                    'task': 1,
                    'check_date': '2025-05-01',
                    'search': '早起'
                }
            )
        ]
    ),
    retrieve=extend_schema(
        summary="获取打卡记录详情",
        description="获取单个打卡记录的详细信息",
        tags=["打卡系统-打卡记录"],
        examples=[
            OpenApiExample(
                'Retrieve Record Example',
                summary='获取打卡记录详情示例',
                description='获取单个打卡记录的详细信息',
                value={
                    'id': 1
                }
            )
        ]
    ),
    create=extend_schema(
        summary="创建打卡记录",
        description="创建新的打卡记录",
        tags=["打卡系统-打卡记录"],
        examples=[
            OpenApiExample(
                'Create Record Example',
                summary='创建打卡记录示例',
                description='为特定任务创建一条打卡记录',
                value={
                    'task': 1,
                    'check_date': '2025-05-01',
                    'check_time': '06:00:00',
                    'remarks': '今天起得很早，感觉很棒！'
                }
            ),
            OpenApiExample(
                'Create Simple Record Example',
                summary='创建简单打卡记录示例',
                description='仅记录打卡日期和时间',
                value={
                    'task': 2,
                    'check_date': '2025-05-01',
                    'check_time': '20:00:00'
                }
            )
        ]
    ),
    update=extend_schema(
        summary="更新打卡记录",
        description="更新现有打卡记录的所有字段",
        tags=["打卡系统-打卡记录"],
        examples=[
            OpenApiExample(
                'Update Record Example',
                summary='更新打卡记录示例',
                description='更新打卡记录的所有字段',
                value={
                    'task': 1,
                    'check_date': '2025-05-01',
                    'check_time': '05:45:00',
                    'remarks': '今天起得比计划还早，很有成就感！'
                }
            )
        ]
    ),
    partial_update=extend_schema(
        summary="部分更新打卡记录",
        description="更新现有打卡记录的部分字段",
        tags=["打卡系统-打卡记录"],
        examples=[
            OpenApiExample(
                'Update Record Remarks Example',
                summary='更新打卡记录备注示例',
                description='仅更新打卡记录的备注内容',
                value={
                    'remarks': '补充说明：今天起床后完成了晨读计划'
                }
            )
        ]
    ),
    destroy=extend_schema(
        summary="删除打卡记录",
        description="删除现有打卡记录",
        tags=["打卡系统-打卡记录"],
        examples=[
            OpenApiExample(
                'Delete Record Example',
                summary='删除打卡记录示例',
                description='删除一条现有打卡记录',
                value={
                    'id': 1
                }
            )
        ]
    ),
)
class CheckRecordViewSet(viewsets.ModelViewSet):
    """
    打卡记录视图集，提供增删改查API
    
    记录用户的打卡情况，支持添加备注。
    - 普通用户: 只能查看自己的打卡记录
    - 租户管理员: 可以查看该租户下的所有打卡记录
    - 超级管理员: 可以查看所有打卡记录
    """
    serializer_class = CheckRecordSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['task', 'check_date']
    search_fields = ['remarks']
    ordering_fields = ['check_date', 'check_time', 'created_at']
    ordering = ['-check_date', '-check_time']
    
    def get_queryset(self):
        """
        获取查询集，根据用户角色过滤
        - 普通用户: 只能查看自己的打卡记录
        - 租户管理员: 可以查看该租户下的所有打卡记录
        - 超级管理员: 可以查看所有打卡记录
        """
        user = self.request.user
        
        # 基础查询：用户自己的打卡记录
        base_query = Q(user=user)
        
        # 管理员可以查看本租户的所有打卡记录
        if user.is_admin and not user.is_super_admin and user.tenant:
            tenant_users = user.tenant.users.all()
            base_query |= Q(user__in=tenant_users)
        
        # 超级管理员可以查看所有打卡记录
        if user.is_super_admin:
            return CheckRecord.objects.all()
        
        return CheckRecord.objects.filter(base_query)
    
    def perform_create(self, serializer):
        """
        创建打卡记录时自动关联当前用户
        """
        serializer.save(user=self.request.user)
    
    def perform_update(self, serializer):
        """
        更新打卡记录时进行权限检查
        """
        instance = self.get_object()
        user = self.request.user
        
        # 检查权限
        if instance.user != user and not user.is_admin:
            raise permissions.PermissionDenied(_("您没有权限修改此打卡记录"))
        
        serializer.save()


@extend_schema_view(
    list=extend_schema(
        summary="获取任务模板列表",
        description="获取任务模板列表，支持分页、过滤和搜索",
        tags=["打卡系统-模板管理"],
        parameters=[
            OpenApiParameter(name="category", description="打卡类型ID", required=False, type=int),
            OpenApiParameter(name="is_system", description="是否为系统预设模板", required=False, type=bool),
            OpenApiParameter(name="search", description="搜索关键词", required=False, type=str),
        ],
        examples=[
            OpenApiExample(
                'List Templates Example',
                summary='获取任务模板列表示例',
                description='获取任务模板列表，支持分页、过滤和搜索',
                value={
                    'page': 1,
                    'page_size': 10,
                    'category': 1,
                    'is_system': True,
                    'search': '健身'
                }
            )
        ]
    ),
    retrieve=extend_schema(
        summary="获取任务模板详情",
        description="获取单个任务模板的详细信息",
        tags=["打卡系统-模板管理"],
        examples=[
            OpenApiExample(
                'Retrieve Template Example',
                summary='获取任务模板详情示例',
                description='获取单个任务模板的详细信息',
                value={
                    'id': 1
                }
            )
        ]
    ),
    create=extend_schema(
        summary="创建任务模板",
        description="创建新的任务模板",
        tags=["打卡系统-模板管理"],
        examples=[
            OpenApiExample(
                'Custom Template Example',
                summary='自定义任务模板示例',
                description='创建一个自定义的任务模板',
                value={
                    'name': '晨跑计划',
                    'description': '每天早上进行30分钟晨跑',
                    'category': 1,
                    'is_system': False,
                    'translations': {
                        'en': {
                            'name': 'Morning Run Plan',
                            'description': '30 minutes morning run every day'
                        },
                        'zh-hans': {
                            'name': '晨跑计划',
                            'description': '每天早上进行30分钟晨跑'
                        }
                    }
                }
            ),
            OpenApiExample(
                'System Template Example',
                summary='系统预设模板示例',
                description='创建一个系统预设的任务模板（仅供超级管理员使用）',
                value={
                    'name': '阅读习惯养成',
                    'description': '每天阅读30分钟，培养阅读习惯',
                    'category': 2,
                    'is_system': True,
                    'translations': {
                        'en': {
                            'name': 'Reading Habit',
                            'description': 'Read for 30 minutes every day to develop reading habits'
                        },
                        'zh-hans': {
                            'name': '阅读习惯养成',
                            'description': '每天阅读30分钟，培养阅读习惯'
                        }
                    }
                }
            )
        ]
    ),
    update=extend_schema(
        summary="更新任务模板",
        description="更新现有任务模板的所有字段",
        tags=["打卡系统-模板管理"],
        examples=[
            OpenApiExample(
                'Update Template Example',
                summary='更新任务模板示例',
                description='更新现有任务模板的所有字段',
                value={
                    'name': '晨跑计划',
                    'description': '每天早上进行45分钟晨跑，提高身体素质',
                    'category': 1,
                    'is_system': False,
                    'translations': {
                        'en': {
                            'name': 'Morning Run Plan',
                            'description': '45 minutes morning run every day to improve fitness'
                        },
                        'zh-hans': {
                            'name': '晨跑计划',
                            'description': '每天早上进行45分钟晨跑，提高身体素质'
                        }
                    }
                }
            )
        ]
    ),
    partial_update=extend_schema(
        summary="部分更新任务模板",
        description="更新现有任务模板的部分字段",
        tags=["打卡系统-模板管理"],
        examples=[
            OpenApiExample(
                'Partial Update Template Example',
                summary='部分更新任务模板示例',
                description='仅更新任务模板的描述字段',
                value={
                    'description': '每天早上进行30-45分钟晨跑，提高身体素质和耐力',
                    'translations': {
                        'en': {
                            'description': '30-45 minutes morning run every day to improve fitness and endurance'
                        },
                        'zh-hans': {
                            'description': '每天早上进行30-45分钟晨跑，提高身体素质和耐力'
                        }
                    }
                }
            )
        ]
    ),
    destroy=extend_schema(
        summary="删除任务模板",
        description="删除现有任务模板",
        tags=["打卡系统-模板管理"],
        examples=[
            OpenApiExample(
                'Delete Template Example',
                summary='删除任务模板示例',
                description='删除现有任务模板',
                value={
                    'id': 1
                }
            )
        ]
    ),
)
class TaskTemplateViewSet(viewsets.ModelViewSet):
    """
    任务模板视图集，提供增删改查API
    
    可以管理系统预设和用户自定义的任务模板，支持多语言和基于模板创建任务。
    - 普通用户: 只能查看系统预设模板和自己创建的模板
    - 租户管理员: 可以查看系统预设模板和该租户下的所有模板
    - 超级管理员: 可以查看所有模板
    """
    serializer_class = TaskTemplateSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_system']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        获取查询集，根据用户角色过滤
        - 普通用户: 只能查看系统预设模板和自己创建的模板
        - 租户管理员: 可以查看系统预设模板和该租户下的所有模板
        - 超级管理员: 可以查看所有模板
        """
        user = self.request.user
        
        # 基础查询：系统预设模板 + 用户自己的模板
        base_query = Q(is_system=True) | Q(user=user)
        
        # 管理员可以查看本租户的所有模板
        if user.is_admin and not user.is_super_admin and user.tenant:
            base_query |= Q(tenant=user.tenant)
        
        # 超级管理员可以查看所有模板
        if user.is_super_admin:
            return TaskTemplate.objects.all()
        
        return TaskTemplate.objects.filter(base_query)
    
    def perform_create(self, serializer):
        """
        创建模板时自动关联当前用户
        """
        # 设置用户和租户
        user = self.request.user
        serializer.save(
            user=user,
            tenant=user.tenant
        )
    
    def perform_update(self, serializer):
        """
        更新模板时进行权限检查
        """
        instance = self.get_object()
        user = self.request.user
        
        # 检查权限
        if instance.user != user and not user.is_admin:
            raise permissions.PermissionDenied(_("您没有权限修改此模板"))
        
        # 设置租户（如果用户变更）
        if 'user' in serializer.validated_data:
            new_user = serializer.validated_data['user']
            serializer.validated_data['tenant'] = new_user.tenant
        
        serializer.save()
    
    @extend_schema(
        summary="基于模板创建任务",
        description="使用指定的模板创建新任务",
        tags=["打卡系统-模板管理"],
        request=TaskSerializer,
        responses={201: TaskSerializer},
        examples=[
            OpenApiExample(
                'Create Task From Template Example',
                summary='基于模板创建任务示例',
                description='使用指定的模板创建新任务',
                value={
                    'start_date': '2025-05-01',
                    'end_date': '2025-05-31',
                    'reminder': True,
                    'reminder_time': '06:00:00'
                }
            ),
            OpenApiExample(
                'Create Task With Custom Name Example',
                summary='创建自定义名称的任务示例',
                description='基于模板创建任务并自定义任务名称',
                value={
                    'name': '我的晨跑打卡',
                    'start_date': '2025-05-01',
                    'reminder': True,
                    'reminder_time': '05:30:00'
                }
            )
        ]
    )
    @action(detail=True, methods=['post'])
    def create_task(self, request, pk=None):
        """
        基于模板创建任务
        """
        template = self.get_object()
        user = request.user
        
        # 获取请求数据，如果没有则使用空字典
        data = request.data if request.data else {}
        
        # 从模板中获取基本信息
        task_data = {
            'name': data.get('name', template.name),
            'description': data.get('description', template.description),
            'category': template.category.id,
            'status': 'active',
            'start_date': data.get('start_date'),
            'end_date': data.get('end_date'),
            'reminder': data.get('reminder', False),
            'reminder_time': data.get('reminder_time'),
        }
        
        # 创建任务
        serializer = TaskSerializer(data=task_data)
        if serializer.is_valid():
            serializer.save(user=user, tenant=user.tenant)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
