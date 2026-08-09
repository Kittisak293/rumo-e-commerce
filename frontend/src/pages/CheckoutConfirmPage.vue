<template>
  <q-page class="checkout-page">
    <div v-if="store.loading" style="display: flex; justify-content: center; padding: 80px 0;">
      <q-spinner-dots size="48px" color="purple" />
    </div>

    <div v-else>
      <div style="font-size: 24px; font-weight: 600; margin-bottom: 20px; color: #1d1d1d;">ยืนยันการชำระเงิน</div>

      <!-- Address Section -->
      <div class="checkout-card" style="margin-bottom: 16px;">
        <div style="font-size: 15px; font-weight: 600; color: #1d1d1d; margin-bottom: 14px;">ที่อยู่จัดส่ง</div>

        <div v-if="store.addresses.length === 0" style="color: #6b7280; font-size: 13px; margin-bottom: 12px;">
          ยังไม่มีที่อยู่จัดส่ง กรุณาเพิ่มที่อยู่
        </div>

        <div
          v-for="addr in store.addresses"
          :key="addr.id"
          class="address-option"
          :class="{ 'address-option--active': store.selectedAddressId === addr.id }"
          @click="store.selectAddress(addr.id)"
        >
          <div style="font-size: 14px; font-weight: 500; color: #1d1d1d;">{{ addr.fullName }} | {{ addr.phone }}</div>
          <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">
            {{ addr.subdistrict }}, {{ addr.district }}, {{ addr.province }} {{ addr.postalCode }}
          </div>
        </div>

        <button type="button" class="add-address-btn" @click="showAddForm = !showAddForm">
          {{ showAddForm ? '− ยกเลิก' : '+ เพิ่มที่อยู่ใหม่' }}
        </button>

        <form v-if="showAddForm" class="address-form" @submit.prevent="handleAddAddress">
          <q-input v-model="form.fullName" dense outlined label="ชื่อ-นามสกุล" class="q-mb-sm" />
          <q-input v-model="form.phone" dense outlined label="เบอร์โทร" class="q-mb-sm" />
          <q-input v-model="form.province" dense outlined label="จังหวัด" class="q-mb-sm" />
          <q-input v-model="form.district" dense outlined label="อำเภอ/เขต" class="q-mb-sm" />
          <q-input v-model="form.subdistrict" dense outlined label="ตำบล/แขวง" class="q-mb-sm" />
          <q-input v-model="form.postalCode" dense outlined label="รหัสไปรษณีย์" class="q-mb-sm" />
          <button type="submit" class="checkout-btn" :disabled="addingAddress">
            {{ addingAddress ? 'กำลังบันทึก...' : 'บันทึกที่อยู่' }}
          </button>
        </form>
      </div>

      <!-- Summary -->
      <div class="checkout-card" style="margin-bottom: 24px;">
        <div style="font-size: 15px; font-weight: 600; color: #1d1d1d; margin-bottom: 14px;">สรุปยอดชำระ</div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 14px; color: #6b7280;">ยอดรวมสินค้า ({{ store.totalQuantity }} ชิ้น)</span>
          <span style="font-size: 14px; color: #1d1d1d;">฿{{ store.subtotal.toLocaleString() }}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 14px; color: #6b7280;">ค่าจัดส่ง</span>
          <span style="font-size: 14px; color: #16a34a;">ฟรี</span>
        </div>
        <div style="border-top: 1px solid #e5e7eb; margin: 12px 0;" />
        <div style="display: flex; justify-content: space-between;">
          <span style="font-size: 16px; font-weight: 600; color: #1d1d1d;">ยอดชำระทั้งหมด</span>
          <span style="font-size: 18px; font-weight: 700; color: #6d28d9;">฿{{ store.total.toLocaleString() }}</span>
        </div>
      </div>

      <button class="checkout-btn" :disabled="!store.selectedAddressId || store.checkoutLoading" @click="handleConfirm">
        <q-spinner-dots v-if="store.checkoutLoading" size="20px" color="white" style="margin-right: 8px;" />
        {{ store.checkoutLoading ? 'กำลังดำเนินการ...' : 'ยืนยันการชำระเงิน' }}
      </button>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCheckoutStore } from 'src/stores/checkoutStore';
import { useAuthStore } from 'src/stores/authStore';

const store = useCheckoutStore();
const auth = useAuthStore();
const router = useRouter();

const showAddForm = ref(false);
const addingAddress = ref(false);
const form = reactive({
  fullName: '',
  phone: '',
  province: '',
  district: '',
  subdistrict: '',
  postalCode: '',
});

onMounted(() => {
  // Cart summary was already fetched on the checkout page; only refetch if
  // this page is opened directly (reload / deep link).
  if (store.cartItems.length === 0) void store.fetchCheckoutData();
});

const handleAddAddress = async () => {
  if (!auth.user) return;
  addingAddress.value = true;
  try {
    const created = await store.addAddress({ ...form, userId: auth.user.id, isDefault: false });
    if (created) {
      showAddForm.value = false;
      Object.assign(form, {
        fullName: '',
        phone: '',
        province: '',
        district: '',
        subdistrict: '',
        postalCode: '',
      });
    }
  } finally {
    addingAddress.value = false;
  }
};

const handleConfirm = async () => {
  if (!store.selectedAddressId) return;
  const order = await store.placeOrder(store.selectedAddressId);
  if (order) {
    await router.push({ name: 'paymentSuccess', params: { orderId: String(order.id) } });
  }
};
</script>

<style scoped>
.checkout-page {
  padding: 28px 40px 60px;
  max-width: 720px;
  margin: 0 auto;
}

.checkout-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
}

.address-option {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.address-option--active {
  border-color: #6d28d9;
  background: #f5f3ff;
}

.add-address-btn {
  background: none;
  border: 1px dashed #a855f7;
  color: #6d28d9;
  border-radius: 12px;
  padding: 10px;
  width: 100%;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.address-form {
  margin-top: 14px;
}

.checkout-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #8e4dff, #6d28d9);
  border: none;
  border-radius: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);
  transition: all 0.2s;
  font-family: inherit;
}

.checkout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 860px) {
  .checkout-page {
    padding: 20px 16px 40px;
    max-width: 100%;
  }
}
</style>
