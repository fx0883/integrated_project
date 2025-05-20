#!/usr/bin/env python
"""
切换到SQLite数据库的脚本，用于开发和测试环境
"""
import os
import re
import shutil
from pathlib import Path

# 获取项目根目录
BASE_DIR = Path(__file__).resolve().parent

def backup_settings():
    """备份settings.py文件"""
    settings_path = BASE_DIR / 'core' / 'settings.py'
    backup_path = BASE_DIR / 'core' / 'settings.py.mysql.bak'
    
    if not backup_path.exists():
        print(f"备份 {settings_path} 到 {backup_path}")
        shutil.copy2(settings_path, backup_path)
    else:
        print(f"备份文件 {backup_path} 已存在，跳过备份")
    
    return settings_path

def modify_settings(settings_path):
    """修改settings.py文件，切换到SQLite数据库"""
    with open(settings_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 查找数据库配置部分
    db_pattern = r"DATABASES\s*=\s*\{[^}]*'default'[^}]*\}[^}]*\}"
    db_config = re.search(db_pattern, content, re.DOTALL)
    
    if not db_config:
        print("无法找到数据库配置部分，请手动修改")
        return False
    
    # 新的SQLite配置
    sqlite_config = """DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}"""
    
    # 替换数据库配置
    new_content = re.sub(db_pattern, sqlite_config, content, flags=re.DOTALL)
    
    # 写回文件
    with open(settings_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("已成功修改settings.py，切换到SQLite数据库")
    return True

def main():
    """主函数"""
    print("开始切换到SQLite数据库...")
    settings_path = backup_settings()
    if modify_settings(settings_path):
        print("\n切换完成！您现在可以运行以下命令：")
        print("python manage.py migrate")
        print("python manage.py createsuperuser")
    else:
        print("\n切换失败，请手动修改settings.py文件")

if __name__ == "__main__":
    main() 