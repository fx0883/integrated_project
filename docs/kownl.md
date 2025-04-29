authenticate方法的返回值(user, token)被Django REST Framework的认证系统直接使用。整个过程如下：
请求进入系统：当API请求到达Django REST Framework时
认证系统处理：
DRF遍历settings.py中的DEFAULT_AUTHENTICATION_CLASSES配置的所有认证类
对每个认证类调用其authenticate()方法
在这里，就是调用JWTAuthentication.authenticate()
处理返回值：
如果返回None：跳过并尝试下一个认证类
如果返回(user, token)元组：
DRF自动将user对象设置到request.user
将token设置到request.auth
停止尝试其他认证类
如果抛出AuthenticationFailed异常：认证失败，请求被拒绝
使用认证结果：
视图中通过self.request.user访问这个已认证的用户
权限类利用request.user检查用户是否有权限访问资源
这种机制使得开发者无需手动管理用户认证流程，只需配置好认证类，然后在视图中直接使用request.user即可获取当前认证的用户。
当你在视图中使用self.request.user时，就是在访问JWT认证系统成功验证并返回的那个用户对象。