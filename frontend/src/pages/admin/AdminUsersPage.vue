<template>
  <q-page class="aus-page">
    <div class="aus-page__header">
      <div>
        <div class="aus-page__title">จัดการผู้ใช้</div>
        <div class="aus-page__sub">สมาชิกทั้งหมดในระบบ</div>
        <!-- <div class="aus-page__sub">สมาชิก {{ store.users.length.toLocaleString() }} คน · แอดมิน {{ store.adminCount }} คน</div> -->
      </div>
    </div>

    <div class="aus-toolbar">
      <div class="aus-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="aus-search__icon">
          <circle cx="11" cy="11" r="6.5" stroke="#9ca3af" stroke-width="1.8" />
          <path d="M20 20l-4.35-4.35" stroke="#9ca3af" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        <input v-model="searchQuery" type="text" placeholder="ค้นหาชื่อหรืออีเมล" class="aus-search__input" />
      </div>
      <button v-if="hasActiveFilter" type="button" class="aus-clear-btn" @click="clearFilters">ล้างตัวกรอง</button>
    </div>

    <div class="aus-tabs">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        type="button"
        class="aus-tab"
        :class="{ 'aus-tab--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span class="aus-tab__count">{{ tabCount(tab.key) }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="aus-card">
      <div v-for="i in 6" :key="i" class="aus-skel-row">
        <div class="aus-skel-bar" style="width: 200px" />
        <div class="aus-skel-bar" style="width: 90px; border-radius: 999px" />
        <div class="aus-skel-bar" style="width: 110px; border-radius: 999px" />
        <div class="aus-skel-bar" style="width: 90px" />
        <div class="aus-skel-bar" style="width: 120px; height: 34px; border-radius: 14px; margin-left: auto" />
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="aus-state-card">
      <div class="aus-error-banner">
        <div class="aus-error-banner__icon">!</div>
        <div>
          <div class="aus-error-banner__title">โหลดรายชื่อผู้ใช้ไม่สำเร็จ</div>
          <div class="aus-error-banner__sub">{{ store.error }}</div>
        </div>
      </div>
      <button type="button" class="aus-cta" @click="load">ลองใหม่อีกครั้ง</button>
    </div>

    <!-- No search results -->
    <div v-else-if="filteredUsers.length === 0" class="aus-state-card">
      <div class="aus-state-icon aus-state-icon--muted">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="6.5" stroke="#9ca3af" stroke-width="1.8" />
          <path d="M20 20l-4.35-4.35" stroke="#9ca3af" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </div>
      <div class="aus-state-title">ไม่พบผู้ใช้ที่ตรงกับตัวกรอง</div>
      <div class="aus-state-sub">ลองปรับคำค้นหาหรือเปลี่ยนตัวกรอง</div>
      <button type="button" class="aus-clear-btn aus-clear-btn--center" @click="clearFilters">ล้างตัวกรอง</button>
    </div>

    <!-- Table -->
    <div v-else class="aus-card">
      <table class="aus-table">
        <thead>
          <tr>
            <th>ผู้ใช้</th>
            <th>บทบาท</th>
            <th>อีเมล</th>
            <th>วันที่สมัคร</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id" class="aus-row" :class="{ 'aus-row--self': isSelf(user) }">
            <td class="aus-td">
              <div class="aus-user">
                <span class="aus-avatar">{{ initials(user.name) }}</span>
                <div>
                  <div class="aus-user__name">{{ user.name }}<span v-if="isSelf(user)" class="aus-you-tag">คุณ</span></div>
                  <div class="aus-user__email">{{ user.email }}</div>
                </div>
              </div>
            </td>
            <td class="aus-td">
              <span class="aus-chip" :class="user.role === 'admin' ? 'aus-chip--admin' : 'aus-chip--customer'">
                {{ user.role === 'admin' ? 'แอดมิน' : 'ลูกค้า' }}
              </span>
            </td>
            <td class="aus-td">
              <span class="aus-verify" :class="user.emailVerified ? 'aus-verify--yes' : 'aus-verify--no'">
                <svg v-if="user.emailVerified" width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12l5 5L19 7" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                {{ user.emailVerified ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน' }}
              </span>
            </td>
            <td class="aus-td aus-td--date">{{ formatThaiDate(user.createdAt) }}</td>
            <td class="aus-td aus-td--action">
              <div class="aus-action-cell">
                <button
                  v-if="user.role === 'customer'"
                  type="button"
                  class="aus-role-btn aus-role-btn--promote"
                  :disabled="isSelf(user)"
                  @click="openConfirm(user, 'admin')"
                >
                  ตั้งเป็นแอดมิน
                </button>
                <button
                  v-else
                  type="button"
                  class="aus-role-btn aus-role-btn--demote"
                  :disabled="isSelf(user) || isLastAdmin(user)"
                  @click="openConfirm(user, 'customer')"
                >
                  ปลดเป็นลูกค้า
                </button>
                <div v-if="isSelf(user)" class="aus-lock-reason">เปลี่ยนบทบาทของตัวเองไม่ได้</div>
                <div v-else-if="user.role === 'admin' && isLastAdmin(user)" class="aus-lock-reason">ต้องมีแอดมินอย่างน้อย 1 คน</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Confirm dialog -->
    <q-dialog v-model="confirmOpen">
      <div class="aus-confirm-card" :class="{ 'aus-confirm-card--danger': pendingRole === 'customer' }">
        <div class="aus-confirm-icon" :class="pendingRole === 'admin' ? 'aus-confirm-icon--brand' : 'aus-confirm-icon--danger'">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" :stroke="pendingRole === 'admin' ? '#6d28d9' : '#dc2626'" stroke-width="1.8" stroke-linecap="round" />
            <circle cx="9" cy="7" r="4" :stroke="pendingRole === 'admin' ? '#6d28d9' : '#dc2626'" stroke-width="1.8" />
          </svg>
        </div>
        <div class="aus-confirm-title">
          {{ pendingRole === 'admin' ? 'ยืนยันตั้งเป็นแอดมิน' : 'ยืนยันปลดเป็นลูกค้า' }}
        </div>
        <div class="aus-confirm-target">
          <div class="aus-confirm-target__name">{{ pendingUser?.name }}</div>
          <div class="aus-confirm-target__email">{{ pendingUser?.email }}</div>
        </div>
        <div class="aus-confirm-desc">
          <template v-if="pendingRole === 'admin'">
            คนนี้จะเข้าถึงหลังบ้านได้ทั้งหมด รวมถึงคำสั่งซื้อและข้อมูลผู้ใช้คนอื่น
          </template>
          <template v-else>
            คนนี้จะเข้าหลังบ้านไม่ได้อีก และจะหลุดจากงานแอดมินที่ค้างอยู่ทันที
          </template>
        </div>

        <div v-if="store.actionError" class="aus-confirm-error">{{ store.actionError }}</div>

        <div class="aus-confirm-actions">
          <button type="button" class="aus-btn aus-btn--secondary" style="flex: 1" :disabled="store.actionLoading" @click="confirmOpen = false">
            ยกเลิก
          </button>
          <button
            type="button"
            class="aus-btn"
            :class="pendingRole === 'admin' ? 'aus-btn--primary' : 'aus-btn--danger-solid'"
            style="flex: 1"
            :disabled="store.actionLoading"
            @click="submitRoleChange"
          >
            <span v-if="store.actionLoading" class="aus-btn__spinner" />
            {{ store.actionLoading ? 'กำลังบันทึก...' : pendingRole === 'admin' ? 'ยืนยันตั้งเป็นแอดมิน' : 'ยืนยันปลดเป็นลูกค้า' }}
          </button>
        </div>
      </div>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useAdminUserStore } from 'src/stores/adminUserStore';
