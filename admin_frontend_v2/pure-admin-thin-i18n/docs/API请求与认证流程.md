# API请求与认证流程

本文档详细介绍了系统中API请求、Token刷新以及登录的完整逻辑流程。

## 1. API请求流程

### 1.1 请求拦截器工作流程

系统使用Axios作为HTTP客户端，并通过拦截器处理请求和响应。以下是请求拦截器的工作流程：

1. **初始化请求**：当发起一个API请求时，请求首先经过请求拦截器处理。

2. **进度条处理**：启动NProgress进度条动画，提供视觉反馈。

3. **自定义回调处理**：
   - 检查是否传入了自定义的`beforeRequestCallback`回调函数
   - 如果有，执行该回调函数处理配置

4. **CSRF Token处理**：
   - 从cookie中获取`csrftoken`
   - 如果存在，将其添加到请求头的`X-CSRFTOKEN`字段中

5. **白名单检查**：
   - 检查请求URL是否在白名单中（如`/auth/login`和`/auth/refresh`）
   - 如果在白名单中，直接发送请求，不添加认证token

6. **Token处理**：
   - 如果不在白名单中，获取存储的token信息
   - 检查token是否存在
   - 如果存在，检查token是否过期

7. **Token过期处理**：
   - 如果token已过期且当前没有正在进行的刷新token请求：
     - 标记正在刷新token
     - 使用refresh_token调用刷新token接口
     - 获取新token后更新请求头并执行所有等待的请求
   - 如果token已过期且当前正在刷新token，将请求加入等待队列
   - 如果token未过期，直接添加token到请求头并发送请求

8. **发送请求**：完成上述处理后，发送HTTP请求。

```javascript
// 请求拦截器核心代码
private httpInterceptorsRequest(): void {
  PureHttp.axiosInstance.interceptors.request.use(
    async (config: PureHttpRequestConfig): Promise<any> => {
      // 开启进度条动画
      NProgress.start();
      
      // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
      if (typeof config.beforeRequestCallback === "function") {
        config.beforeRequestCallback(config);
        return config;
      }
      if (PureHttp.initConfig.beforeRequestCallback) {
        PureHttp.initConfig.beforeRequestCallback(config);
        return config;
      }
      
      // 添加CSRF Token
      const csrfToken = document.cookie.match(/csrftoken=([^;]*)/)?.[1];
      if (csrfToken) {
        config.headers["X-CSRFTOKEN"] = csrfToken;
      }
      
      // 请求白名单处理
      const whiteList = ["/auth/refresh", "/auth/login"];
      return whiteList.some(url => config.url.endsWith(url))
        ? config
        : new Promise(resolve => {
            const data = getToken();
            if (data) {
              const now = new Date().getTime();
              const expired = parseInt(data.expires) - now <= 0;
              if (expired) {
                if (!PureHttp.isRefreshing) {
                  PureHttp.isRefreshing = true;
                  // token过期刷新
                  useUserStoreHook()
                    .handRefreshToken({ refresh_token: data.refreshToken })
                    .then(res => {
                      const token = res.data.token;
                      config.headers["Authorization"] = formatToken(token);
                      PureHttp.requests.forEach(cb => cb(token));
                      PureHttp.requests = [];
                    })
                    .finally(() => {
                      PureHttp.isRefreshing = false;
                    });
                }
                resolve(PureHttp.retryOriginalRequest(config));
              } else {
                config.headers["Authorization"] = formatToken(
                  data.accessToken
                );
                resolve(config);
              }
            } else {
              resolve(config);
            }
          });
    },
    error => {
      return Promise.reject(error);
    }
  );
}
```

### 1.2 响应拦截器工作流程

1. **接收响应**：当服务器返回响应时，响应拦截器首先处理该响应。

2. **进度条处理**：关闭NProgress进度条动画。

3. **自定义回调处理**：
   - 检查是否传入了自定义的`beforeResponseCallback`回调函数
   - 如果有，执行该回调函数处理响应

4. **数据提取**：从响应对象中提取data部分，简化后续处理。

5. **错误处理**：
   - 如果响应出错，标记是否为取消请求
   - 关闭进度条动画
   - 返回错误信息

