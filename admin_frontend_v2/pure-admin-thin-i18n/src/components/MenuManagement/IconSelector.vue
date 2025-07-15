<template>
  <el-dialog
    v-model="dialogVisible"
    title="选择图标"
    width="70%"
    destroy-on-close
  >
    <!-- 添加搜索框 -->
    <div class="search-container">
      <el-input
        v-model="searchQuery"
        placeholder="搜索图标"
        clearable
        prefix-icon="ep:search"
        @input="handleSearch"
      />
    </div>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="Element Plus 图标" name="element">
        <div class="icon-container">
          <div
            v-for="icon in filteredElementIcons"
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
            v-for="icon in filteredRemixIcons"
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
import { ref, defineEmits, defineExpose, computed } from "vue";
import { IconifyIconOnline } from "@/components/ReIcon";
import logger from "@/utils/logger";

const dialogVisible = ref(false);
const activeTab = ref("element");
const selectedIcon = ref("");
const customIcon = ref("");
const searchQuery = ref(""); // 添加搜索查询

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
  "warn",
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
  "user-line",
  "user-fill",
  "settings-line",
  "settings-fill",
  "notification-line",
  "notification-fill",
  "search-line",
  "search-fill",
  "edit-line",
  "edit-fill",
  "delete-bin-line",
  "delete-bin-fill",
  "add-line",
  "add-fill",
  "close-line",
  "close-fill",
  "arrow-left-line",
  "arrow-left-fill",
  "arrow-right-line",
  "arrow-right-fill",
  "arrow-up-line",
  "arrow-up-fill",
  "arrow-down-line",
  "arrow-down-fill",
  "menu-line",
  "menu-fold-line",
  "menu-unfold-line",
  "dashboard-line",
  "dashboard-fill",
  "information-line",
  "information-fill",
  "question-line",
  "question-fill",
  "alert-line",
  "alert-fill",
  "error-warning-line",
  "error-warning-fill",
  "checkbox-circle-line",
  "checkbox-circle-fill",
  "checkbox-blank-circle-line",
  "checkbox-blank-circle-fill",
  "checkbox-line",
  "checkbox-fill",
  "time-line",
  "time-fill",
  "calendar-line",
  "calendar-fill",
  "file-list-line",
  "file-list-fill",
  "file-line",
  "file-fill",
  "folder-line",
  "folder-fill",
  "folder-open-line",
  "folder-open-fill",
  "lock-line",
  "lock-fill",
  "unlock-line",
  "unlock-fill",
  "shield-line",
  "shield-fill",
  "eye-line",
  "eye-fill",
  "eye-off-line",
  "eye-off-fill",
  "mail-line",
  "mail-fill",
  "phone-line",
  "phone-fill",
  "chat-1-line",
  "chat-1-fill",
  "chat-3-line",
  "chat-3-fill",
  "image-line",
  "image-fill",
  "gallery-line",
  "gallery-fill",
  "video-line",
  "video-fill",
  "music-line",
  "music-fill",
  "heart-line",
  "heart-fill",
  "star-line",
  "star-fill",
  "thumb-up-line",
  "thumb-up-fill",
  "thumb-down-line",
  "thumb-down-fill",
  "bookmark-line",
  "bookmark-fill",
  "share-line",
  "share-fill",
  "download-line",
  "download-fill",
  "upload-line",
  "upload-fill",
  "link",
  "unlink",
  "external-link-line",
  "external-link-fill",
  "attachment-line",
  "attachment-fill",
  "price-tag-line",
  "price-tag-fill",
  "shopping-cart-line",
  "shopping-cart-fill",
  "coin-line",
  "coin-fill",
  "money-dollar-circle-line",
  "money-dollar-circle-fill",
  "chart-line",
  "chart-fill",
  "pie-chart-line",
  "pie-chart-fill",
  "bar-chart-line",
  "bar-chart-fill",
  "database-line",
  "database-fill",
  "server-line",
  "server-fill",
  "cloud-line",
  "cloud-fill",
  "cloud-off-line",
  "cloud-off-fill",
  "global-line",
  "global-fill",
  "map-pin-line",
  "map-pin-fill",
  "map-line",
  "map-fill",
  "compass-line",
  "compass-fill",
  "rocket-line",
  "rocket-fill",
  "plane-line",
  "plane-fill",
  "car-line",
  "car-fill",
  "bus-line",
  "bus-fill",
  "train-line",
  "train-fill",
  "bike-line",
  "bike-fill",
  "ship-line",
  "ship-fill",
  "truck-line",
  "truck-fill",
  "device-line",
  "device-fill",
  "computer-line",
  "computer-fill",
  "smartphone-line",
  "smartphone-fill",
  "tablet-line",
  "tablet-fill",
  "tv-line",
  "tv-fill",
  "wifi-line",
  "wifi-fill",
  "bluetooth-line",
  "bluetooth-fill",
  "battery-line",
  "battery-fill",
  "battery-charge-line",
  "battery-charge-fill",
  "plug-line",
  "plug-fill",
  "outlet-line",
  "outlet-fill",
  "lightbulb-line",
  "lightbulb-fill",
  "sun-line",
  "sun-fill",
  "moon-line",
  "moon-fill",
  "flashlight-line",
  "flashlight-fill",
  "umbrella-line",
  "umbrella-fill",
  "temp-hot-line",
  "temp-hot-fill",
  "temp-cold-line",
  "temp-cold-fill",
  "coupon-line",
  "coupon-fill",
  "gift-line",
  "gift-fill",
  "trophy-line",
  "trophy-fill",
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

// 过滤后的图标列表
const filteredElementIcons = computed(() => {
  if (!searchQuery.value) return elementIcons;
  return elementIcons.filter(icon =>
    icon.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const filteredRemixIcons = computed(() => {
  if (!searchQuery.value) return remixIcons;
  return remixIcons.filter(icon =>
    icon.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// 处理搜索输入
const handleSearch = () => {
  // 可以在这里添加额外的搜索逻辑，如果需要的话
  logger.debug("Searching for icons:", searchQuery.value);
};

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
  logger.debug("Selected icon:", selectedIcon.value);
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
    logger.debug("Preview custom icon:", selectedIcon.value);
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
  searchQuery.value = ""; // 重置搜索框
};

defineExpose({
  open
});
</script>

<style scoped>
.search-container {
  margin-bottom: 15px;
  padding: 0 10px;
}

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
