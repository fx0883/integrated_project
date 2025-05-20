import os
import sys
from pathlib import Path

# 获取当前文件的目录
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

# 添加项目目录到路径
sys.path.insert(0, CURRENT_DIR)

# 设置Django设置模块
# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# 应用程序对象
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()