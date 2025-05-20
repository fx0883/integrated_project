#!/usr/bin/env python
"""
修复数据库字符集问题的脚本
"""
import os
import sys
import pymysql
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 数据库连接参数
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'password'),
    'database': os.getenv('DB_NAME', 'multi_tenant_db'),
    'port': int(os.getenv('DB_PORT', '3306')),
    'charset': 'utf8mb4',
    'autocommit': True,
    'use_unicode': True,
}

def execute_sql(sql):
    """执行SQL语句"""
    connection = None
    try:
        print(f"执行SQL: {sql}")
        connection = pymysql.connect(**db_config)
        cursor = connection.cursor()
        cursor.execute(sql)
        connection.commit()
        print("SQL执行成功")
        return True
    except Exception as e:
        print(f"SQL执行失败: {e}")
        return False
    finally:
        if connection:
            connection.close()

def main():
    """主函数"""
    # 获取实际的数据库名
    db_name = db_config['database']
    
    # 定义需要执行的SQL语句
    sql_statements = [
        f"ALTER DATABASE `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
        f"ALTER TABLE `auth_permission` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
        f"ALTER TABLE `auth_permission` MODIFY `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    ]
    
    # 执行SQL语句
    for sql in sql_statements:
        if not execute_sql(sql):
            print("修复字符集失败")
            return
    
    print("修复字符集成功")

if __name__ == "__main__":
    main() 