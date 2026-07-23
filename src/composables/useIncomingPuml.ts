import { ref } from "vue";
import { useAppDialog } from "@/composables/useAppDialog";
import {
  consumeSharedLaunch,
  setupLaunchQueue,
} from "@/composables/usePumlShare";

type LoadedPayload = {
  content: string;
  fileName: string;
};

export function useIncomingPuml(onLoaded: (payload: LoadedPayload) => void) {
  const loadedFileName = ref("diagram.puml");

  function notifyLoaded(payload: LoadedPayload): void {
    loadedFileName.value = payload.fileName;
    onLoaded(payload);
  }

  async function initializeIncomingSources(): Promise<void> {
    setupLaunchQueue((payload) => {
      notifyLoaded(payload);
    });

    const shared = await consumeSharedLaunch();
    if (shared) {
      notifyLoaded(shared);
    }
  }

  function resetLoadedFileName(): void {
    loadedFileName.value = "diagram.puml";
  }

  return {
    loadedFileName,
    initializeIncomingSources,
    notifyLoaded,
    resetLoadedFileName,
  };
}

export function useImportErrorDialog() {
  const { alert } = useAppDialog();

  function showImportError(message: string): void {
    void alert({
      title: "Ошибка импорта",
      message,
      variant: "error",
    });
  }

  return { showImportError };
}