import type { AdminUserData } from 'src/stores/adminUserStore';
import { useAuthStore } from 'src/stores/authStore';
import { formatThaiDate } from 'src/composables/useOrderStatus';

const store = useAdminUserStore();
const auth = useAuthStore();

type Tab = '' | 'admin' | 'customer' | 'unverified';
const TABS: { key: Tab; label: string }[] = [
  { key: '', label: 'ทั้งหมด' },
  { key: 'admin', label: 'แอดมิน' },
  { key: 'customer', label: 'ลูกค้า' },
  { key: 'unverified', label: 'ยังไม่ยืนยันอีเมล' },
];
const activeTab = ref<Tab>('');
const searchQuery = ref('');

function matchesTab(user: AdminUserData, tab: Tab): boolean {
  if (tab === 'admin') return user.role === 'admin';
  if (tab === 'customer') return user.role === 'customer';
  if (tab === 'unverified') return !user.emailVerified;
  return true;
}

function tabCount(tab: Tab): number {
  return store.users.filter((u) => matchesTab(u, tab)).length;
}

const hasActiveFilter = computed(() => activeTab.value !== '' || searchQuery.value.trim() !== '');

function clearFilters() {
  activeTab.value = '';
  searchQuery.value = '';
}

const filteredUsers = computed(() => {
  let list = store.users.filter((u) => matchesTab(u, activeTab.value));
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }
  return list;
});

