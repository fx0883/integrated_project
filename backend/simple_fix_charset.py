#!/usr/bin/env python
"""
简化版数据库字符集修复脚本
"""
import os
import pymysql
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 获取数据库连接参数
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'password')
DB_NAME = os.getenv('DB_NAME', 'multi_tenant_db')
DB_PORT = int(os.getenv('DB_PORT', '3306'))

print(f"尝试连接数据库 {DB_NAME}...")

try:
    # 连接到MySQL服务器
    connection = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        port=DB_PORT,
        charset='utf8mb4'
    )
    
    print("数据库连接成功")
    
    with connection.cursor() as cursor:
        # 设置数据库字符集
        print("设置数据库字符集...")
        cursor.execute(f"ALTER DATABASE `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        
        # 查询所有表
        print("获取所有表...")
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        # 对每个表设置字符集
        for table in tables:
            table_name = table[0]
            print(f"设置表 {table_name} 的字符集...")
            cursor.execute(f"ALTER TABLE `{table_name}` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    
    connection.commit()
    print("所有字符集设置完成！")
    
except Exception as e:
    print(f"错误: {e}")
finally:
    if 'connection' in locals() and connection:
        connection.close()
        print("数据库连接已关闭")

print("\n现在您可以尝试运行 'python manage.py migrate'") 