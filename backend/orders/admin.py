from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Order, OrderHistory

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'customer', 'status', 'service_type', 
                   'language_direction', 'word_count', 'total_amount', 
                   'payment_status', 'created_at')
    list_filter = ('status', 'payment_status', 'service_type', 'language_direction')
    search_fields = ('order_number', 'customer__name', 'description')
    readonly_fields = ('order_number', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        (_('订单基本信息'), {
            'fields': ('order_number', 'customer', 'status', 'created_by')
        }),
        (_('服务和语种信息'), {
            'fields': ('service_type', 'language_direction', 'word_count', 'description')
        }),
        (_('人员信息'), {
            'fields': ('customer_contact', 'translator')
        }),
        (_('时间信息'), {
            'fields': ('start_date', 'due_date', 'delivery_date')
        }),
        (_('费用信息'), {
            'fields': ('unit_price', 'total_amount', 'translator_fee', 'other_costs')
        }),
        (_('支付信息'), {
            'fields': ('payment_status', 'payment_date', 'payment_method', 'payment_remarks')
        }),
        (_('发票和合同信息'), {
            'fields': ('invoice_status', 'invoice_info', 'contract_number', 'contract_info')
        }),
        (_('其他信息'), {
            'fields': ('remarks', 'attachments', 'tags')
        }),
        (_('系统信息'), {
            'fields': ('tenant', 'created_at', 'updated_at', 'is_deleted'),
            'classes': ('collapse',)
        }),
    )

@admin.register(OrderHistory)
class OrderHistoryAdmin(admin.ModelAdmin):
    list_display = ('order', 'version', 'modified_by', 'modified_at')
    list_filter = ('modified_at',)
    search_fields = ('order__order_number',)
    readonly_fields = ('order', 'version', 'modified_by', 'modified_at', 'change_details', 'snapshot')
    
    fieldsets = (
        (_('基本信息'), {
            'fields': ('order', 'version', 'modified_by', 'modified_at')
        }),
        (_('变更信息'), {
            'fields': ('change_details',)
        }),
        (_('快照信息'), {
            'fields': ('snapshot',)
        }),
    )
