import { ref, watch, type Ref } from "vue";
import type { LayoutEngine } from "@/constants";
import { validatePlantUmlSyntax } from "@/composables/usePlantUml";
import {
  extractSyntaxErrorLines,
  type SyntaxCheckResult,
} from "@/utils/plantuml-syntax";

type SyntaxCheckOptions = {
  source: Ref<string>;
  layout: Ref<LayoutEngine>;
  diagramDarkMode: Ref<boolean>;
};

export function useSyntaxCheck({
  source,
  layout,
  diagramDarkMode,
}: SyntaxCheckOptions) {
  const syntaxResult = ref<SyntaxCheckResult | null>(null);
  const syntaxErrorLines = ref<number[]>([]);
  const isValidating = ref(false);
  const isSyntaxModalOpen = ref(false);

  async function validateSyntax(): Promise<void> {
    isSyntaxModalOpen.value = true;
    isValidating.value = true;
    syntaxResult.value = null;

    try {
      const result = await validatePlantUmlSyntax(
        source.value,
        layout.value,
        diagramDarkMode.value,
      );
      syntaxResult.value = result;
      syntaxErrorLines.value = extractSyntaxErrorLines(result);
    } finally {
      isValidating.value = false;
    }
  }

  function closeSyntaxModal(): void {
    isSyntaxModalOpen.value = false;
  }

  function clearSyntaxHighlights(): void {
    syntaxErrorLines.value = [];
  }

  watch(source, () => {
    if (syntaxErrorLines.value.length > 0) {
      syntaxErrorLines.value = [];
    }
  });

  return {
    syntaxResult,
    syntaxErrorLines,
    isValidating,
    isSyntaxModalOpen,
    validateSyntax,
    closeSyntaxModal,
    clearSyntaxHighlights,
  };
}
