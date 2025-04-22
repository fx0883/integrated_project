"""
URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API版本1路由
    path('api/v1/', include([
        # 认证相关路由
        path('auth/', include('users.urls.auth_urls', namespace='auth')),
        
        # 用户相关路由
        path('users/', include('users.urls.user_urls', namespace='users')),
        
        # 租户相关路由
        path('tenants/', include('tenants.urls', namespace='tenants')),
        
        # 通用功能路由
        path('common/', include('common.urls', namespace='common')),
        
        # API 文档
        path('schema/', SpectacularAPIView.as_view(), name='schema'),
        path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
        path('redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    ])),
]

# 在开发环境中提供静态和媒体文件
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