```javascript
// 响应拦截器核心代码
private httpInterceptorsResponse(): void {
  const instance = PureHttp.axiosInstance;
  instance.interceptors.response.use(
    (response: PureHttpResponse) => {
      const $config = response.config;
      // 关闭进度条动画
      NProgress.done();
      // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
      if (typeof $config.beforeResponseCallback === "function") {
        $config.beforeResponseCallback(response);
        return response.data;
      }
      if (PureHttp.initConfig.beforeResponseCallback) {
        PureHttp.initConfig.beforeResponseCallback(response);
        return response.data;
      }
      return response.data;
    },
    (error: PureHttpError) => {
      const $error = error;
      $error.isCancelRequest = Axios.isCancel($error);
      // 关闭进度条动画
      NProgress.done();
      // 所有的响应异常 区分来源为取消请求/非取消请求
      return Promise.reject($error);
    }
  );
}
```

## 2. Token刷新逻辑

### 2.1 Token刷新流程

1. **触发条件**：当系统检测到访问token已过期时，会触发token刷新流程。

2. **防重复刷新**：
   - 使用`isRefreshing`标志防止重复刷新token
   - 如果已经在刷新中，将新请求加入等待队列

3. **刷新请求**：
   - 调用`handRefreshToken`方法发送刷新token请求
   - 传入当前的refresh_token作为参数

4. **处理响应**：
   - 如果刷新成功，从响应中获取新的token和refresh_token
   - 更新存储的token信息
   - 使用新token重试之前失败的请求

5. **错误处理**：
   - 如果刷新失败（如refresh_token也已过期），清除token信息
   - 重定向到登录页面

```javascript
// Token刷新核心代码
async handRefreshToken(data) {
  return new Promise<RefreshTokenResult>((resolve, reject) => {
    refreshTokenApi(data)
      .then(data => {
        if (data?.success) {
          // 适配后端返回的数据结构
          const { token, refresh_token } = data.data;
          const userData = {
            accessToken: token,
            refreshToken: refresh_token,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 假设token有效期为24小时
          };
          setToken(userData);
        }
        resolve(data);
      })
      .catch(error => {
        reject(error);
      });
  });
}
```

### 2.2 Token存储机制

系统使用两种存储方式来保存token信息：

1. **Cookie存储**：
   - 将`accessToken`、`expires`和`refreshToken`存储在名为`authorized-token`的cookie中
   - 设置cookie过期时间为token的过期时间
   - 用于跨标签页共享token信息

2. **LocalStorage存储**：
   - 将完整的用户信息（包括token、用户资料、权限等）存储在localStorage中
   - 键名为`user-info`
   - 用于快速访问用户信息

```javascript
// Token存储核心代码
export function setToken(data: DataInfo<Date>) {
  let expires = 0;
  const { accessToken, refreshToken } = data;
  const { isRemembered, loginDay } = useUserStoreHook();
  
  // 设置过期时间
  expires = new Date(data.expires).getTime();
  const cookieString = JSON.stringify({ accessToken, expires, refreshToken });

  expires > 0
    ? Cookies.set(TokenKey, cookieString, {
        expires: (expires - Date.now()) / 86400000
      })
    : Cookies.set(TokenKey, cookieString);

  // 设置多标签页标识
  Cookies.set(
    multipleTabsKey,
    "true",
    isRemembered
      ? {
          expires: loginDay
        }
      : {}
  );
  
  // 存储用户信息到localStorage
  storageLocal().setItem(userKey, {
    refreshToken,
    expires,
    id: data.id,
    // ... 其他用户信息字段
    roles: data.roles,
    permissions: data.permissions
  });
}
```

## 3. 登录完整逻辑

### 3.1 登录流程

1. **表单验证**：
   - 用户输入用户名和密码
   - 前端进行表单验证（必填项、格式等）

2. **提交登录请求**：
   - 验证通过后，调用`loginByUsername`方法
   - 发送POST请求到`/auth/login`接口，携带用户名和密码

3. **处理登录响应**：
   - 接收服务器返回的响应
   - 检查`success`字段和`code`字段（预期成功为`success: true`和`code: 2000`）

4. **成功处理**：
   - 如果登录成功，从响应中提取token、refresh_token和用户信息
   - 构建用户数据对象，包括：
     - 认证信息：accessToken、refreshToken、过期时间
     - 用户基本信息：id、username、nick_name、email等
     - 用户角色信息：根据is_super_admin和is_admin生成roles数组
     - 权限信息：默认设置为["*:*:*"]（全部权限）
   - 调用`setToken`方法存储用户信息

