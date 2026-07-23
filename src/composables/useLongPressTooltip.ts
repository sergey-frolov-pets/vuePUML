import { onUnmounted, ref } from "vue";

const LONG_PRESS_MS = 450;
const TOOLTIP_HIDE_MS = 2200;

export function useLongPressTooltip() {
  const tooltipVisible = ref(false);
  const suppressNextClick = ref(false);
  let pressTimer: ReturnType<typeof setTimeout> | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  let activePointerId: number | null = null;

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
    activePointerId = null;
  }

  function showTooltip(): void {
    tooltipVisible.value = true;
    suppressNextClick.value = true;

    if (typeof navigator.vibrate === "function") {
      navigator.vibrate(12);
    }

    hideTimer = setTimeout(() => {
      tooltipVisible.value = false;
      hideTimer = null;
    }, TOOLTIP_HIDE_MS);
  }

  function onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }

    if (activePointerId !== null && activePointerId !== event.pointerId) {
      return;
    }

    activePointerId = event.pointerId;
    suppressNextClick.value = false;
    clearTimers();

    pressTimer = setTimeout(() => {
      showTooltip();
      pressTimer = null;
    }, LONG_PRESS_MS);
  }

  function onPointerUp(event: PointerEvent): void {
    if (activePointerId !== null && event.pointerId !== activePointerId) {
      return;
    }

    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }

    activePointerId = null;
  }

  function consumeSuppressClick(): boolean {
    if (!suppressNextClick.value) {
      return false;
    }

    suppressNextClick.value = false;
    return true;
  }

  onUnmounted(hideTooltip);

  return {
    tooltipVisible,
    onPointerDown,
    onPointerUp,
    onPointerCancel: onPointerUp,
    onPointerLeave: onPointerUp,
    hideTooltip,
    consumeSuppressClick,
  };
}
