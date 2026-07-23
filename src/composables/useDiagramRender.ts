import { onUnmounted, ref, type Ref } from "vue";
import { RENDER_DEBOUNCE_MS, type LayoutEngine } from "@/constants";
import {
  isVizGlobalReady,
  renderPlantUmlToSvg,
  waitForEngineReady,
} from "@/composables/usePlantUml";
import { applyLayoutPragma, splitSourceLines } from "@/utils/plantuml-source";

type DiagramRenderOptions = {
  source: Ref<string>;
  layout: Ref<LayoutEngine>;
  diagramDarkMode: Ref<boolean>;
  onPersist: () => void;
};

export function useDiagramRender({
  source,
  layout,
  diagramDarkMode,
  onPersist,
}: DiagramRenderOptions) {
  const svg = ref("");
  const error = ref("");
  const isRendering = ref(false);
  const engineReady = ref(false);
  const engineStatus = ref("Загрузка движка PlantUML...");

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let renderGeneration = 0;

  function clearRenderError(): void {
    error.value = "";
  }

  async function renderDiagram(): Promise<void> {
    if (!engineReady.value) {
      error.value = "Движок PlantUML ещё не загружен";
      return;
    }

    const generation = ++renderGeneration;
    isRendering.value = true;
    error.value = "";

    try {
      const prepared = applyLayoutPragma(source.value, layout.value);
      const lines = splitSourceLines(prepared);
      const result = await renderPlantUmlToSvg(lines, {
        dark: diagramDarkMode.value,
      });

      if (generation !== renderGeneration) {
        return;
      }

      svg.value = result;
    } catch (renderError) {
      if (generation !== renderGeneration) {
        return;
      }

      svg.value = "";
      error.value =
        renderError instanceof Error
          ? renderError.message
          : "Неизвестная ошибка рендеринга";
    } finally {
      if (generation === renderGeneration) {
        isRendering.value = false;
      }
    }
  }

  function scheduleRender(): void {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      void renderDiagram();
    }, RENDER_DEBOUNCE_MS);
  }

  function schedulePersistAndRender(): void {
    onPersist();
    scheduleRender();
  }

  async function bootEngine(): Promise<void> {
    try {
      await waitForEngineReady();
      engineReady.value = isVizGlobalReady();
      engineStatus.value = engineReady.value
        ? "Движок готов"
        : "Движок не инициализировался";
      scheduleRender();
    } catch (bootError) {
      engineReady.value = false;
      engineStatus.value =
        bootError instanceof Error
          ? bootError.message
          : "Ошибка загрузки движка";
      error.value = engineStatus.value;
    }
  }

  onUnmounted(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    renderGeneration += 1;
  });

  return {
    svg,
    error,
    isRendering,
    engineReady,
    engineStatus,
    renderDiagram,
    scheduleRender,
    schedulePersistAndRender,
    clearRenderError,
    bootEngine,
  };
}
