# 测试CMS模型导入
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def test_models_import():
    """测试CMS模型的导入情况"""
    print("===== 测试CMS模型导入 =====")
    
    # 尝试导入cms模块
    try:
        import cms
        print(f"✓ 成功导入cms模块: {cms}")
    except ImportError as e:
        print(f"✗ 导入cms模块失败: {e}")
    
    # 尝试直接从cms目录导入models.py中的模型
    try:
        from cms.models import Article, Category, Tag, AccessLog
        print(f"✓ 成功导入cms.models中的模型: {Article}, {Category}, {Tag}, {AccessLog}")
    except ImportError as e:
        print(f"✗ 导入cms.models中的模型失败: {e}")
    
    # 尝试导入项目根目录的models.py中的模型
    try:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        import models
        print(f"✓ 成功导入根目录models模块: {models}")
        
        # 检查根目录models.py中是否包含AccessLog模型
        if hasattr(models, 'AccessLog'):
            print(f"✓ 根目录models模块中存在AccessLog模型: {models.AccessLog}")
        else:
            print("✗ 根目录models模块中不存在AccessLog模型")
    except ImportError as e:
        print(f"✗ 导入根目录models模块失败: {e}")
    
    # 打印Python模块搜索路径
    print("\n===== Python模块搜索路径 =====")
    for path in sys.path:
        print(path)

if __name__ == "__main__":
    test_models_import() 