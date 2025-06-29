<template>
  <el-dialog
    v-model="dialogVisible"
    title="选择图标"
    width="70%"
    destroy-on-close
  >
    <el-tabs v-model="activeTab">
      <el-tab-pane label="Element Plus 图标" name="element">
        <div class="icon-container">
          <div
            v-for="icon in elementIcons"
            :key="icon"
            :class="[
              'icon-item',
              selectedIcon === `ep:${icon}` ? 'icon-item-selected' : ''
            ]"
            @click="selectIcon(`ep:${icon}`)"
          >
            <el-tooltip :content="icon" placement="top">
              <div class="icon-wrapper">
                <IconifyIconOnline :icon="`ep:${icon}`" />
              </div>
            </el-tooltip>
            <div class="icon-name">{{ icon }}</div>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="Remix 图标" name="remix">
        <div class="icon-container">
          <div
            v-for="icon in remixIcons"
            :key="icon"
            :class="[
              'icon-item',
              selectedIcon === `ri:${icon}` ? 'icon-item-selected' : ''
            ]"
            @click="selectIcon(`ri:${icon}`)"
          >
            <el-tooltip :content="icon" placement="top">
              <div class="icon-wrapper">
                <IconifyIconOnline :icon="`ri:${icon}`" />
              </div>
            </el-tooltip>
            <div class="icon-name">{{ icon }}</div>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="自定义图标" name="custom">
        <el-input
          v-model="customIcon"
          placeholder="请输入图标名称，例如: ep:edit, ri:user-line"
        >
          <template #append>
            <el-button @click="previewCustomIcon">预览</el-button>
          </template>
        </el-input>
        <div class="custom-icon-preview" v-if="customIcon">
          <div class="icon-wrapper">
            <IconifyIconOnline :icon="customIcon" />
          </div>
          <div class="icon-name">{{ customIcon }}</div>
        </div>
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="confirmSelection"
          :disabled="!selectedIcon"
        >
          确认
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, defineEmits, defineExpose } from "vue";
import { IconifyIconOnline } from "@/components/ReIcon";
import logger from "@/utils/logger";

const dialogVisible = ref(false);
const activeTab = ref("element");
const selectedIcon = ref("");
const customIcon = ref("");

