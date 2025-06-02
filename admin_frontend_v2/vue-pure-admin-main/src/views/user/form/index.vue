<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="500px"
    destroy-on-close
    @closed="resetForm"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      label-position="right"
    >
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
      </el-form-item>
      <el-form-item label="昵称" prop="nickname">
        <el-input v-model="form.nickname" placeholder="请输入昵称" />
      </el-form-item>
      <el-form-item label="手机号码" prop="phone">
        <el-input v-model="form.phone" placeholder="请输入手机号码" />
      </el-form-item>
      <el-form-item v-if="!userId" label="密码" prop="password">
        <el-input
          v-model="form.password"
          type="password"
          placeholder="请输入密码"
          show-password
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio label="active">激活</el-radio>
          <el-radio label="inactive">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="管理员" prop="is_admin">
        <el-switch
          v-model="form.is_admin"
          :active-value="true"
          :inactive-value="false"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="submitForm">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, defineProps, defineEmits } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { getUserById, createUser, updateUser } from "@/api/user";
import type { UserCreateUpdateRequest } from "@/types/user";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: "新增用户"
  },
  userId: {
    type: Number,
    default: undefined
  }
});

const emit = defineEmits(["update:visible", "success"]);

const dialogVisible = ref(props.visible);
const loading = ref(false);
const formRef = ref<FormInstance>();

// 表单数据
const form = reactive<UserCreateUpdateRequest>({
  username: "",
  email: "",
  nickname: "",
  phone: "",
  password: "",
  status: "active",
  is_admin: false
});

// 表单验证规则
const rules = reactive<FormRules>({
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 20, message: "长度在 3 到 20 个字符", trigger: "blur" }
  ],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱地址", trigger: "blur" }
  ],
  password: [
    { required: !props.userId, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 30, message: "长度在 6 到 30 个字符", trigger: "blur" }
  ]
});

// 监听visible属性变化
watch(
  () => props.visible,
  (val) => {
    dialogVisible.value = val;
  }
);

// 监听dialogVisible变化，同步更新父组件
watch(
  () => dialogVisible.value,
  (val) => {
    emit("update:visible", val);
    if (!val) {
      resetForm();
    }
  }
);

// 监听userId变化，获取用户信息
watch(
  () => props.userId,
  async (val) => {
    if (val && dialogVisible.value) {
      await getUserDetail(val);
    }
  },
  { immediate: true }
);

// 获取用户详情
const getUserDetail = async (id: number) => {
  loading.value = true;
  try {
    const { data } = await getUserById(id);
    Object.assign(form, {
      username: data.username,
      email: data.email,
      nickname: data.nickname || "",
      phone: data.phone || "",
      status: data.status,
      is_admin: data.is_admin
    });
  } catch (error) {
    console.error("获取用户详情失败", error);
  } finally {
    loading.value = false;
  }
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    
    loading.value = true;
    try {
      const formData = { ...form };
      
      // 编辑时如果没有修改密码，则不提交密码字段
      if (props.userId && !formData.password) {
        delete formData.password;
      }
      
      if (props.userId) {
        await updateUser(props.userId, formData);
        ElMessage.success("修改成功");
      } else {
        await createUser(formData);
        ElMessage.success("新增成功");
      }
      
      dialogVisible.value = false;
      emit("success");
    } catch (error) {
      console.error("提交表单失败", error);
    } finally {
      loading.value = false;
    }
  });
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  
  Object.assign(form, {
    username: "",
    email: "",
    nickname: "",
    phone: "",
    password: "",
    status: "active",
    is_admin: false
  });
};
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style> 