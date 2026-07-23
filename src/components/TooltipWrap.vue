<script setup lang="ts">
import { useLongPressTooltip } from "@/composables/useLongPressTooltip";

defineProps<{
  label: string;
}>();

const {
  tooltipVisible,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
} = useLongPressTooltip();
</script>

<template>
  <span
    class="tooltip-wrap"
    :title="label"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @pointerleave="onPointerLeave"
    @contextmenu.prevent
  >
    <slot />
    <span
      v-if="tooltipVisible"
      class="tooltip-wrap__tooltip"
      role="tooltip"
    >
      {{ label }}
    </span>
  </span>
</template>

<style scoped>
.tooltip-wrap {
  position: relative;
  display: inline-flex;
  touch-action: manipulation;
}

.tooltip-wrap__tooltip {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  z-index: 20;
  transform: translateX(-50%);
  max-width: 220px;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--text);
  color: var(--surface);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.3;
  text-align: center;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: var(--shadow);
}

.tooltip-wrap__tooltip::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: var(--text);
}
</style>