// 常用的Element Plus图标
const elementIcons = [
  "add-location",
  "aim",
  "alarm-clock",
  "apple",
  "arrow-down",
  "arrow-left",
  "arrow-right",
  "arrow-up",
  "avatar",
  "back",
  "baseball",
  "basketball",
  "bell",
  "bicycle",
  "bottom",
  "box",
  "briefcase",
  "brush",
  "burger",
  "calendar",
  "camera",
  "caret-bottom",
  "caret-left",
  "caret-right",
  "caret-top",
  "cellphone",
  "chat-dot-round",
  "chat-line-round",
  "chat-round",
  "check",
  "checked",
  "cherry",
  "circle-check",
  "circle-close",
  "circle-plus",
  "clock",
  "close",
  "close-bold",
  "cloudy",
  "coffee",
  "coin",
  "cold-drink",
  "collection",
  "collection-tag",
  "comment",
  "compass",
  "connection",
  "coordinate",
  "copy-document",
  "cpu",
  "credit-card",
  "crop",
  "d-arrow-left",
  "d-arrow-right",
  "d-caret",
  "data-analysis",
  "data-board",
  "data-line",
  "delete",
  "delete-location",
  "dessert",
  "discount",
  "dish",
  "dish-dot",
  "document",
  "document-add",
  "document-checked",
  "document-copy",
  "document-delete",
  "document-remove",
  "download",
  "drizzling",
  "edit",
  "edit-pen",
  "eleme",
  "eleme-filled",
  "element-plus",
  "expand",
  "failed",
  "female",
  "files",
  "film",
  "filter",
  "finished",
  "first-aid-kit",
  "flag",
  "fold",
  "folder",
  "folder-add",
  "folder-checked",
  "folder-delete",
  "folder-opened",
  "folder-remove",
  "food",
  "football",
  "fork-spoon",
  "fries",
  "full-screen",
  "goblet",
  "goblet-full",
  "goblet-square",
  "goblet-square-full",
  "gold-medal",
  "goods",
  "goods-filled",
  "grape",
  "grid",
  "guide",
  "handbag",
  "headset",
  "help",
  "help-filled",
  "hide",
  "histogram",
  "home-filled",
  "hot-water",
  "house",
  "ice-cream",
  "ice-cream-round",
  "ice-cream-square",
  "ice-drink",
  "ice-tea",
  "info-filled",
  "iphone",
  "key",
  "knife-fork",
  "lightning",
  "link",
  "list",
  "loading",
  "location",
  "location-filled",
  "location-information",
  "lock",
  "lollipop",
  "magic-stick",
  "magnet",
  "male",
  "management",
  "map-location",
  "medal",
  "memo",
  "menu",
  "message",
  "message-box",
  "mic",
  "microphone",
  "milk-tea",
  "minus",
  "money",
  "monitor",
  "moon",
  "moon-night",
  "more",
  "more-filled",
  "mostly-cloudy",
  "mouse",
  "mug",
  "mute",
  "mute-notification",
  "no-smoking",
  "notebook",
  "notification",
  "odometer",
  "office-building",
  "open",
  "operation",
  "opportunity",
  "orange",
  "paperclip",
  "partly-cloudy",
  "pear",
  "phone",
  "phone-filled",
  "picture",
  "picture-filled",
  "picture-rounded",
  "pie-chart",
  "place",
  "platform",
  "plus",
  "pointer",
  "position",
  "postcard",
  "pouring",
  "present",
  "price-tag",
  "printer",
  "promotion",
  "question-filled",
  "rank",
  "reading",
  "reading-lamp",
  "refresh",
  "refresh-left",
  "refresh-right",
  "refrigerator",
  "remove",
  "remove-filled",
  "right",
  "scale-to-original",
  "school",
  "scissor",
  "search",
  "select",
  "sell",
  "semi-select",
  "service",
  "setting",
  "setting-filled",
  "share",
  "ship",
  "shop",
  "shopping-bag",
  "shopping-cart",
  "shopping-cart-full",
  "shopping-trolley",
  "smoking",
  "soccer",
  "sold-out",
  "sort",
  "sort-down",
  "sort-up",
  "stamp",
  "star",
  "star-filled",
  "stopwatch",
  "success-filled",
  "sugar",
  "suitcase",
  "suitcase-line",
  "sunny",
  "sunrise",
  "sunset",
  "switch",
  "switch-button",
  "switch-filled",
  "takeaway-box",
  "ticket",
  "tickets",
  "timer",
  "toilet-paper",
  "tools",
  "top",
  "top-left",
  "top-right",
  "trend-charts",
  "trophy",
  "trophy-base",
  "turn-off",
  "umbrella",
  "unlock",
  "upload",
  "upload-filled",
  "user",
  "user-filled",
  "van",
  "video-camera",
  "video-camera-filled",
  "video-pause",
  "video-play",
  "view",
  "wallet",
  "wallet-filled",
  "warning",
  "warning-filled",
  "watch",
  "watermelon",
  "wind-power",
  "zoom-in",
  "zoom-out"
];

