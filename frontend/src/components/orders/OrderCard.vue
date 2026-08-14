<template>
  <div class="order-card">
    <div class="order-card__header">
      <div class="order-card__id-block">
        <div class="order-card__number">{{ order.orderNumber }}</div>
        <div class="order-card__date">สั่งเมื่อ {{ formatThaiDateTime(order.createdAt) }}</div>
      </div>
      <OrderStatusBadge :status="order.status" />
    </div>

    <div class="order-card__divider" />

    <div class="order-card__body">
      <div class="order-card__thumbs">
        <img
          v-for="(item, i) in shownItems"
          :key="item.id"
          :src="getImageUrl(item.product.imageUrl)"
          :alt="item.product.name"
          class="order-card__thumb"
          :style="{ marginLeft: i === 0 ? 0 : '-16px' }"
        />
        <div v-if="extraItemCount > 0" class="order-card__extra">+{{ extraItemCount }} ชิ้น</div>
      </div>

      <div class="order-card__summary">
        <div class="order-card__items-line">{{ itemsSummaryText }}</div>
        <div class="order-card__sub-line">{{ subLine }}</div>
      </div>

      <div class="order-card__amount">
        <div class="order-card__amount-label">ยอดรวม {{ order.totalQuantity }} ชิ้น</div>
        <div class="order-card__amount-value">฿{{ Number(order.total).toLocaleString() }}</div>
      </div>
    </div>

    <div class="order-card__actions">
      <button type="button" class="order-card__btn order-card__btn--secondary" @click="goDetail">ดูรายละเอียด</button>
      <button
        v-if="primaryAction"
        type="button"
        class="order-card__btn order-card__btn--primary"
        @click="runPrimaryAction"
      >{{ primaryAction.label }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { OrderSummary } from 'src/stores/orderStore';
import { formatThaiDateTime } from 'src/composables/useOrderStatus';
import { getImageUrl } from 'src/utils/imageUrl';
import OrderStatusBadge from './OrderStatusBadge.vue';

const props = defineProps<{ order: OrderSummary }>();
const router = useRouter();

const shownItems = computed(() => props.order.orderItems.slice(0, 3));
const extraItemCount = computed(() => Math.max(0, props.order.orderItems.length - 3));

const itemsSummaryText = computed(() => {
  const items = props.order.orderItems;
  const first = items[0]?.product.name ?? '';
  return items.length > 1 ? `${first} และอีก ${items.length - 1} รายการ` : first;
});

const firstShipment = computed(() => props.order.shipments[0] ?? null);

const subLine = computed(() => {
  switch (props.order.status) {
    case 'pending':
      return 'ยังไม่ได้ชำระเงิน — คำสั่งซื้อจะถูกยกเลิกอัตโนมัติ';
    case 'processing':
      return 'กำลังรอการยืนยันการชำระเงิน';
    case 'failed':
      return 'ชำระเงินไม่สำเร็จ — ลองชำระเงินอีกครั้ง';
    case 'cancelled':
      return 'คำสั่งซื้อนี้ถูกยกเลิกแล้ว';
    case 'refunded':
      return 'คืนเงินให้เรียบร้อยแล้ว';
    case 'delivered':
      // No dedicated deliveredAt column on Shipment — the ETA is the closest
      // real timestamp we have once the parcel is marked delivered.
      return firstShipment.value?.estimatedDeliveryAt
        ? `ส่งถึงเมื่อ ${formatThaiDateTime(firstShipment.value.estimatedDeliveryAt)}`
        : 'ส่งถึงแล้ว';
    default:
      return firstShipment.value
        ? `${firstShipment.value.carrier.name} · ${firstShipment.value.trackingNumber ?? '—'}`
        : 'ร้านค้ากำลังเตรียมสินค้า';
  }
});

type PrimaryAction = { label: string; run: () => void };

const primaryAction = computed<PrimaryAction | null>(() => {
  switch (props.order.status) {
    case 'pending':
    case 'processing':
    case 'failed':
      return {
        label: 'ชำระเงิน',
        run: () => void router.push({ name: 'checkoutConfirm', query: { retryOrderId: String(props.order.id) } }),
      };
    case 'shipped':
    case 'shipping':
      return {
        label: 'ติดตามพัสดุ',
        run: () => void router.push({ name: 'orderTracking', params: { orderId: props.order.id } }),
      };
    case 'delivered': {
      const productId = props.order.orderItems[0]?.product.id;
      if (!productId) return null;
      return {
        label: 'ซื้ออีกครั้ง',
        run: () => void router.push({ name: 'productDetail', params: { id: productId } }),
      };
    }
    default:
      return null;
  }
});

function goDetail() {
  void router.push({ name: 'orderDetail', params: { orderId: props.order.id } });
}

function runPrimaryAction() {
  primaryAction.value?.run();
}

</script>

<style scoped>
.order-card {
  background: #fff;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.order-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.order-card__id-block {
  flex: 1;
  min-width: 0;
}

.order-card__number {
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1d;
}

.order-card__date {
  font-size: 12.5px;
  color: #9ca3af;
  margin-top: 3px;
}

.order-card__divider {
  border-top: 1px solid #f3f4f6;
  margin: 14px 0;
}

.order-card__body {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.order-card__thumbs {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.order-card__thumb {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: #f3f4f6;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  object-fit: cover;
}

.order-card__extra {
  margin-left: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 5px 12px;
  white-space: nowrap;
  flex-shrink: 0;
}

.order-card__summary {
  flex: 1;
  min-width: 160px;
}

.order-card__items-line {
  font-size: 13.5px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-card__sub-line {
  font-size: 12.5px;
  color: #9ca3af;
  margin-top: 4px;
}

.order-card__amount {
  text-align: right;
  flex-shrink: 0;
}

.order-card__amount-label {
  font-size: 12.5px;
  color: #9ca3af;
}

.order-card__amount-value {
  font-size: 22px;
  font-weight: 700;
  color: #6d28d9;
  letter-spacing: -0.5px;
}

.order-card__actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  justify-content: flex-end;
}

.order-card__btn {
  padding: 11px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 14px;
  cursor: pointer;
  font-family: inherit;
  box-sizing: border-box;
  border: none;
}

.order-card__btn--secondary {
  background: #fff;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.order-card__btn--secondary:hover {
  background: #f9fafb;
}

.order-card__btn--primary {
  color: #fff;
  background: #6d28d9;
}

.order-card__btn--primary:hover {
  background: #5b21b6;
}

@media (max-width: 480px) {
  .order-card__body {
    flex-direction: column;
    align-items: stretch;
  }
  .order-card__amount {
    text-align: left;
  }
  .order-card__actions {
    flex-direction: column-reverse;
  }
  .order-card__btn {
    width: 100%;
  }
}
</style>
