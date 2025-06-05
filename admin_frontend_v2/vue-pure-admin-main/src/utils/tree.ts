/**
 * @description 提取菜单树中的每一项uniqueId
 * @param tree 树
 * @param seen 用于检测循环引用的Set
 * @returns 每一项uniqueId组成的数组
 */
export const extractPathList = (tree: any[], seen = new Set<any>()): any => {
  if (!Array.isArray(tree)) {
    console.warn("tree must be an array");
    return [];
  }
  if (!tree || tree.length === 0) return [];
  const expandedPaths: Array<number | string> = [];
  
  for (const node of tree) {
    if (seen.has(node)) {
      console.warn(`提取路径时检测到循环引用: ${node.path || node.name || node.uniqueId}`);
      continue;
    }
    
    seen.add(node);
    
    const hasChildren = node.children && node.children.length > 0;
    if (hasChildren) {
      // 为子节点创建一个新的Set来检测循环引用
      const childSeen = new Set(seen);
      extractPathList(node.children, childSeen);
    }
    expandedPaths.push(node.uniqueId);
  }
  return expandedPaths;
};

/**
 * @description 如果父级下children的length为1，删除children并自动组建唯一uniqueId
 * @param tree 树
 * @param pathList 每一项的id组成的数组
 * @param seen 用于检测循环引用的Set
 * @returns 组件唯一uniqueId后的树
 */
export const deleteChildren = (tree: any[], pathList = [], seen = new Set<any>()): any => {
  if (!Array.isArray(tree)) {
    console.warn("menuTree must be an array");
    return [];
  }
  if (!tree || tree.length === 0) return [];
  
  for (const [key, node] of tree.entries()) {
    if (seen.has(node)) {
      console.warn(`删除子节点时检测到循环引用: ${node.path || node.name || key}`);
      continue;
    }
    
    seen.add(node);
    
    if (node.children && node.children.length === 1) delete node.children;
    node.id = key;
    node.parentId = pathList.length ? pathList[pathList.length - 1] : null;
    node.pathList = [...pathList, node.id];
    node.uniqueId =
      node.pathList.length > 1 ? node.pathList.join("-") : node.pathList[0];
      
    const hasChildren = node.children && node.children.length > 0;
    if (hasChildren) {
      // 为子节点创建一个新的Set来检测循环引用
      const childSeen = new Set(seen);
      deleteChildren(node.children, node.pathList, childSeen);
    }
  }
  return tree;
};

/**
 * @description 创建层级关系
 * @param tree 树
 * @param pathList 每一项的id组成的数组
 * @param seen 用于检测循环引用的Set
 * @returns 创建层级关系后的树
 */
export const buildHierarchyTree = (tree: any[], pathList = [], seen = new Set()): any => {
  if (!Array.isArray(tree)) {
    console.warn("tree must be an array");
    return [];
  }
  if (!tree || tree.length === 0) return [];
  
  for (const [key, node] of tree.entries()) {
    if (seen.has(node)) {
      console.warn(`检测到循环引用: ${node.path || node.name || key}`);
      continue; // 跳过循环引用的节点
    }
    
    // 添加当前节点到已访问集合
    seen.add(node);
    
    node.id = key;
    node.parentId = pathList.length ? pathList[pathList.length - 1] : null;
    node.pathList = [...pathList, node.id];
    
    const hasChildren = node.children && node.children.length > 0;
    if (hasChildren) {
      // 为子节点创建一个新的Set来检测循环引用，避免影响兄弟节点的处理
      const childSeen = new Set(seen);
      buildHierarchyTree(node.children, node.pathList, childSeen);
    }
  }
  return tree;
};

/**
 * @description 广度优先遍历，根据唯一uniqueId找当前节点信息
 * @param tree 树
 * @param uniqueId 唯一uniqueId
 * @param seen 用于检测循环引用的Set
 * @returns 当前节点信息
 */
