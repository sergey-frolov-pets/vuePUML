<script setup lang="ts">
import { useLongPressTooltip } from "@/composables/useLongPressTooltip";

defineProps<{
  label: string;
  disabled?: boolean;
  pressed?: boolean;
  primary?: boolean;
  format?: boolean;
}>();

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const {
  tooltipVisible,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
  consumeSuppressClick,
} = useLongPressTooltip();

function onClick(event: MouseEvent): void {
  if (consumeSuppressClick()) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  emit("click", event);
}
</script>

<template>
  <button
    type="button"
    class="icon-btn btn btn-icon"
    :class="{
      'btn-primary': primary,
      'btn-format': format,
      'icon-btn--pressed': pressed,
    }"
    :disabled="disabled"
    :aria-label="label"
    :aria-pressed="pressed !== undefined ? pressed : undefined"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @pointerleave="onPointerLeave"
    @contextmenu.prevent
    @click="onClick"
  >
    <slot />
    <span
      v-if="tooltipVisible"
      class="icon-btn__tooltip"
      role="tooltip"
    >
      {{ label }}
    </span>
  </button>
</template>

<style scoped>
.icon-btn {
  position: relative;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.icon-btn--pressed {
  background: color-mix(in srgb, var(--accent) 14%, var(--surface));
  border-color: color-mix(in srgb, var(--accent) 40%, var(--border));
}

.icon-btn__tooltip {
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

.icon-btn__tooltip::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: var(--text);
}
</style>
