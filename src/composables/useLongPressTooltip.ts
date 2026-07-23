import { nextTick, onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

const LONG_PRESS_MS = 400;
const TOOLTIP_HIDE_MS = 2200;
const TOOLTIP_OFFSET_PX = 8;
const VIEWPORT_MARGIN_PX = 8;
const TOOLTIP_ESTIMATED_WIDTH_PX = 200;
const TOOLTIP_ESTIMATED_HEIGHT_PX = 40;

export type TooltipPlacement = 'top' | 'bottom';

export function useLongPressTooltip(rootRef: Ref<HTMLElement | null>) {
  const tooltipVisible = ref(false);
  const tooltipPosition = ref({ top: 0, left: 0 });
  const tooltipPlacement = ref<TooltipPlacement>('top');
  const tooltipRef = ref<HTMLElement | null>(null);
  const suppressNextClick = ref(false);

  let pressTimer: ReturnType<typeof setTimeout> | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  let activePointerId: number | null = null;
  let touchActive = false;

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

  function clampTooltipPosition(): void {
    const anchor = rootRef.value;
    if (!anchor) return;

    const anchorRect = anchor.getBoundingClientRect();
    const tooltip = tooltipRef.value;
    const tooltipWidth = tooltip?.offsetWidth ?? TOOLTIP_ESTIMATED_WIDTH_PX;
    const tooltipHeight = tooltip?.offsetHeight ?? TOOLTIP_ESTIMATED_HEIGHT_PX;
    const halfWidth = tooltipWidth / 2;

    let left = anchorRect.left + anchorRect.width / 2;
    left = Math.max(
      VIEWPORT_MARGIN_PX + halfWidth,
      Math.min(window.innerWidth - VIEWPORT_MARGIN_PX - halfWidth, left),
    );

    const spaceAbove = anchorRect.top - VIEWPORT_MARGIN_PX;
    const spaceBelow = window.innerHeight - anchorRect.bottom - VIEWPORT_MARGIN_PX;
    let placement: TooltipPlacement = 'top';
    let top = anchorRect.top - TOOLTIP_OFFSET_PX;

    if (
      spaceAbove < tooltipHeight + TOOLTIP_OFFSET_PX &&
      spaceBelow > spaceAbove
    ) {
      placement = 'bottom';
      top = anchorRect.bottom + TOOLTIP_OFFSET_PX;
    }

    tooltipPosition.value = { top, left };
    tooltipPlacement.value = placement;
  }

  function hideTooltip(): void {
    tooltipVisible.value = false;
    clearPressTimer();
    clearHideTimer();
    releasePointerCapture();
    activePointerId = null;
    touchActive = false;
  }

  function showTooltip(): void {
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

    void nextTick(() => {
      requestAnimationFrame(() => {
        clampTooltipPosition();
      });
    });
  }

  function startPressTimer(): void {
    clearPressTimer();
    clearHideTimer();
    tooltipVisible.value = false;

    pressTimer = setTimeout(() => {
      showTooltip();
      pressTimer = null;
    }, LONG_PRESS_MS);
  }

  function onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    if (activePointerId !== null && activePointerId !== event.pointerId) return;

    activePointerId = event.pointerId;
    suppressNextClick.value = false;
    touchActive = event.pointerType === 'touch';

    const el = rootRef.value ?? (event.currentTarget as HTMLElement | null);
    if (el) {
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    }

    startPressTimer();
  }

  function onPointerUp(event: PointerEvent): void {
    if (activePointerId !== null && event.pointerId !== activePointerId) return;

    clearPressTimer();
    releasePointerCapture();
    activePointerId = null;
    touchActive = false;
  }

  function onPointerCancel(event: PointerEvent): void {
    if (activePointerId !== null && event.pointerId !== activePointerId) return;

    releasePointerCapture();

    if (tooltipVisible.value) {
      hideTooltip();
    }
  }

  function onTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) return;
    if (touchActive || activePointerId !== null) return;

    touchActive = true;
    suppressNextClick.value = false;
    startPressTimer();
  }

  function onTouchEnd(): void {
    if (!touchActive) return;

    clearPressTimer();
    touchActive = false;
  }

  function onTouchCancel(): void {
    if (!touchActive) return;

    if (tooltipVisible.value) {
      hideTooltip();
      return;
    }

    clearPressTimer();
    touchActive = false;
  }

  function consumeSuppressClick(): boolean {
    if (!suppressNextClick.value) return false;
    suppressNextClick.value = false;
    return true;
  }

  function onViewportChange(): void {
    if (!tooltipVisible.value) return;
    clampTooltipPosition();
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
    tooltipPlacement,
    tooltipRef,
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onTouchStart,
    onTouchEnd,
    onTouchCancel,
    hideTooltip,
    consumeSuppressClick,
  };
}
