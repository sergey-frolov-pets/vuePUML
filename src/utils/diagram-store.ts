import type {
  DiagramDto,
  DiagramListItemDto,
  SectionDto,
} from "@/constants/diagram-library";

const DB_NAME = "vueplantuml-library";
const DB_VERSION = 1;

const STORE_SECTIONS = "sections";
const STORE_DIAGRAMS = "diagrams";
const STORE_DIAGRAM_DETAILS = "diagramDetails";
const STORE_META = "meta";

interface MetaRecord {
  key: string;
  value: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_SECTIONS)) {
        db.createObjectStore(STORE_SECTIONS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_DIAGRAMS)) {
        db.createObjectStore(STORE_DIAGRAMS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_DIAGRAM_DETAILS)) {
        db.createObjectStore(STORE_DIAGRAM_DETAILS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

function runTransaction<T>(
  storeNames: string | string[],
  mode: IDBTransactionMode,
  callback: (stores: Record<string, IDBObjectStore>) => Promise<T> | T,
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const names = Array.isArray(storeNames) ? storeNames : [storeNames];
        const transaction = db.transaction(names, mode);
        const stores: Record<string, IDBObjectStore> = {};
        for (const name of names) {
          stores[name] = transaction.objectStore(name);
        }

        Promise.resolve(callback(stores))
          .then(resolve)
          .catch(reject);

        transaction.oncomplete = () => db.close();
        transaction.onerror = () => {
          db.close();
          reject(transaction.error ?? new Error("IndexedDB transaction failed"));
        };
      }),
  );
}

function getAllFromStore<T>(store: IDBObjectStore): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB getAll failed"));
  });
}

export async function saveSectionsToCache(sections: SectionDto[]): Promise<void> {
  await runTransaction(STORE_SECTIONS, "readwrite", async (stores) => {
    const store = stores[STORE_SECTIONS];
    store.clear();
    for (const section of sections) {
      store.put(section);
    }
  });
}

export async function loadSectionsFromCache(): Promise<SectionDto[]> {
  return runTransaction(STORE_SECTIONS, "readonly", (stores) =>
    getAllFromStore<SectionDto>(stores[STORE_SECTIONS]),
  );
}

export async function saveDiagramsToCache(
  diagrams: DiagramListItemDto[],
): Promise<void> {
  await runTransaction(STORE_DIAGRAMS, "readwrite", async (stores) => {
    const store = stores[STORE_DIAGRAMS];
    store.clear();
    for (const diagram of diagrams) {
      store.put(diagram);
    }
  });
}

export async function loadDiagramsFromCache(): Promise<DiagramListItemDto[]> {
  return runTransaction(STORE_DIAGRAMS, "readonly", (stores) =>
    getAllFromStore<DiagramListItemDto>(stores[STORE_DIAGRAMS]),
  );
}

export async function saveDiagramDetailToCache(diagram: DiagramDto): Promise<void> {
  await runTransaction(STORE_DIAGRAM_DETAILS, "readwrite", (stores) => {
    stores[STORE_DIAGRAM_DETAILS].put(diagram);
  });
}

export async function loadDiagramDetailFromCache(
  diagramId: string,
): Promise<DiagramDto | null> {
  return runTransaction(STORE_DIAGRAM_DETAILS, "readonly", (stores) =>
    new Promise((resolve, reject) => {
      const request = stores[STORE_DIAGRAM_DETAILS].get(diagramId);
      request.onsuccess = () => resolve((request.result as DiagramDto) ?? null);
      request.onerror = () =>
        reject(request.error ?? new Error("IndexedDB get failed"));
    }),
  );
}

export async function setCacheMeta(key: string, value: string): Promise<void> {
  await runTransaction(STORE_META, "readwrite", (stores) => {
    stores[STORE_META].put({ key, value } satisfies MetaRecord);
  });
}

export async function getCacheMeta(key: string): Promise<string | null> {
  return runTransaction(STORE_META, "readonly", (stores) =>
    new Promise((resolve, reject) => {
      const request = stores[STORE_META].get(key);
      request.onsuccess = () => {
        const record = request.result as MetaRecord | undefined;
        resolve(record?.value ?? null);
      };
      request.onerror = () =>
        reject(request.error ?? new Error("IndexedDB get meta failed"));
    }),
  );
}

export function buildSectionTree(flatSections: SectionDto[]): SectionDto[] {
  const byId = new Map(
    flatSections.map((section) => [section.id, { ...section, children: [] as SectionDto[] }]),
  );
  const roots: SectionDto[] = [];

  for (const section of byId.values()) {
    if (section.parentId && byId.has(section.parentId)) {
      byId.get(section.parentId)!.children!.push(section);
    } else {
      roots.push(section);
    }
  }

  const sortRecursive = (items: SectionDto[]): void => {
    items.sort(
      (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title),
    );
    for (const item of items) {
      if (item.children?.length) {
        sortRecursive(item.children);
      }
    }
  };

  sortRecursive(roots);
  return roots;
}