export const getNodeByUniqueId = (
  tree: any[],
  uniqueId: number | string,
  seen = new Set<any>()
): any => {
  if (!Array.isArray(tree)) {
    console.warn("menuTree must be an array");
    return [];
  }
  if (!tree || tree.length === 0) return [];
  
  // 过滤掉已经处理过的节点，防止循环引用
  const filteredTree = tree.filter(node => !seen.has(node));
  
  // 如果过滤后的树为空，说明所有节点都已处理过，可能存在循环引用
  if (filteredTree.length === 0) return null;
  
  // 标记当前层级的所有节点为已处理
  filteredTree.forEach(node => seen.add(node));
  
  // 在当前层级查找匹配的节点
  const item = filteredTree.find(node => node.uniqueId === uniqueId);
  if (item) return item;
  
  // 获取所有子节点进行下一层级搜索
  const childrenList = filteredTree
    .filter(node => node.children && node.children.length > 0)
    .map(i => i.children)
    .flat(1) as unknown;
  
  if (!childrenList || (Array.isArray(childrenList) && childrenList.length === 0)) {
    return null;
  }
  
  return getNodeByUniqueId(childrenList as any[], uniqueId, seen);
};

/**
 * @description 向当前唯一uniqueId节点中追加字段
 * @param tree 树
 * @param uniqueId 唯一uniqueId
 * @param fields 需要追加的字段
 * @param seen 用于检测循环引用的Set
 * @returns 追加字段后的树
 */
export const appendFieldByUniqueId = (
  tree: any[],
  uniqueId: number | string,
  fields: object,
  seen = new Set<any>()
): any => {
  if (!Array.isArray(tree)) {
    console.warn("menuTree must be an array");
    return [];
  }
  if (!tree || tree.length === 0) return [];
  
  for (const node of tree) {
    // 检测循环引用
    if (seen.has(node)) {
      console.warn(`追加字段时检测到循环引用: ${node.path || node.name || node.uniqueId}`);
      continue;
    }
    
    seen.add(node);
    
    if (
      node.uniqueId === uniqueId &&
      Object.prototype.toString.call(fields) === "[object Object]"
    ) {
      Object.assign(node, fields);
    }
    
    const hasChildren = node.children && node.children.length > 0;
    if (hasChildren) {
      // 为子节点创建一个新的Set来检测循环引用
      const childSeen = new Set(seen);
      appendFieldByUniqueId(node.children, uniqueId, fields, childSeen);
    }
  }
  return tree;
};

/**
 * @description 构造树型结构数据
 * @param data 数据源
 * @param id id字段 默认id
 * @param parentId 父节点字段，默认parentId
 * @param children 子节点字段，默认children
 * @returns 追加字段后的树
 */
export const handleTree = (
  data: any[],
  id?: string,
  parentId?: string,
  children?: string
): any => {
  if (!Array.isArray(data)) {
    console.warn("data must be an array");
    return [];
  }

  // 深拷贝原始数据，避免对原始数据的修改
  const clonedData = JSON.parse(JSON.stringify(data));
  
  const config = {
    id: id || "id",
    parentId: parentId || "parentId",
    childrenList: children || "children"
  };

  const childrenListMap: any = {};
  const nodeIds: any = {};
  const tree = [];

  // 第一次遍历构建childrenListMap和nodeIds映射
  for (const d of clonedData) {
    const parentId = d[config.parentId];
    if (childrenListMap[parentId] == null) {
      childrenListMap[parentId] = [];
    }
    nodeIds[d[config.id]] = d;
    childrenListMap[parentId].push(d);
  }

  // 第二次遍历找出根节点
  for (const d of clonedData) {
    const parentId = d[config.parentId];
    if (nodeIds[parentId] == null) {
      tree.push(d);
    }
  }

  // 使用一个集合来检测循环引用
  const seen = new Set();
  
  // 自适应子节点列表
  function adaptToChildrenList(o: Record<string, any>) {
    // 检测循环引用
    if (seen.has(o)) {
      console.warn(`构造树型数据时检测到循环引用: ${o.name || o.path || o[config.id]}`);
      return;
    }
    
    // 将当前节点加入已处理集合
    seen.add(o);
    
    // 为当前节点添加子节点
    if (childrenListMap[o[config.id]] !== null && childrenListMap[o[config.id]] !== undefined) {
      o[config.childrenList] = childrenListMap[o[config.id]];
    }
    
    // 递归处理子节点
    if (o[config.childrenList] && o[config.childrenList].length > 0) {
      for (const c of o[config.childrenList]) {
        adaptToChildrenList(c);
      }
    }
  }
  
  // 处理每个根节点
  for (const t of tree) {
    adaptToChildrenList(t);
  }
  
  return tree;
};
