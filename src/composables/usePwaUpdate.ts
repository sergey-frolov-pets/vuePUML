import { computed, ref } from "vue";
import { useAppDialog } from "@/composables/useAppDialog";
import { isStandaloneApp } from "@/pwa/installPromptState";
import {
  applyPwaUpdate,
  checkForPwaUpdate,
  updateAvailable,
} from "@/pwa/pwaUpdateService";

export function usePwaUpdate() {
  const { confirm, alert } = useAppDialog();
  const isUpdating = ref(false);

  const canShowUpdateButton = computed(() => isStandaloneApp());

  async function updateApp(): Promise<void> {
    if (isUpdating.value) {
      return;
    }

    isUpdating.value = true;

    try {
      const updateCheck = await checkForPwaUpdate();

      if (updateCheck.hasUpdate || updateAvailable.value) {
        const installedVersion =
          updateCheck.installedVersion ?? updateCheck.activeSwVersion;
        const confirmed = await confirm({
          title: "Обновить приложение?",
          message: installedVersion
            ? `Установлена версия ${installedVersion}, доступна ${updateCheck.currentVersion}. Перезагрузить сейчас?`
            : `Доступна версия ${updateCheck.currentVersion}. Перезагрузить сейчас?`,
          confirmLabel: "Обновить",
        });

        if (confirmed) {
          await applyPwaUpdate();
        }

        return;
      }

      const reloadAnyway = await confirm({
        title: "Обновления нет",
        message: `Уже установлена актуальная версия ${updateCheck.currentVersion}. Перезагрузить страницу на всякий случай?`,
        confirmLabel: "Перезагрузить",
        cancelLabel: "Закрыть",
      });

      if (reloadAnyway) {
        window.location.reload();
      }
    } catch {
      await alert({
        title: "Не удалось проверить обновления",
        message: "Попробуйте перезагрузить страницу вручную.",
        variant: "error",
      });
    } finally {
      isUpdating.value = false;
    }
  }

  return {
    canShowUpdateButton,
    updateAvailable,
    isUpdating,
    updateApp,
  };
}
