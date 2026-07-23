import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

const LONG_PRESS_MS = 450;
const TOOLTIP_HIDE_MS = 2200;
const TOOLTIP_OFFSET_PX = 8;

export function useLongPressTooltip(rootRef: Ref<HTMLElement | null>) {
  const tooltipVisible = ref(false);
  const tooltipPosition = ref({ top: 0, left: 0 });
  const suppressNextClick = ref(false);

  let pressTimer: ReturnType<typeof setTimeout> | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  let activePointerId: number | null = null;

  function clearPressTimer(): void {
    if (pressTimer !== null) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  }

  function clearHideTimer(): void {
    if (hideTimer !== null) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  }

  function releasePointerCapture(): void {
    const el = rootRef.value;
    if (!el || activePointerId === null) return;

    if (el.hasPointerCapture(activePointerId)) {
      try {
        el.releasePointerCapture(activePointerId);
      } catch {
        // ignore
      }
    }
  }

  function updatePosition(): void {
    const el = rootRef.value;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    tooltipPosition.value = {
      top: rect.top - TOOLTIP_OFFSET_PX,
      left: rect.left + rect.width / 2,
    };
  }

  function hideTooltip(): void {
    tooltipVisible.value = false;
    clearPressTimer();
    clearHideTimer();
    releasePointerCapture();
    activePointerId = null;
  }

  function showTooltip(): void {
    updatePosition();
    tooltipVisible.value = true;
    suppressNextClick.value = true;

    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(12);
    }

    clearHideTimer();
    hideTimer = setTimeout(() => {
      tooltipVisible.value = false;
      hideTimer = null;
    }, TOOLTIP_HIDE_MS);
  }

  function onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    if (activePointerId !== null && activePointerId !== event.pointerId) return;

    activePointerId = event.pointerId;
    suppressNextClick.value = false;
    clearPressTimer();
    clearHideTimer();
    tooltipVisible.value = false;

    const el = rootRef.value ?? (event.currentTarget as HTMLElement | null);
    if (el) {
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    }

    pressTimer = setTimeout(() => {
      showTooltip();
      pressTimer = null;
    }, LONG_PRESS_MS);
  }

  function onPointerUp(event: PointerEvent): void {
    if (activePointerId !== null && event.pointerId !== activePointerId) return;

    clearPressTimer();
    releasePointerCapture();
    activePointerId = null;
  }

  function onPointerCancel(event: PointerEvent): void {
    if (activePointerId !== null && event.pointerId !== activePointerId) return;
    hideTooltip();
  }

  function consumeSuppressClick(): boolean {
    if (!suppressNextClick.value) return false;
    suppressNextClick.value = false;
    return true;
  }

  function onViewportChange(): void {
    if (!tooltipVisible.value) return;
    updatePosition();
  }

  onMounted(() => {
    window.addEventListener('scroll', onViewportChange, true);
    window.addEventListener('resize', onViewportChange);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onViewportChange, true);
    window.removeEventListener('resize', onViewportChange);
    hideTooltip();
  });

  return {
    tooltipVisible,
    tooltipPosition,
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    hideTooltip,
    consumeSuppressClick,
  };
}