function load() {
  void store.fetchAll();
}
onMounted(load);

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

function isSelf(user: AdminUserData): boolean {
  return auth.user?.id === user.id;
}

function isLastAdmin(user: AdminUserData): boolean {
  return user.role === 'admin' && store.adminCount <= 1;
}

const confirmOpen = ref(false);
const pendingUser = ref<AdminUserData | null>(null);
const pendingRole = ref<'admin' | 'customer'>('admin');

function openConfirm(user: AdminUserData, role: 'admin' | 'customer') {
  pendingUser.value = user;
  pendingRole.value = role;
  store.clearActionError();
  confirmOpen.value = true;
}

async function submitRoleChange() {
  if (!pendingUser.value) return;
  const ok = await store.changeRole(pendingUser.value.id, pendingRole.value);
  if (ok) confirmOpen.value = false;
}
</script>

<style scoped>
.aus-page {
  padding: 28px 40px 60px;
  max-width: 1100px;
  margin: 0 auto;
}

.aus-page__header {
  margin-bottom: 18px;
}

.aus-page__title {
  font-size: 24px;
  font-weight: 600;
  color: #1d1d1d;
}

.aus-page__sub {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.aus-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.aus-search {
  position: relative;
  flex: 1;
  max-width: 400px;
  min-width: 200px;
}

.aus-search__icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.aus-search__input {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 14px 11px 40px;
  border-radius: 14px;
  border: 1.5px solid #e5e7eb;
  background: #fafafa;
  font-size: 13.5px;
  color: #1d1d1d;
  font-family: inherit;
}

.aus-search__input:focus {
  outline: none;
  border-color: #8e4dff;
}

.aus-clear-btn {
  font-family: inherit;
  box-sizing: border-box;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.aus-clear-btn--center {
  margin: 16px auto 0;
}

.aus-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.aus-tab {
  padding: 9px 18px;
  border-radius: 999px;
  font-size: 13.5px;
  font-weight: 500;
  color: #6b7280;
  background: #fff;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
}

.aus-tab--active {
  font-weight: 600;
  color: #fff;
  background: #6d28d9;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.25);
}

.aus-tab__count {
  margin-left: 7px;
  font-size: 11.5px;
  font-weight: 600;
  color: #6d28d9;
  background: #ede9fe;
  padding: 1px 7px;
  border-radius: 999px;
}

.aus-tab--active .aus-tab__count {
  color: #fff;
  background: rgba(255, 255, 255, 0.25);
}

.aus-card {
  background: #fff;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.aus-table {
  width: 100%;
  border-collapse: collapse;
}

.aus-table thead th {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  text-align: left;
  padding: 0 10px 10px;
}

.aus-row:hover {
  background: #fafafa;
}

.aus-row--self {
  background: #fafafa;
}

.aus-td {
  padding: 13px 10px;
  border-top: 1px solid #f3f4f6;
  font-size: 13.5px;
  color: #1d1d1d;
  vertical-align: middle;
}

.aus-td--date {
  white-space: nowrap;
}

.aus-td--action {
  text-align: right;
}

.aus-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.aus-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #ede9fe;
  color: #6d28d9;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.aus-user__name {
  font-size: 13.5px;
  color: #1d1d1d;
}

.aus-you-tag {
  margin-left: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #6d28d9;
  background: #ede9fe;
  padding: 1px 8px;
  border-radius: 999px;
}

.aus-user__email {
  font-size: 12px;
  color: #9ca3af;
}

.aus-chip {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 999px;
  white-space: nowrap;
}

.aus-chip--admin {
  color: #6d28d9;
  background: #ede9fe;
}

.aus-chip--customer {
  color: #6b7280;
  background: #f3f4f6;
}

.aus-verify {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 999px;
  white-space: nowrap;
}

.aus-verify--yes {
  color: #16a34a;
  background: #dcfce7;
}

.aus-verify--no {
  color: #c2410c;
  background: #fff7ed;
  border: 1px solid #fed7aa;
}

.aus-action-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.aus-role-btn {
  font-family: inherit;
  box-sizing: border-box;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.aus-role-btn--promote {
  color: #6d28d9;
  background: #fff;
  border: 1.5px solid #ddd6fe;
}

.aus-role-btn--demote {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.aus-role-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.aus-lock-reason {
  font-size: 11px;
  color: #9ca3af;
  max-width: 160px;
  text-align: right;
}

.aus-state-card {
  background: #fff;
  border-radius: 18px;
  padding: 40px 24px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
  text-align: center;
  max-width: 460px;
  margin: 20px auto 0;
}

.aus-state-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.aus-state-title {
  font-size: 17px;
  font-weight: 600;
  color: #1d1d1d;
  margin-bottom: 6px;
}

.aus-state-sub {
  font-size: 13.5px;
  color: #6b7280;
}

.aus-error-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 20px;
  text-align: left;
}

.aus-error-banner__icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #dc2626;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.aus-error-banner__title {
  font-size: 13px;
  font-weight: 600;
  color: #b91c1c;
}

.aus-error-banner__sub {
  font-size: 12px;
  color: #dc2626;
  margin-top: 2px;
}

.aus-cta {
  width: 100%;
  padding: 14px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: #6d28d9;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);
  font-family: inherit;
  box-sizing: border-box;
}

.aus-skel-row {
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 13px 10px;
  border-top: 1px solid #f3f4f6;
}

.aus-skel-row:first-child {
  border-top: none;
}

.aus-skel-bar {
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: aus-shimmer 1.4s ease infinite;
}

@keyframes aus-shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

/* Confirm dialog */

.aus-confirm-card {
  width: 420px;
  max-width: 92vw;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
  padding: 28px 24px;
  text-align: center;
}

.aus-confirm-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.aus-confirm-icon--brand {
  background: #ede9fe;
}

.aus-confirm-icon--danger {
  background: #fef2f2;
}

.aus-confirm-title {
  font-size: 17px;
  font-weight: 600;
  color: #1d1d1d;
  margin-bottom: 14px;
}

.aus-confirm-target {
  background: #fafafa;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 14px;
}

.aus-confirm-target__name {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1d;
}

.aus-confirm-target__email {
  font-size: 12.5px;
  color: #9ca3af;
  margin-top: 2px;
}

.aus-confirm-desc {
  font-size: 13.5px;
  color: #6b7280;
  line-height: 1.7;
  margin-bottom: 20px;
  text-align: left;
}

.aus-confirm-error {
  font-size: 12.5px;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 16px;
  text-align: left;
}

.aus-confirm-actions {
  display: flex;
  gap: 10px;
}

.aus-btn {
  font-family: inherit;
  box-sizing: border-box;
  border-radius: 14px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  padding: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.aus-btn--secondary {
  color: #6b7280;
  background: #fff;
  border: 1px solid #e5e7eb;
}

.aus-btn--primary {
  color: #fff;
  background: #6d28d9;
  border: none;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);
}

.aus-btn--danger-solid {
  color: #fff;
  background: #dc2626;
  border: none;
}

.aus-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.aus-btn__spinner {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  animation: aus-spin 0.7s linear infinite;
}

@keyframes aus-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 860px) {
  .aus-page {
    padding: 20px 16px 40px;
    max-width: 100%;
  }

  .aus-card {
    overflow-x: auto;
  }

  .aus-table {
    min-width: 720px;
  }
}
</style>
