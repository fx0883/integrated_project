"""
菜单管理系统序列化器
"""
from rest_framework import serializers
from .models import Menu, UserMenu
from users.models import User


class MenuSerializer(serializers.ModelSerializer):
    """
    菜单序列化器
    """
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=Menu.objects.all(),
        source='parent',
        allow_null=True,
        required=False
    )

    class Meta:
        model = Menu
        fields = [
            'id', 'name', 'code', 'icon', 'path', 'component',
            'order', 'parent_id', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        """
        验证菜单数据
        """
        # 检查是否存在循环引用
        instance = self.instance
        parent = data.get('parent')
        
        if instance and parent:
            if instance.id == parent.id:
                raise serializers.ValidationError({"parent_id": "菜单不能将自己设为父菜单"})
            
            # 检查父菜单是否是当前菜单的子菜单
            descendants = instance.get_descendants()
            if parent in descendants:
                raise serializers.ValidationError({"parent_id": "不能将子菜单设为父菜单，这会导致循环引用"})
        
        return data


class MenuTreeSerializer(MenuSerializer):
    """
    菜单树形结构序列化器
    """
    children = serializers.SerializerMethodField()
    
    class Meta(MenuSerializer.Meta):
        fields = MenuSerializer.Meta.fields + ['children']
    
    def get_children(self, obj):
        """
        获取子菜单
        """
        # 过滤非活跃菜单
        if self.context.get('is_active') is not None:
            is_active = self.context.get('is_active')
            children = obj.children.filter(is_active=is_active)
        else:
            children = obj.children.all()
            
        serializer = MenuTreeSerializer(children, many=True, context=self.context)
        return serializer.data


class UserMenuSerializer(serializers.ModelSerializer):
    """
    用户菜单关联序列化器
    """
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='user'
    )
    menu_id = serializers.PrimaryKeyRelatedField(
        queryset=Menu.objects.all(),
        source='menu'
    )
    
    class Meta:
        model = UserMenu
        fields = ['id', 'user_id', 'menu_id', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserMenuDetailSerializer(serializers.ModelSerializer):
    """
    用户菜单详情序列化器
    """
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    menu_id = serializers.IntegerField(source='menu.id', read_only=True)
    menu_name = serializers.CharField(source='menu.name', read_only=True)
    menu_code = serializers.CharField(source='menu.code', read_only=True)
    
    class Meta:
        model = UserMenu
        fields = [
            'id', 'user_id', 'username', 'menu_id', 
            'menu_name', 'menu_code', 'is_active', 
            'created_at', 'updated_at'
        ]


class UserMenusSerializer(serializers.Serializer):
    """
    用于批量分配菜单给用户的序列化器
    """
    menu_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        required=True
    )


class UserMenuSerializer(serializers.ModelSerializer):
    """
    用户菜单序列化器
    """
    class Meta:
        model = Menu
        fields = ['id', 'name', 'code', 'icon', 'path', 'component', 'order'] 