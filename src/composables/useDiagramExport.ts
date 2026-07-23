import { computed, type Ref } from "vue";
import { useAppDialog } from "@/composables/useAppDialog";
import { downloadBlob, downloadTextFile, svgToPngBlob } from "@/utils/export";
import { resolvePumlFileName, savePumlSource } from "@/utils/puml-files";

type DiagramExportOptions = {
  source: Ref<string>;
  svg: Ref<string>;
  previewBackground: Ref<string>;
  loadedFileName: Ref<string>;
  error: Ref<string>;
  isRendering: Ref<boolean>;
};

export function useDiagramExport({
  source,
  svg,
  previewBackground,
  loadedFileName,
  error,
  isRendering,
}: DiagramExportOptions) {
  const { prompt, alert } = useAppDialog();

  const canSave = computed(() => Boolean(source.value.trim()));
  const canExport = computed(
    () => Boolean(svg.value) && !error.value && !isRendering.value,
  );

  async function savePuml(): Promise<void> {
    if (!canSave.value) {
      return;
    }

    const fileName = await prompt({
      title: "Сохранить .puml",
      message: "Имя файла",
      value: loadedFileName.value,
      confirmLabel: "Сохранить",
      placeholder: "diagram.puml",
    });

    if (fileName === null) {
      return;
    }

    const resolvedName = resolvePumlFileName(fileName);
    loadedFileName.value = resolvedName;
    savePumlSource(source.value, resolvedName);
  }

  function exportSvg(): void {
    if (!svg.value) {
      return;
    }

    downloadTextFile(svg.value, "diagram.svg", "image/svg+xml;charset=utf-8");
  }

  async function exportPng(): Promise<void> {
    if (!svg.value) {
      return;
    }

    try {
      const pngBlob = await svgToPngBlob(svg.value, previewBackground.value);
      downloadBlob(pngBlob, "diagram.png");
    } catch (exportError) {
      const message =
        exportError instanceof Error
          ? exportError.message
          : "Не удалось экспортировать PNG";
      void alert({
        title: "Ошибка экспорта",
        message,
        variant: "error",
      });
    }
  }

  return {
    canSave,
    canExport,
    savePuml,
    exportSvg,
    exportPng,
  };
}
