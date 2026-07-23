<script setup lang="ts">
import { ref } from 'vue';
import { useLongPressTooltip } from '@/composables/useLongPressTooltip';

defineProps<{
  label: string;
}>();

const rootRef = ref<HTMLElement | null>(null);

const {
  tooltipVisible,
  tooltipPosition,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onTouchStart,
  onTouchEnd,
  onTouchCancel,
} = useLongPressTooltip(rootRef);
</script>

<template>
  <span
    ref="rootRef"
    class="tooltip-wrap"
    @pointerdown.capture="onPointerDown"
    @pointerup.capture="onPointerUp"
    @pointercancel.capture="onPointerCancel"
    @touchstart.capture.passive="onTouchStart"
    @touchend.capture="onTouchEnd"
    @touchcancel.capture="onTouchCancel"
    @contextmenu.prevent
  >
    <slot />
  </span>

  <Teleport to="body">
    <span
      v-if="tooltipVisible"
      class="floating-tooltip"
      :style="{
        top: `${tooltipPosition.top}px`,
        left: `${tooltipPosition.left}px`,
      }"
      role="tooltip"
    >
      {{ label }}
    </span>
  </Teleport>
</template>

<style scoped>
.tooltip-wrap {
  position: relative;
  display: inline-flex;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
</style>
