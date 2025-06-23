import requests
import json

def test_articles_api():
    """测试文章API请求"""
    # 超级管理员登录
    login_url = "http://localhost:8000/api/v1/auth/login/"
    login_data = {
        "username": "admin456",
        "password": "admin456"
    }
    
    print("\n===== 超级管理员登录 =====")
    login_response = requests.post(login_url, json=login_data)
    
    if login_response.status_code == 200:
        login_result = login_response.json()
        token = login_result.get("data", {}).get("token")
        print(f"登录成功，获取到令牌: {token[:10]}...")
        
        # 设置请求头
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "X-Debug-Log": "true"  # 启用浏览器控制台日志
        }
        
        # 测试文章API（不提供X-Tenant-ID）
        print("\n===== 测试文章API（不提供X-Tenant-ID） =====")
        articles_url = "http://localhost:8000/api/v1/cms/articles/"
        response = requests.get(articles_url, headers=headers)
        
        print(f"状态码: {response.status_code}")
        try:
            result = response.json()
            print("响应头:")
            for key, value in response.headers.items():
                if key.startswith('X-Debug'):
                    print(f"  {key}: {value}")
            
            print("\n响应内容:")
            if "debug_logs" in result:
                debug_logs = result.pop("debug_logs")
                print(json.dumps(result, indent=2, ensure_ascii=False))
                
                print("\n调试日志:")
                for log in debug_logs:
                    level = log.get("level", "info")
                    message = log.get("message", "")
                    if "用户" in message and ("超级管理员" in message or "租户管理员" in message or "角色" in message):
                        print(f"[{level}] {message}")
            else:
                print(json.dumps(result, indent=2, ensure_ascii=False))
        except Exception as e:
            print(f"解析响应失败: {str(e)}")
            print(response.text)
        
        # 测试文章API（提供X-Tenant-ID）
        print("\n===== 测试文章API（提供X-Tenant-ID） =====")
        headers["X-Tenant-ID"] = "1"  # 假设租户ID为1
        response = requests.get(articles_url, headers=headers)
        
        print(f"状态码: {response.status_code}")
        try:
            result = response.json()
            print("响应头:")
            for key, value in response.headers.items():
                if key.startswith('X-Debug'):
                    print(f"  {key}: {value}")
            
            print("\n响应内容:")
            if "debug_logs" in result:
                debug_logs = result.pop("debug_logs")
                print(json.dumps(result, indent=2, ensure_ascii=False))
                
                print("\n调试日志:")
                for log in debug_logs:
                    level = log.get("level", "info")
                    message = log.get("message", "")
                    if "用户" in message and ("超级管理员" in message or "租户管理员" in message or "角色" in message):
                        print(f"[{level}] {message}")
            else:
                print(json.dumps(result, indent=2, ensure_ascii=False))
        except Exception as e:
            print(f"解析响应失败: {str(e)}")
            print(response.text)
    else:
        print(f"登录失败: {login_response.status_code}")
        print(login_response.text)

if __name__ == "__main__":
    test_articles_api() 