#!/usr/bin/env python
"""
测试脚本，用于检查租户数据和图表API问题
"""
import os
import sys
import django
from datetime import datetime, timedelta
import json
from collections import defaultdict

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.utils import timezone
from django.db.models import Count
from tenants.models import Tenant

def tenant_counts_by_month_manual(start_date, end_date):
    """使用Python代码手动按月统计租户创建数量"""
    print(f"\n=== 手动按月统计租户创建数量 ===")
    print(f"查询参数: start_date={start_date}, end_date={end_date}")
    
    # 转换日期为datetime对象并添加时区信息
    start_datetime = timezone.make_aware(datetime.combine(start_date, datetime.min.time()))
    end_datetime = timezone.make_aware(datetime.combine(end_date, datetime.max.time()))
    
    print(f"查询日期时间范围: {start_datetime} 至 {end_datetime}")
    
    # 获取所有在日期范围内的租户
    tenants = Tenant.objects.filter(created_at__range=(start_datetime, end_datetime))
    print(f"该日期范围内的总租户数: {tenants.count()}")
    
    # 手动按月分组统计
    month_counts = defaultdict(int)
    for tenant in tenants:
        # 使用strftime提取年月
        month_key = tenant.created_at.strftime('%Y-%m')
        month_counts[month_key] += 1
    
    # 按月份排序并打印结果
    sorted_months = sorted(month_counts.keys())
    print(f"\n按月统计结果:")
    for month in sorted_months:
        print(f"月份: {month}, 新增租户: {month_counts[month]}")
    
    # 打印每个月的租户详情
    print("\n=== 每月租户详细信息 ===")
    monthly_tenants = defaultdict(list)
    for tenant in tenants:
        month_key = tenant.created_at.strftime('%Y-%m')
        monthly_tenants[month_key].append(tenant)
    
    for month in sorted(monthly_tenants.keys()):
        print(f"\n月份: {month}, 租户数: {len(monthly_tenants[month])}")
        for tenant in monthly_tenants[month]:
            print(f"  ID: {tenant.id}, 名称: {tenant.name}, 创建日期: {tenant.created_at}")

def tenant_status_distribution():
    """查询租户状态分布"""
    print("\n=== 租户状态分布 ===")
    
    status_counts = {}
    for status, _ in Tenant.STATUS_CHOICES:
        count = Tenant.objects.filter(status=status).count()
        status_counts[status] = count
    
    deleted_count = Tenant.objects.filter(is_deleted=True).count()
    status_counts['is_deleted'] = deleted_count
    
    print(json.dumps(status_counts, indent=2))

def print_all_tenants():
    """打印所有租户信息"""
    print("\n=== 所有租户 ===")
    tenants = Tenant.objects.all().order_by('created_at')
    print(f"总租户数: {tenants.count()}")
    
    for tenant in tenants:
        print(f"ID: {tenant.id}, 名称: {tenant.name}, 状态: {tenant.status}, 创建日期: {tenant.created_at}")

def analyze_charts_api_issue():
    """分析图表API可能的问题"""
    print("\n=== 分析图表API问题 ===")
    
    # 1. 检查租户创建时间的时区信息
    print("1. 租户创建时间的时区信息:")
    sample_tenant = Tenant.objects.first()
    if sample_tenant:
        print(f"   - 样本租户: {sample_tenant.name}")
        print(f"   - 创建时间: {sample_tenant.created_at}")
        print(f"   - 是否有时区: {timezone.is_aware(sample_tenant.created_at)}")
        print(f"   - 时区信息: {sample_tenant.created_at.tzinfo}")
        
        # 检测UTC和本地时区差异
        local_time = timezone.localtime(sample_tenant.created_at)
        print(f"   - UTC时间: {sample_tenant.created_at}")
        print(f"   - 本地时间: {local_time}")
        print(f"   - 时差: {local_time - sample_tenant.created_at}")
    
    # 2. 检查月份格式问题
    print("\n2. 月份格式检查:")
    tenants = Tenant.objects.all()[:3]  # 取前3个样本
    
    for tenant in tenants:
        created_at = tenant.created_at
        print(f"  租户: {tenant.name}")
        print(f"    - created_at: {created_at}")
        print(f"    - created_at.strftime('%Y-%m'): {created_at.strftime('%Y-%m')}")
        print(f"    - created_at.strftime('%Y-%m-%d'): {created_at.strftime('%Y-%m-%d')}")
        print(f"    - 年月表示: {created_at.year}-{created_at.month:02d}")
        print(f"    - UTC月份: {created_at.month}")
        print(f"    - 本地月份: {timezone.localtime(created_at).month}")
    
    # 3. 分析API数据结构问题
    print("\n3. API返回的数据结构:")
    all_months = set()
    
    # 收集所有存在数据的月份
    for tenant in Tenant.objects.all():
        month_key = tenant.created_at.strftime('%Y-%m')
        all_months.add(month_key)
    
    print(f"  数据库中存在的月份: {sorted(all_months)}")
    print("  API可能返回空数组的原因:")
    print("    - 查询时间范围未覆盖数据库中存在的月份")
    print("    - 时区导致日期计算不准确")
    print("    - 数据分组时使用的日期函数(TruncMonth)可能存在问题")
    print("    - SQL查询中的日期格式与数据库不匹配")

def main():
    # 设置日期范围 (确保覆盖了数据库中的租户创建日期)
    start_date = datetime(2024, 6, 1).date()  # 2024年6月1日
    end_date = datetime(2025, 6, 13).date()    # 2025年6月13日
    
    # 打印所有租户
    print_all_tenants()
    
    # 查询租户状态分布
    tenant_status_distribution()
    
    # 手动按月统计租户创建数量
    tenant_counts_by_month_manual(start_date, end_date)
    
    # 测试另一个日期范围
    print("\n使用不同的日期范围:")
    tenant_counts_by_month_manual(datetime(2025, 3, 1).date(), datetime(2025, 5, 30).date())
    
    # 分析图表API可能的问题
    analyze_charts_api_issue()

if __name__ == "__main__":
    main() 