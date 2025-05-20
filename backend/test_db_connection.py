import os
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

# 尝试连接数据库
try:
    print("尝试连接数据库...")
    connection = pymysql.connect(**db_config)
    print("数据库连接成功！")
    
    # 尝试执行一个简单的查询
    with connection.cursor() as cursor:
        cursor.execute("SELECT VERSION()")
        version = cursor.fetchone()
        print(f"数据库版本: {version[0]}")
    
    # 关闭连接
    connection.close()
    print("数据库连接已关闭")
    
except Exception as e:
    print(f"数据库连接/查询失败: {e}")
    print("请检查您的数据库参数，尤其是用户名、密码和数据库名称") 