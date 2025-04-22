#!/usr/bin/env python
"""
测试导入脚本
"""
import os
import sys
import django
import traceback

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

try:
    django.setup()
    print("Django环境设置成功")
except Exception as e:
    print(f"Django环境设置失败: {e}")
    traceback.print_exc()
    sys.exit(1)

# 尝试导入用户模型
try:
    from users.models import User
    print("成功导入User模型")
    print(f"User模型类: {User}")
except Exception as e:
    print(f"导入User模型失败: {e}")
    traceback.print_exc() 