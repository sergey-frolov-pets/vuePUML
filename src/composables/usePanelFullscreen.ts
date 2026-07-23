import { onMounted, onUnmounted, ref, watch } from "vue";

export function usePanelFullscreen() {
  const isFullscreen = ref(false);

  function toggleFullscreen(): void {
    isFullscreen.value = !isFullscreen.value;
  }

  function onFullscreenKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape" && isFullscreen.value) {
      isFullscreen.value = false;
    }
  }

  watch(isFullscreen, (value) => {
    document.body.style.overflow = value ? "hidden" : "";
  });

  onMounted(() => {
    window.addEventListener("keydown", onFullscreenKeydown);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", onFullscreenKeydown);
    document.body.style.overflow = "";
  });

  return {
    isFullscreen,
    toggleFullscreen,
  };
}
