import { onUnmounted, ref } from "vue";

const LONG_PRESS_MS = 500;
const TOOLTIP_HIDE_MS = 2000;

export function useLongPressTooltip() {
  const tooltipVisible = ref(false);
  let pressTimer: ReturnType<typeof setTimeout> | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  function clearTimers(): void {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  }

  function hideTooltip(): void {
    tooltipVisible.value = false;
    clearTimers();
  }

  function onPointerDown(event: PointerEvent): void {
    if (event.pointerType === "mouse") {
      return;
    }

    clearTimers();
    pressTimer = setTimeout(() => {
      tooltipVisible.value = true;
      hideTimer = setTimeout(() => {
        tooltipVisible.value = false;
        hideTimer = null;
      }, TOOLTIP_HIDE_MS);
      pressTimer = null;
    }, LONG_PRESS_MS);
  }

  function onPointerUp(): void {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  }

  onUnmounted(clearTimers);

  return {
    tooltipVisible,
    onPointerDown,
    onPointerUp,
    onPointerCancel: onPointerUp,
    onPointerLeave: onPointerUp,
    hideTooltip,
  };
}