// 常用的Remix图标
const remixIcons = [
  "home-line",
  "home-fill",
  "home-2-line",
  "home-2-fill",
  "home-3-line",
  "home-3-fill",
  "home-4-line",
  "home-4-fill",
  "home-5-line",
  "home-5-fill",
  "home-6-line",
  "home-6-fill",
  "home-7-line",
  "home-7-fill",
  "home-8-line",
  "home-8-fill",
  "home-gear-line",
  "home-gear-fill",
  "home-wifi-line",
  "home-wifi-fill",
  "home-smile-line",
  "home-smile-fill",
  "home-smile-2-line",
  "home-smile-2-fill",
  "home-heart-line",
  "home-heart-fill",
  "building-line",
  "building-fill",
  "building-2-line",
  "building-2-fill",
  "building-3-line",
  "building-3-fill",
  "building-4-line",
  "building-4-fill",
  "hotel-line",
  "hotel-fill",
  "community-line",
  "community-fill",
  "government-line",
  "government-fill",
  "store-line",
  "store-fill",
  "store-2-line",
  "store-2-fill",
  "store-3-line",
  "store-3-fill",
  "bank-line",
  "bank-fill",
  "hospital-line",
  "hospital-fill",
  "shopping-bag-line",
  "shopping-bag-fill",
  "shopping-bag-2-line",
  "shopping-bag-2-fill",
  "shopping-bag-3-line",
  "shopping-bag-3-fill",
  "shopping-basket-line",
  "shopping-basket-fill",
  "shopping-basket-2-line",
  "shopping-basket-2-fill",
  "shopping-cart-line",
  "shopping-cart-fill",
  "shopping-cart-2-line",
  "shopping-cart-2-fill",
  "user-line",
  "user-fill",
  "user-2-line",
  "user-2-fill",
  "user-3-line",
  "user-3-fill",
  "user-4-line",
  "user-4-fill",
  "user-5-line",
  "user-5-fill",
  "user-6-line",
  "user-6-fill",
  "men-line",
  "men-fill",
  "women-line",
  "women-fill",
  "user-smile-line",
  "user-smile-fill",
  "user-received-line",
  "user-received-fill",
  "user-received-2-line",
  "user-received-2-fill",
  "user-shared-line",
  "user-shared-fill",
  "user-shared-2-line",
  "user-shared-2-fill",
  "user-location-line",
  "user-location-fill",
  "user-search-line",
  "user-search-fill",
  "account-box-line",
  "account-box-fill",
  "account-circle-line",
  "account-circle-fill",
  "account-pin-box-line",
  "account-pin-box-fill",
  "account-pin-circle-line",
  "account-pin-circle-fill",
  "user-heart-line",
  "user-heart-fill",
  "user-star-line",
  "user-star-fill",
  "user-follow-line",
  "user-follow-fill",
  "user-unfollow-line",
  "user-unfollow-fill",
  "user-settings-line",
  "user-settings-fill",
  "user-add-line",
  "user-add-fill",
  "team-line",
  "team-fill",
  "group-line",
  "group-fill",
  "group-2-line",
  "group-2-fill",
  "admin-line",
  "admin-fill",
  "contacts-line",
  "contacts-fill",
  "contact-book-line",
  "contact-book-fill",
  "contact-book-2-line",
  "contact-book-2-fill",
  "contact-book-upload-line",
  "contact-book-upload-fill",
  "emotion-line",
  "emotion-fill",
  "emotion-happy-line",
  "emotion-happy-fill",
  "emotion-normal-line",
  "emotion-normal-fill",
  "emotion-unhappy-line",
  "emotion-unhappy-fill",
  "emotion-2-line",
  "emotion-2-fill",
  "emotion-laugh-line",
  "emotion-laugh-fill",
  "emotion-sad-line",
  "emotion-sad-fill",
  "emotion-angry-line",
  "emotion-angry-fill",
  "award-line",
  "award-fill",
  "medal-line",
  "medal-fill",
  "crown-line",
  "crown-fill",
  "vip-line",
  "vip-fill",
  "user-star-line",
  "user-star-fill",
  "team-line",
  "team-fill",
  "group-line",
  "group-fill",
  "user-add-line",
  "user-add-fill",
  "user-follow-line",
  "user-follow-fill",
  "user-unfollow-line",
  "user-unfollow-fill",
  "user-settings-line",
  "user-settings-fill",
  "user-search-line",
  "user-search-fill",
  "user-heart-line",
  "user-heart-fill",
  "parent-line",
  "parent-fill",
  "emotion-line",
  "emotion-fill",
  "emotion-happy-line",
  "emotion-happy-fill",
  "emotion-sad-line",
  "emotion-sad-fill",
  "emotion-normal-line",
  "emotion-normal-fill"
];

const emit = defineEmits<{
  (e: "select", icon: string): void;
}>();

const selectIcon = (icon: string) => {
  // 如果已经选中，则取消选中
  if (selectedIcon.value === icon) {
    selectedIcon.value = "";
  } else {
    selectedIcon.value = icon;
  }
  // 添加控制台输出，便于调试
  logger.debug("[CategoryIconSelector] Selected icon:", selectedIcon.value);
};

const previewCustomIcon = () => {
  if (customIcon.value) {
    // 如果已经选中，则取消选中
    if (selectedIcon.value === customIcon.value) {
      selectedIcon.value = "";
    } else {
      selectedIcon.value = customIcon.value;
    }
    // 添加控制台输出，便于调试
    logger.debug(
      "[CategoryIconSelector] Preview custom icon:",
      selectedIcon.value
    );
  }
};

const confirmSelection = () => {
  if (activeTab.value === "custom" && customIcon.value) {
    emit("select", customIcon.value);
  } else if (selectedIcon.value) {
    emit("select", selectedIcon.value);
  }
  dialogVisible.value = false;
};

const open = () => {
  dialogVisible.value = true;
  selectedIcon.value = "";
  customIcon.value = "";
};

defineExpose({
  open
});
</script>

<style scoped>
.icon-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 80px;
  border: 1px solid #eee;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  padding: 8px;
}

.icon-item:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.icon-item-selected {
  border: 2px solid #409eff;
  background-color: #ecf5ff;
  position: relative;
  box-shadow: 0 0 5px rgba(64, 158, 255, 0.5);
  transform: scale(1.05);
  z-index: 1;
}

.icon-item-selected::after {
  content: "✓";
  position: absolute;
  top: 2px;
  right: 5px;
  color: #409eff;
  font-weight: bold;
  font-size: 16px;
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  font-size: 24px;
}

.icon-name {
  font-size: 12px;
  margin-top: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  text-align: center;
}

.custom-icon-preview {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
}

.custom-icon-preview .icon-wrapper {
  font-size: 32px;
  margin-bottom: 10px;
}
</style>
