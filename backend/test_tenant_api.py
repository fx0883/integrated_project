import requests
import json

BASE_URL = 'http://localhost:8000/api/v1'

def login_and_get_token(username, password):
    """登录并获取认证令牌"""
    url = f'{BASE_URL}/auth/login/'
    data = {
        'username': username,
        'password': password
    }
    
    try:
        print(f"尝试登录: {url}")
        print(f"登录数据: {data}")
        response = requests.post(url, json=data)
        print(f"登录响应状态码: {response.status_code}")
        print(f"登录响应内容: {response.text}")
        
        if response.status_code == 200:
            token_data = response.json()
            if 'data' in token_data and 'token' in token_data['data']:
                return token_data['data']['token']
        return None
    except Exception as e:
        print(f"登录请求异常: {str(e)}")
        return None

def test_tenant_comprehensive_view(token=None):
    """测试获取租户完整信息API"""
    # 假设租户ID为1
    tenant_id = 1
    url = f'{BASE_URL}/tenants/{tenant_id}/comprehensive/'
    
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    try:
        print(f"请求URL: {url}")
        print(f"请求头: {headers}")
        response = requests.get(url, headers=headers)
        print(f"响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(json.dumps(data, indent=2, ensure_ascii=False))
        else:
            print(f"错误: {response.text}")
    except Exception as e:
        print(f"请求异常: {str(e)}")

if __name__ == "__main__":
    # 替换为实际的管理员用户名和密码
    username = 'admin'
    password = 'admin123'
    
    token = login_and_get_token(username, password)
    if token:
        print(f"成功获取令牌: {token[:10]}...")
        test_tenant_comprehensive_view(token)
    else:
        print("无法获取认证令牌，测试终止") 