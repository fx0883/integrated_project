#!/usr/bin/env python
"""
修复MySQL时区问题的脚本
"""

import os
import django
import logging
from django.db import connection

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def fix_timezone_tables():
    """安装MySQL时区表"""
    try:
        with connection.cursor() as cursor:
            # 检查时区表是否存在
            cursor.execute("SELECT COUNT(*) FROM mysql.time_zone")
            count = cursor.fetchone()[0]
            
            if count == 0:
                logger.info("时区表为空，需要安装时区数据")
                logger.info("请在MySQL服务器上运行以下命令:")
                logger.info("mysql_tzinfo_to_sql /usr/share/zoneinfo | mysql -u root -p mysql")
                logger.info("或者在Windows上，使用管理员权限运行:")
                logger.info("mysql_tzinfo_to_sql 'C:\\ProgramData\\MySQL\\MySQL Server X.Y\\data\\' | mysql -u root -p mysql")
            else:
                logger.info(f"时区表已存在，包含 {count} 条记录")
                
            # 检查当前时区设置
            cursor.execute("SELECT @@global.time_zone, @@session.time_zone")
            global_tz, session_tz = cursor.fetchone()
            logger.info(f"全局时区: {global_tz}, 会话时区: {session_tz}")
            
            # 设置时区为Asia/Shanghai
            try:
                cursor.execute("SET GLOBAL time_zone = 'Asia/Shanghai'")
                cursor.execute("SET time_zone = 'Asia/Shanghai'")
                logger.info("已将时区设置为Asia/Shanghai")
            except Exception as e:
                logger.error(f"设置时区失败: {e}")
                logger.info("尝试使用UTC偏移量设置时区")
                cursor.execute("SET GLOBAL time_zone = '+08:00'")
                cursor.execute("SET time_zone = '+08:00'")
                logger.info("已将时区设置为+08:00")
                
            # 验证设置
            cursor.execute("SELECT @@global.time_zone, @@session.time_zone")
            global_tz, session_tz = cursor.fetchone()
            logger.info(f"更新后的全局时区: {global_tz}, 会话时区: {session_tz}")
            
    except Exception as e:
        logger.error(f"修复时区出错: {e}")
        return False
    
    return True

if __name__ == "__main__":
    logger.info("开始修复MySQL时区问题...")
    success = fix_timezone_tables()
    if success:
        logger.info("时区问题已修复，请重启应用")
    else:
        logger.error("修复时区问题失败，请手动检查MySQL配置") 