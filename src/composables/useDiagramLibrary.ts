import { computed, onMounted, ref } from "vue";
import {
  LIBRARY_CACHE_KEY,
  LIBRARY_SEARCH_DEBOUNCE_MS,
  type CreateDiagramPayload,
  type CreateSectionPayload,
  type DiagramDto,
  type DiagramListItemDto,
  type SectionDto,
} from "@/constants/diagram-library";
import {
  checkApiHealth,
  createDiagram,
  createSection,
  deleteDiagram,
  deleteSection,
  fetchDiagram,
  fetchDiagrams,
  fetchSections,
  uploadDiagramFile,
} from "@/utils/diagram-api";
import {
  buildSectionTree,
  getCacheMeta,
  loadDiagramDetailFromCache,
  loadDiagramsFromCache,
  loadSectionsFromCache,
  saveDiagramDetailToCache,
  saveDiagramsToCache,
  saveSectionsToCache,
  setCacheMeta,
} from "@/utils/diagram-store";

export function useDiagramLibrary() {
  const sections = ref<SectionDto[]>([]);
  const flatSections = ref<SectionDto[]>([]);
  const diagrams = ref<DiagramListItemDto[]>([]);
  const selectedDiagram = ref<DiagramDto | null>(null);
  const selectedSectionId = ref<string | null>(null);
  const searchQuery = ref("");
  const tagFilter = ref("");
  const languageFilter = ref("");
  const isLoading = ref(false);
  const isSyncing = ref(false);
  const isOnline = ref(navigator.onLine);
  const apiAvailable = ref(false);
  const usingCache = ref(false);
  const lastSyncedAt = ref<string | null>(null);
  const errorMessage = ref("");

  let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined;

  const sectionTree = computed(() => buildSectionTree(flatSections.value));

  const allTags = computed(() => {
    const tags = new Set<string>();
    for (const diagram of diagrams.value) {
      for (const tag of diagram.tags) {
        tags.add(tag);
      }
    }
    return [...tags].sort((a, b) => a.localeCompare(b));
  });

  function updateOnlineStatus(): void {
    isOnline.value = navigator.onLine;
  }

  async function loadFromCache(): Promise<void> {
    const [cachedSections, cachedDiagrams, syncedAt] = await Promise.all([
      loadSectionsFromCache(),
      loadDiagramsFromCache(),
      getCacheMeta(LIBRARY_CACHE_KEY),
    ]);

    if (cachedSections.length > 0) {
      flatSections.value = cachedSections;
      sections.value = buildSectionTree(cachedSections);
      usingCache.value = true;
    }

    if (cachedDiagrams.length > 0) {
      diagrams.value = cachedDiagrams;
      usingCache.value = true;
    }

    lastSyncedAt.value = syncedAt;
  }

  async function syncFromServer(): Promise<void> {
    if (!navigator.onLine) {
      return;
    }

    isSyncing.value = true;
    errorMessage.value = "";

    try {
      apiAvailable.value = await checkApiHealth();
      if (!apiAvailable.value) {
        return;
      }

      const [sectionsResponse, diagramsResponse] = await Promise.all([
        fetchSections(),
        fetchDiagrams({
          q: searchQuery.value.trim() || undefined,
          sectionId: selectedSectionId.value ?? undefined,
          tag: tagFilter.value.trim() || undefined,
          language: languageFilter.value.trim() || undefined,
        }),
      ]);

      flatSections.value = sectionsResponse.flat;
      sections.value = sectionsResponse.sections;
      diagrams.value = diagramsResponse.diagrams;

      await Promise.all([
        saveSectionsToCache(sectionsResponse.flat),
        saveDiagramsToCache(diagramsResponse.diagrams),
      ]);

      const syncedAt = new Date().toISOString();
      await setCacheMeta(LIBRARY_CACHE_KEY, syncedAt);
      lastSyncedAt.value = syncedAt;
      usingCache.value = false;
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : "Sync failed";
    } finally {
      isSyncing.value = false;
    }
  }

  async function refresh(): Promise<void> {
    isLoading.value = true;
    try {
      await loadFromCache();
      await syncFromServer();
    } finally {
      isLoading.value = false;
    }
  }

  async function searchDiagrams(): Promise<void> {
    if (!navigator.onLine || !apiAvailable.value) {
      const query = searchQuery.value.trim().toLowerCase();
      const sectionId = selectedSectionId.value;
      const tag = tagFilter.value.trim().toLowerCase();
      const language = languageFilter.value.trim();

      const cached = await loadDiagramsFromCache();
      diagrams.value = cached.filter((diagram) => {
        if (sectionId && diagram.sectionId !== sectionId) {
          return false;
        }
        if (language && diagram.language !== language) {
          return false;
        }
        if (tag && !diagram.tags.some((item) => item.toLowerCase() === tag)) {
          return false;
        }
        if (!query) {
          return true;
        }
        return (
          diagram.title.toLowerCase().includes(query) ||
          diagram.description.toLowerCase().includes(query)
        );
      });
      return;
    }

    const response = await fetchDiagrams({
      q: searchQuery.value.trim() || undefined,
      sectionId: selectedSectionId.value ?? undefined,
      tag: tagFilter.value.trim() || undefined,
      language: languageFilter.value.trim() || undefined,
    });
    diagrams.value = response.diagrams;
    await saveDiagramsToCache(response.diagrams);
  }

  function scheduleSearch(): void {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }
    searchDebounceTimer = setTimeout(() => {
      void searchDiagrams();
    }, LIBRARY_SEARCH_DEBOUNCE_MS);
  }

  async function selectSection(sectionId: string | null): Promise<void> {
    selectedSectionId.value = sectionId;
    selectedDiagram.value = null;
    await searchDiagrams();
  }

  async function selectDiagram(diagramId: string): Promise<void> {
    isLoading.value = true;
    try {
      if (navigator.onLine && apiAvailable.value) {
        const diagram = await fetchDiagram(diagramId);
        selectedDiagram.value = diagram;
        await saveDiagramDetailToCache(diagram);
        return;
      }

      const cached = await loadDiagramDetailFromCache(diagramId);
      selectedDiagram.value = cached;
    } catch (error) {
      const cached = await loadDiagramDetailFromCache(diagramId);
      if (cached) {
        selectedDiagram.value = cached;
        return;
      }
      errorMessage.value =
        error instanceof Error ? error.message : "Failed to load diagram";
    } finally {
      isLoading.value = false;
    }
  }

  async function addSection(payload: CreateSectionPayload): Promise<SectionDto> {
    const section = await createSection(payload);
    await refresh();
    return section;
  }

  async function removeSection(sectionId: string): Promise<void> {
    await deleteSection(sectionId);
    if (selectedSectionId.value === sectionId) {
      selectedSectionId.value = null;
    }
    await refresh();
  }

  async function addDiagram(payload: CreateDiagramPayload): Promise<DiagramDto> {
    const diagram = await createDiagram(payload);
    await refresh();
    return diagram;
  }

  async function addDiagramFromFile(
    file: File,
    metadata: {
      title?: string;
      description?: string;
      tags?: string[];
      language?: string;
      sectionId?: string | null;
    },
  ): Promise<DiagramDto> {
    const diagram = await uploadDiagramFile(file, metadata);
    await refresh();
    return diagram;
  }

  async function removeDiagram(diagramId: string): Promise<void> {
    await deleteDiagram(diagramId);
    if (selectedDiagram.value?.id === diagramId) {
      selectedDiagram.value = null;
    }
    await refresh();
  }

  onMounted(() => {
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
  });

  return {
    sections,
    flatSections,
    sectionTree,
    diagrams,
    selectedDiagram,
    selectedSectionId,
    searchQuery,
    tagFilter,
    languageFilter,
    allTags,
    isLoading,
    isSyncing,
    isOnline,
    apiAvailable,
    usingCache,
    lastSyncedAt,
    errorMessage,
    refresh,
    scheduleSearch,
    searchDiagrams,
    selectSection,
    selectDiagram,
    addSection,
    removeSection,
    addDiagram,
    addDiagramFromFile,
    removeDiagram,
  };
}
