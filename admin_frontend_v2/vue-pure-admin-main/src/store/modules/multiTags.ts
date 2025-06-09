import { defineStore } from "pinia";
import {
  type multiType,
  type positionType,
  store,
  isUrl,
  isEqual,
  isNumber,
  isBoolean,
  getConfig,
  routerArrays,
  storageLocal,
  responsiveStorageNameSpace
} from "../utils";
import { usePermissionStoreHook } from "./permission";

export const useMultiTagsStore = defineStore("pure-multiTags", {
  state: () => ({
    // 存储标签页信息（路由信息）
    multiTags: storageLocal().getItem<StorageConfigs>(
      `${responsiveStorageNameSpace()}configure`
    )?.multiTagsCache
      ? storageLocal().getItem<StorageConfigs>(
          `${responsiveStorageNameSpace()}tags`
        )
      : ([
          // 初始只保留一个首页标签，不再添加其他固定标签
          ...routerArrays
          // 移除固定标签，避免初始加载时显示多个标签
          // ...usePermissionStoreHook().flatteningRoutes.filter(
          //   v => v?.meta?.fixedTag
          // )
        ] as any),
    multiTagsCache: storageLocal().getItem<StorageConfigs>(
      `${responsiveStorageNameSpace()}configure`
    )?.multiTagsCache
  }),
  getters: {
    getMultiTagsCache(state) {
      return state.multiTagsCache;
    }
  },
  actions: {
    multiTagsCacheChange(multiTagsCache: boolean) {
      this.multiTagsCache = multiTagsCache;
      if (multiTagsCache) {
        storageLocal().setItem(
          `${responsiveStorageNameSpace()}tags`,
          this.multiTags
        );
      } else {
        storageLocal().removeItem(`${responsiveStorageNameSpace()}tags`);
      }
    },
    tagsCache(multiTags) {
      this.getMultiTagsCache &&
        storageLocal().setItem(
          `${responsiveStorageNameSpace()}tags`,
          multiTags
        );
    },
    handleTags<T>(
      mode: string,
      value?: T | multiType,
      position?: positionType
    ): T {
      switch (mode) {
        case "equal":
          // 确保不会覆盖所有标签，只添加新标签
          if (Array.isArray(value) && value.length > 0) {
            // 如果是设置初始标签，则只保留一个首页标签
            if (this.multiTags.length === 0) {
              // 只保留第一个标签（首页）
              const firstTag = Array.isArray(value) && value.length > 0 ? value[0] : value;
              this.multiTags = [firstTag];
            } else {
              // 否则合并标签，保留现有标签
              const newTags = Array.isArray(value) ? value : [value];
              
              // 过滤掉已存在的标签
              const uniqueTags = newTags.filter(newTag => {
                return !this.multiTags.some(existingTag => 
                  existingTag.path === newTag.path && 
                  isEqual(existingTag.query, newTag.query) && 
                  isEqual(existingTag.params, newTag.params)
                );
              });
              
              // 添加新标签
              this.multiTags = [...this.multiTags, ...uniqueTags];
            }
          } else {
            this.multiTags = value;
          }
          this.tagsCache(this.multiTags);
          break;
        case "push":
          {
            const tagVal = value as multiType;
            // 不添加到标签页
            if (tagVal?.meta?.hiddenTag) return;
            // 如果是外链无需添加信息到标签页
            if (isUrl(tagVal?.name)) return;
            // 如果title为空拒绝添加空信息到标签页
            if (tagVal?.meta?.title.length === 0) return;
            // showLink:false 不添加到标签页
            if (isBoolean(tagVal?.meta?.showLink) && !tagVal?.meta?.showLink)
              return;
            const tagPath = tagVal.path;
            
            // 检查是否已存在相同的标签（路径、查询参数和路由参数都相同）
            const tagExists = this.multiTags.some(tag => {
              return tag.path === tagPath && 
                     isEqual(tag?.query, tagVal?.query) && 
                     isEqual(tag?.params, tagVal?.params);
            });

            // 如果标签已存在，不再添加
            if (tagExists) return;

            // 动态路由可打开的最大数量
            const dynamicLevel = tagVal?.meta?.dynamicLevel ?? -1;
            if (dynamicLevel > 0) {
              if (
                this.multiTags.filter(e => e?.path === tagPath).length >=
                dynamicLevel
              ) {
                // 如果当前已打开的动态路由数大于dynamicLevel，替换第一个动态路由标签
                const index = this.multiTags.findIndex(
                  item => item?.path === tagPath
                );
                index !== -1 && this.multiTags.splice(index, 1);
              }
            }
            
            // 添加新标签
            this.multiTags.push(value);
            this.tagsCache(this.multiTags);
            
            // 处理最大标签数量限制
            if (
              getConfig()?.MaxTagsLevel &&
              isNumber(getConfig().MaxTagsLevel)
            ) {
              if (this.multiTags.length > getConfig().MaxTagsLevel) {
                // 保留第一个标签（首页），移除第二个标签
                this.multiTags.splice(1, 1);
              }
            }
          }
          break;
        case "splice":
          if (!position) {
            const index = this.multiTags.findIndex(v => v.path === value);
            if (index === -1) return;
            this.multiTags.splice(index, 1);
          } else {
            this.multiTags.splice(position?.startIndex, position?.length);
          }
          this.tagsCache(this.multiTags);
          return this.multiTags;
        case "slice":
          return this.multiTags.slice(-1);
      }
    }
  }
});

export function useMultiTagsStoreHook() {
  return useMultiTagsStore(store);
}