5. **初始化路由**：
   - 调用`initRouter`方法初始化路由
   - 根据用户角色和权限生成可访问的路由

6. **跳转首页**：
   - 获取顶部菜单并跳转到相应页面
   - 显示登录成功提示信息

7. **错误处理**：
   - 如果登录失败，显示错误信息
   - 保持在登录页面

```javascript
// 登录逻辑核心代码
const onLogin = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(valid => {
    if (valid) {
      loading.value = true;
      useUserStoreHook()
        .loginByUsername({
          username: ruleForm.username,
          password: ruleForm.password
        })
        .then(res => {
          if (res.success && res.code === 2000) {
            // 获取后端路由
            return initRouter().then(() => {
              disabled.value = true;
              router
                .push(getTopMenu(true).path)
                .then(() => {
                  message(res.message || t("login.pureLoginSuccess"), { type: "success" });
                })
                .finally(() => (disabled.value = false));
            });
          } else {
            message(res.message || t("login.pureLoginFail"), { type: "error" });
          }
        })
        .finally(() => (loading.value = false));
    }
  });
};
```

### 3.2 登录接口实现

```javascript
// 登录API调用实现
async loginByUsername(data) {
  return new Promise<UserResult>((resolve, reject) => {
    getLogin(data)
      .then(data => {
        if (data?.success) {
          // 适配后端返回的数据结构
          const { token, refresh_token, user } = data.data;
          const userData = {
            accessToken: token,
            refreshToken: refresh_token,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 假设token有效期为24小时
            id: user.id,
            username: user.username,
            nick_name: user.nick_name,
            email: user.email,
            is_admin: user.is_admin,
            is_super_admin: user.is_super_admin,
            is_member: user.is_member || false,
            phone: user.phone || "",
            status: user.status || "active",
            last_login_ip: user.last_login_ip || "",
            tenant: user.tenant,
            parent: user.parent,
            avatar: user.avatar || "",
            roles: [user.is_super_admin ? "super" : (user.is_admin ? "admin" : "member")],
            permissions: ["*:*:*"] // 假设拥有所有权限，根据实际情况调整
          };
          setToken(userData);
        }
        resolve(data);
      })
      .catch(error => {
        reject(error);
      });
  });
}
```

### 3.3 登出流程

1. **清除用户信息**：
   - 重置用户名、角色和权限信息
   - 调用`removeToken`方法删除存储的token

2. **重置路由**：
   - 重置标签页
   - 重置路由配置

3. **跳转登录页**：
   - 重定向到登录页面

```javascript
// 登出逻辑核心代码
logOut() {
  this.username = "";
  this.roles = [];
  this.permissions = [];
  removeToken();
  useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
  resetRouter();
  router.push("/login");
}
```

## 4. 数据流转图

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  登录表单提交   │────▶│  API请求拦截器  │────▶│   服务器处理    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   存储用户信息  │◀────│  API响应拦截器  │◀────│   响应返回      │
│                 │     │                 │     │                 │
└────────┬────────┘     └─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│   初始化路由    │────▶│   跳转首页      │
│                 │     │                 │
└─────────────────┘     └─────────────────┘


Token刷新流程:

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  检测Token过期  │────▶│  刷新Token请求  │────▶│   服务器处理    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  更新存储Token  │◀────│  获取新Token    │◀────│   响应返回      │
│                 │     │                 │     │                 │
└────────┬────────┘     └─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│                 │
│  重试原始请求   │
│                 │
└─────────────────┘
```

## 5. 注意事项

1. **Token过期时间**：系统假设token有效期为24小时，如果实际过期时间不同，需要调整代码。

2. **CSRF Token**：系统从cookie中获取`csrftoken`并添加到请求头中，确保与后端CSRF保护机制兼容。

3. **角色映射**：系统根据`is_super_admin`和`is_admin`字段映射为"super"、"admin"和"member"角色，如需更复杂的角色映射，需要进一步调整。

4. **权限控制**：目前假设用户拥有所有权限（"*:*:*"），如需更细粒度的权限控制，需要从后端获取具体的权限列表。

5. **多标签页支持**：系统通过cookie中的`multiple-tabs`标识支持多标签页打开已登录的系统，浏览器完全关闭后需要重新登录。 