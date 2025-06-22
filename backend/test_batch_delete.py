import requests
import json

def test_batch_delete_articles():
    """测试批量删除文章API"""
    url = 'http://localhost:8000/api/v1/cms/articles/batch-delete/'
    headers = {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozNCwidXNlcm5hbWUiOiJhZG1pbl9jbXMiLCJleHAiOjE3NTA2MDEyODgsIm1vZGVsX3R5cGUiOiJ1c2VyIiwiaXNfYWRtaW4iOnRydWUsImlzX3N1cGVyX2FkbWluIjpmYWxzZX0.bShYgGJR1ILcWpoMG98WFxKvJF96imGIFOzyotkIeqc',
        'Content-Type': 'application/json'
    }
    
    # 正确的请求体格式
    data = {
        'article_ids': [1, 2, 3],  # 要删除的文章ID列表
        'force': False  # 是否强制删除，默认为False（软删除）
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        print(f'Status code: {response.status_code}')
        print(f'Response: {response.text}')
    except Exception as e:
        print(f'Error: {e}')

if __name__ == '__main__':
    test_batch_delete_articles() 