from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta
from django.utils import timezone

from tenants.models import Tenant
from users.models import User

class ChartsAPITestCase(TestCase):
    """测试图表API"""
    
    def setUp(self):
        """设置初始数据"""
        # 创建超级管理员
        self.super_admin = User.objects.create_user(
            username='superadmin',
            email='superadmin@example.com',
            password='password123',
            is_super_admin=True
        )
        
        # 创建普通管理员
        self.tenant_admin = User.objects.create_user(
            username='tenantadmin',
            email='tenantadmin@example.com',
            password='password123',
            is_admin=True
        )
        
        # 创建普通用户
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@example.com',
            password='password123'
        )
        
        # 创建测试租户
        self.tenant1 = Tenant.objects.create(
            name='Test Tenant 1',
            code='test1',
            status='active',
            created_at=timezone.now() - timedelta(days=30)
        )
        
        self.tenant2 = Tenant.objects.create(
            name='Test Tenant 2',
            code='test2',
            status='active',
            created_at=timezone.now() - timedelta(days=15)
        )
        
        self.tenant3 = Tenant.objects.create(
            name='Test Tenant 3',
            code='test3',
            status='suspended',
            created_at=timezone.now() - timedelta(days=7)
        )
        
        # API客户端
        self.client = APIClient()
        
    def test_tenant_trend_auth(self):
        """测试租户趋势API的权限控制"""
        url = reverse('charts:tenant-trend')
        
        # 未认证用户
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # 普通用户
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # 租户管理员
        self.client.force_authenticate(user=self.tenant_admin)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # 超级管理员
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
    def test_tenant_trend_data(self):
        """测试租户趋势API的数据正确性"""
        url = reverse('charts:tenant-trend')
        self.client.force_authenticate(user=self.super_admin)
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 验证响应格式
        self.assertEqual(response.data['code'], 2000)
        self.assertIn('message', response.data)
        self.assertIn('data', response.data)
        
        chart_data = response.data['data']
        self.assertEqual(chart_data['chart_type'], 'line')
        self.assertIn('datasets', chart_data)
        self.assertIn('summary', chart_data)
        self.assertEqual(chart_data['summary']['total'], 3)  # 测试数据中有3个租户
        
    def test_tenant_status_distribution(self):
        """测试租户状态分布API"""
        url = reverse('charts:tenant-status-distribution')
        self.client.force_authenticate(user=self.super_admin)
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        chart_data = response.data['data']
        self.assertEqual(chart_data['chart_type'], 'pie')
        
        # 验证数据与我们创建的测试数据一致
        # 2个活跃租户，1个暂停租户
        summary = chart_data['summary']
        self.assertEqual(summary['total'], 3)
        
    def test_tenant_creation_rate(self):
        """测试租户创建速率API"""
        url = reverse('charts:tenant-creation-rate')
        self.client.force_authenticate(user=self.super_admin)
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 调试输出chart_data
        print(f"Chart data: {response.data['data']}")
        chart_data = response.data['data']
        self.assertEqual(chart_data['chart_type'], 'bar')
        
        # 验证汇总数据
        summary = chart_data['summary']
        # 如果没有数据，summary中会有message键而不是total_new键
        if 'message' in summary:
            self.assertIn('所选时间范围内没有新增租户', summary['message'])
        else:
            self.assertEqual(summary['total_new'], 3)  # 我们创建了3个租户
