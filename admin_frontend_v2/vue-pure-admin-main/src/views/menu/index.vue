// 从API获取菜单数据
const fetchMenus = async () => {
  loading.value = true;
  
  try {
    const response = await getMenuTree();
    if (response && response.success && response.data) {
      menus.value = response.data.list || [];
      console.log('获取菜单数据成功:', menus.value);
      
      nextTick(() => {
        expandAll();
      });
    } else {
      console.error('获取菜单数据失败:', response);
      ElMessage.error(response?.message || '获取菜单数据失败，请稍后重试');
    }
  } catch (error) {
    console.error('获取菜单数据失败:', error);
    ElMessage.error('获取菜单数据失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 删除菜单
const deleteMenuAction = async (id: number) => {
  loading.value = true;
  
  try {
    const response = await deleteMenu(id);
    if (response && response.success) {
      // 刷新菜单数据
      await fetchMenus();
      ElMessage.success('菜单删除成功');
    } else {
      ElMessage.error(response?.message || '删除失败');
    }
  } catch (error) {
    console.error('删除菜单失败:', error);
    ElMessage.error('删除菜单失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 提交表单
const submitForm = () => {
  if (!menuFormRef.value) return;
  
  menuFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitLoading.value = true;
      
      try {
        // 准备提交的数据
        const menuData = {
          name: menuForm.name,
          path: menuForm.path,
          component: menuForm.component,
          redirect: menuForm.redirect,
          meta: {
            title: menuForm.name, // 使用name作为title
            icon: menuForm.meta.icon,
            roles: menuForm.meta.roles
          },
          parent_id: menuForm.parent_id,
          sort: menuForm.sort,
          status: menuForm.status
        };
        
        let response;
        if (formType.value === 'create') {
          response = await createMenu(menuData);
        } else {
          response = await updateMenu(menuForm.id!, menuData);
        }
        
        if (response && response.success) {
          // 刷新菜单数据
          await fetchMenus();
          
          ElMessage.success(formType.value === 'create' ? '菜单创建成功' : '菜单更新成功');
          dialogVisible.value = false;
        } else {
          ElMessage.error(response?.message || (formType.value === 'create' ? '创建失败' : '更新失败'));
        }
      } catch (error) {
        console.error(formType.value === 'create' ? '创建菜单失败:' : '更新菜单失败:', error);
        ElMessage.error(formType.value === 'create' ? '创建菜单失败，请稍后重试' : '更新菜单失败，请稍后重试');
      } finally {
        submitLoading.value = false;
      }
    }
  });
}; 