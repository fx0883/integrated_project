import editForm from "../form.vue";
import { handleTree } from "@/utils/tree";
import { message } from "@/utils/message";
import { transformI18n } from "@/plugins/i18n";
import { addDialog } from "@/components/ReDialog";
import { reactive, ref, onMounted, h } from "vue";
import type { FormItemProps } from "../utils/types";
import { menuApi } from "@/api/menu";
import { ElMessageBox } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { cloneDeep, isAllEmpty, deviceDetection } from "@pureadmin/utils";

export function useMenu() {
  const form = reactive({
    title: ""
  });

  const formRef = ref();
  const dataList = ref([]);
  const loading = ref(true);

  const getMenuType = (type, text = false) => {
    switch (type) {
      case 0:
        return text ? "菜单" : "primary";
      case 1:
        return text ? "iframe" : "warning";
      case 2:
        return text ? "外链" : "danger";
      case 3:
        return text ? "按钮" : "info";
    }
  };

  const columns: TableColumnList = [
    {
      label: "菜单名称",
      prop: "title",
      align: "left",
      cellRenderer: ({ row }) => (
        <div class="flex items-center">
          <span class="inline-block mr-1">
            {h(useRenderIcon(row.icon), {
              style: { paddingTop: "1px" }
            })}
          </span>
          <span>{transformI18n(row.title)}</span>
        </div>
      )
    },
    {
      label: "菜单类型",
      prop: "menuType",
      width: 100,
      cellRenderer: ({ row, props }) => (
        <el-tag
          size={props.size}
          type={getMenuType(row.menuType)}
          effect="plain"
        >
          {getMenuType(row.menuType, true)}
        </el-tag>
      )
    },
    {
      label: "路由路径",
      prop: "path"
    },
    {
      label: "组件路径",
      prop: "component",
      formatter: ({ path, component }) =>
        isAllEmpty(component) ? path : component
    },
    {
      label: "权限标识",
      prop: "auths"
    },
    {
      label: "排序",
      prop: "rank",
      width: 100
    },
    {
      label: "状态",
      prop: "is_active",
      width: 100,
      formatter: ({ is_active }) => (is_active ? "启用" : "禁用")
    },
    {
      label: "操作",
      fixed: "right",
      width: 210,
      slot: "operation"
    }
  ];

  function handleSelectionChange(val) {
    console.log("handleSelectionChange", val);
  }

  function resetForm(formEl) {
    if (!formEl) return;
    formEl.resetFields();
    onSearch();
  }

  async function onSearch() {
    loading.value = true;
    try {
      // 使用新的API获取菜单树
      const { data } = await menuApi.getMenuTree();
      let menus = data || [];
      
      // 将后端返回的菜单数据转换为前端需要的格式
      const transformMenuData = (menuList) => {
        return menuList.map(menu => ({
          id: menu.id,
          title: menu.name,
          menuType: 0, // 默认为菜单类型
          name: menu.code,
          path: menu.path || '',
          component: menu.component || '',
          rank: menu.order || 0,
          icon: menu.icon || '',
          is_active: menu.is_active,
          parentId: menu.parent_id,
          children: menu.children && menu.children.length > 0 
                    ? transformMenuData(menu.children) 
                    : undefined
        }));
      };
      
      let transformedMenus = transformMenuData(menus);
      
      if (!isAllEmpty(form.title)) {
        // 前端搜索菜单名称
        const filterMenus = (items) => {
          const result = [];
          for (const item of items) {
            const matchesSearch = transformI18n(item.title).toLowerCase().includes(form.title.toLowerCase());
            
            let filteredChildren = [];
            if (item.children && item.children.length > 0) {
              filteredChildren = filterMenus(item.children);
            }
            
            if (matchesSearch || filteredChildren.length > 0) {
              const cloneItem = { ...item };
              if (filteredChildren.length > 0) {
                cloneItem.children = filteredChildren;
              }
              result.push(cloneItem);
            }
          }
          return result;
        };
        
        transformedMenus = filterMenus(transformedMenus);
      }
      
      dataList.value = transformedMenus;
    } catch (error) {
      console.error("获取菜单数据失败:", error);
      message("获取菜单数据失败，请稍后重试", { type: "error" });
    } finally {
      loading.value = false;
    }
  }

  function formatHigherMenuOptions(treeList) {
    if (!treeList || !treeList.length) return;
    const newTreeList = [];
    for (let i = 0; i < treeList.length; i++) {
      treeList[i].title = transformI18n(treeList[i].title);
      formatHigherMenuOptions(treeList[i].children);
      newTreeList.push(treeList[i]);
    }
    return newTreeList;
  }

  function openDialog(title = "新增", row?: FormItemProps) {
    addDialog({
      title: `${title}菜单`,
      props: {
        formInline: {
          menuType: row?.menuType ?? 0,
          higherMenuOptions: formatHigherMenuOptions(cloneDeep(dataList.value)),
          parentId: row?.parentId ?? 0,
          title: row?.title ?? "",
          name: row?.name ?? "",
          path: row?.path ?? "",
          component: row?.component ?? "",
          rank: row?.rank ?? 99,
          redirect: row?.redirect ?? "",
          icon: row?.icon ?? "",
          extraIcon: row?.extraIcon ?? "",
          enterTransition: row?.enterTransition ?? "",
          leaveTransition: row?.leaveTransition ?? "",
          activePath: row?.activePath ?? "",
          auths: row?.auths ?? "",
          frameSrc: row?.frameSrc ?? "",
          frameLoading: row?.frameLoading ?? true,
          keepAlive: row?.keepAlive ?? false,
          hiddenTag: row?.hiddenTag ?? false,
          fixedTag: row?.fixedTag ?? false,
          showLink: row?.showLink ?? true,
          showParent: row?.showParent ?? false,
          is_active: row?.is_active ?? true,
          id: row?.id
        }
      },
      width: "45%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(editForm, { ref: formRef, formInline: null }),
      beforeSure: async (done, { options }) => {
        const FormRef = formRef.value.getRef();
        const curData = options.props.formInline as FormItemProps;
        
        FormRef.validate(async valid => {
          if (valid) {
            try {
              const menuData = {
                name: curData.title,
                code: curData.name,
                icon: curData.icon,
                path: curData.path,
                component: curData.component,
                order: curData.rank,
                is_active: curData.is_active || true,
                parent_id: curData.parentId === 0 ? null : curData.parentId
              };
              
              if (title === "新增") {
                await menuApi.createMenu(menuData);
                message(`新增菜单 ${transformI18n(curData.title)} 成功`, { type: "success" });
              } else {
                await menuApi.updateMenu(curData.id, menuData);
                message(`更新菜单 ${transformI18n(curData.title)} 成功`, { type: "success" });
              }
              
              done(); // 关闭弹框
              onSearch(); // 刷新表格数据
            } catch (error) {
              console.error("操作菜单失败:", error);
              message("操作失败，请稍后重试", { type: "error" });
            }
          }
        });
      }
    });
  }

  async function handleDelete(row) {
    if (row.children && row.children.length > 0) {
      message("该菜单包含子菜单，无法直接删除", { type: "warning" });
      return;
    }
    
    ElMessageBox.confirm(
      `确定要删除菜单"${transformI18n(row.title)}"吗？此操作不可恢复。`,
      "提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    ).then(async () => {
      try {
        await menuApi.deleteMenu(row.id);
        message(`删除菜单 ${transformI18n(row.title)} 成功`, { type: "success" });
        onSearch();
      } catch (error) {
        console.error("删除菜单失败:", error);
        message("删除失败，请稍后重试", { type: "error" });
      }
    }).catch(() => {});
  }

  onMounted(() => {
    onSearch();
  });

  return {
    form,
    loading,
    columns,
    dataList,
    /** 搜索 */
    onSearch,
    /** 重置 */
    resetForm,
    /** 新增、修改菜单 */
    openDialog,
    /** 删除菜单 */
    handleDelete,
    handleSelectionChange
  };
}
