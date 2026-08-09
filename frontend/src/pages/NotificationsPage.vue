<template>
  <div class="notifications-page">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
      <div style="font-size: 26px; font-weight: 600;">การแจ้งเตือน</div>
      <button style="border-radius: 999px; padding: 9px 18px; font-size: 13.5px; font-weight: 600; border: 1.5px solid #8e4dff; background: #fff; color: #8e4dff; cursor: pointer; font-family: inherit;" @click="markAllRead">อ่านทั้งหมดแล้ว</button>
    </div>

    <div style="background: #ffffff; border-radius: 20px; box-shadow: 0 6px 16px rgba(0,0,0,0.08); overflow: hidden;">
      <div v-for="item in computedNotifications" :key="item.id"
          :style="{ background: item.rowBg }"
           style="display: flex; align-items: flex-start; gap: 14px; padding: 16px 22px; border-bottom: 1px solid #f0f0f0; cursor: pointer;"
           @click="markRead(item.id)">
          
          <div v-if="item.isOrder" style="width: 44px; height: 44px; border-radius: 50%; background: #ede9fe; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 8h12l-1 12H7L6 8Z" stroke="#6d28d9" stroke-width="1.8" stroke-linejoin="round"></path><path d="M9 8V6a3 3 0 1 1 6 0v2" stroke="#6d28d9" stroke-width="1.8"></path></svg>
          </div>
          
          <div v-if="item.isPromo" style="width: 44px; height: 44px; border-radius: 50%; background: #dcfce7; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 12.5 12.5 20a1.5 1.5 0 0 1-2.1 0L4 13.6a1.5 1.5 0 0 1 0-2.1L11.5 4H17a3 3 0 0 1 3 3v5.5Z" stroke="#16a34a" stroke-width="1.8" stroke-linejoin="round"></path><circle cx="15" cy="9" r="1.4" fill="#16a34a"></circle></svg>
          </div>
          
          <div v-if="item.isSystem" style="width: 44px; height: 44px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 4a5 5 0 0 0-5 5v3.5L5.5 15h13L17 12.5V9a5 5 0 0 0-5-5Z" stroke="#64748b" stroke-width="1.8" stroke-linejoin="round"></path><path d="M10 17.5a2 2 0 0 0 4 0" stroke="#64748b" stroke-width="1.8"></path></svg>
          </div>

          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 3px;">
              <span :style="{ fontWeight: item.titleWeight }" style="font-size: 14.5px; color: #1d1d1d;">{{ item.title }}</span>
              <span :style="{ opacity: item.dotOpacity }" style="width: 8px; height: 8px; border-radius: 50%; background: #8e4dff; flex-shrink: 0; margin-top: 3px; transition: 0.2s;"></span>
            </div>
            <div style="font-size: 13px; color: #6b7280; line-height: 1.5; margin-bottom: 6px;">{{ item.message }}</div>
            <div style="font-size: 12px; color: #9ca3af;">{{ item.timeLabel }}</div>
          </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useNotificationStore } from 'src/stores/notificationStore';

const store = useNotificationStore();

onMounted(() => {
  void store.fetchNotifications();
});

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'เมื่อสักครู่';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(diffInSeconds / 86400)} วันที่แล้ว`;
};

const computedNotifications = computed(() => {
  return store.notifications.map(it => ({
    id: it.id,
    title: it.title,
    message: it.message,
    timeLabel: formatTimeAgo(it.createdAt),
    isOrder: it.type === 'order',
    isPromo: it.type === 'promo',
    isSystem: it.type === 'system',
    titleWeight: it.isRead ? 400 : 600,
    dotOpacity: it.isRead ? 0 : 1,
    rowBg: it.isRead ? '#ffffff' : '#faf5ff',
  }));
});

const markRead = (id: number) => {
  void store.markAsRead(id);
};

const markAllRead = () => {
  void store.markAllAsRead();
};
</script>

<style scoped>
.notifications-page {
  padding: 28px 40px 60px;
  max-width: 720px;
  margin: 0 auto;
}
@media (max-width: 860px) {
  .notifications-page {
    padding: 20px 16px 40px;
    max-width: 100%;
  }
}
</style>
