<template>
  <div class="skeleton-card">
    <div class="skeleton-card__header">
      <div>
        <div class="skeleton-bar" style="width: 160px; height: 15px;" />
        <div class="skeleton-bar" style="width: 130px; height: 12px; margin-top: 8px;" />
      </div>
      <div class="skeleton-bar" style="width: 84px; height: 22px; border-radius: 999px;" />
    </div>

    <div class="skeleton-card__divider" />

    <div class="skeleton-card__body">
      <div class="skeleton-bar skeleton-bar--thumb" />
      <div class="skeleton-card__summary">
        <div class="skeleton-bar" style="width: 70%; height: 13px;" />
        <div class="skeleton-bar" style="width: 45%; height: 12px; margin-top: 8px;" />
      </div>
      <div class="skeleton-card__amount">
        <div class="skeleton-bar" style="width: 70px; height: 12px; margin-left: auto;" />
        <div class="skeleton-bar" style="width: 90px; height: 22px; margin-top: 6px; margin-left: auto;" />
      </div>
    </div>

    <div class="skeleton-card__actions">
      <div class="skeleton-bar" style="width: 100px; height: 40px; border-radius: 14px;" />
      <div class="skeleton-bar" style="width: 100px; height: 40px; border-radius: 14px;" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Static shape only — no props. Rendered in a v-for by the pages while loading.
</script>

<style scoped>
.skeleton-card {
  background: #fff;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.skeleton-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.skeleton-card__divider {
  border-top: 1px solid #f3f4f6;
  margin: 14px 0;
}

.skeleton-card__body {
  display: flex;
  align-items: center;
  gap: 16px;
}

.skeleton-bar--thumb {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  flex-shrink: 0;
}

.skeleton-card__summary {
  flex: 1;
  min-width: 0;
}

.skeleton-card__amount {
  flex-shrink: 0;
}

.skeleton-card__actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  justify-content: flex-end;
}

.skeleton-bar {
  border-radius: 6px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: skeleton-shimmer 1.4s ease infinite;
}

@keyframes skeleton-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

@media (max-width: 480px) {
  .skeleton-card__actions {
    flex-direction: column-reverse;
  }
  .skeleton-card__actions .skeleton-bar {
    width: 100% !important;
  }
}
</style>
