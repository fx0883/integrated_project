from django.urls import path
from . import views

app_name = 'charts'
 
urlpatterns = [
    path('tenant-trend/', views.TenantTrendChartView.as_view(), name='tenant-trend'),
    path('tenant-status-distribution/', views.TenantStatusDistributionView.as_view(), name='tenant-status-distribution'),
    path('tenant-creation-rate/', views.TenantCreationRateView.as_view(), name='tenant-creation-rate'),
] 