#!/usr/bin/env python
"""
数据库初始化脚本，在迁移前运行以确保正确的字符集
"""
import os
import sys
import pymysql
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 数据库连接参数（不包含数据库名）
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'password'),
    'port': int(os.getenv('DB_PORT', '3306')),
    'charset': 'utf8mb4',
    'autocommit': True,
}

def ensure_database_with_charset():
    """确保数据库存在并使用正确的字符集"""
    db_name = os.getenv('DB_NAME', 'multi_tenant_db')
    print(f"确保数据库 {db_name} 使用正确的字符集...")
    
    try:
        # 连接到MySQL服务器（不指定数据库）
        connection = pymysql.connect(**db_config)
        cursor = connection.cursor()
        
        try:
            # 尝试创建数据库（如果不存在）
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            print(f"数据库 {db_name} 创建成功或已存在")
            
            # 尝试修改数据库字符集（如果已存在）
            cursor.execute(f"ALTER DATABASE `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            print(f"数据库 {db_name} 字符集设置成功")
            
            print("数据库初始化成功！")
            return True
        except Exception as e:
            print(f"数据库操作错误: {e}")
            return False
        finally:
            connection.close()
    except Exception as e:
        print(f"数据库连接错误: {e}")
        return False

if __name__ == "__main__":
    if ensure_database_with_charset():
        print("您现在可以运行 'python manage.py migrate' 了")
    else:
        print("数据库初始化失败，请检查连接参数和权限") 