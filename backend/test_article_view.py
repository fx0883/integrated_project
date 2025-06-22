import requests

def test_article_view_api():
    url = 'http://localhost:8000/api/v1/cms/articles/14/view/'
    headers = {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozNCwidXNlcm5hbWUiOiJhZG1pbl9jbXMiLCJleHAiOjE3NTA2MDEyODgsIm1vZGVsX3R5cGUiOiJ1c2VyIiwiaXNfYWRtaW4iOnRydWUsImlzX3N1cGVyX2FkbWluIjpmYWxzZX0.bShYgGJR1ILcWpoMG98WFxKvJF96imGIFOzyotkIeqc',
        'Content-Type': 'application/json'
    }
    data = {
        'session_id': 'test_session',
        'reading_time': 10,
        'referrer': 'test_referrer'
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        print(f'Status code: {response.status_code}')
        print(f'Response: {response.text}')
    except Exception as e:
        print(f'Error: {e}')

if __name__ == '__main__':
    test_article_view_api() 