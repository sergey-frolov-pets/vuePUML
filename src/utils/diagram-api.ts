import type {
  CreateDiagramPayload,
  CreateSectionPayload,
  DiagramDto,
  DiagramListItemDto,
  SectionDto,
} from "@/constants/diagram-library";
import { API_BASE_URL } from "@/constants/diagram-library";

export class DiagramApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "DiagramApiError";
    this.status = status;
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    if (data.error) {
      return data.error;
    }
  } catch {
    // ignore
  }

  return `HTTP ${response.status}`;
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);

  if (!response.ok) {
    throw new DiagramApiError(await parseError(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function fetchSections(): Promise<{
  sections: SectionDto[];
  flat: SectionDto[];
}> {
  return requestJson("/sections");
}

export async function createSection(
  payload: CreateSectionPayload,
): Promise<SectionDto> {
  return requestJson("/sections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteSection(sectionId: string): Promise<void> {
  await requestJson(`/sections/${sectionId}`, { method: "DELETE" });
}

export async function fetchDiagrams(params: {
  q?: string;
  sectionId?: string;
  tag?: string;
  language?: string;
}): Promise<{ diagrams: DiagramListItemDto[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params.q) {
    searchParams.set("q", params.q);
  }
  if (params.sectionId) {
    searchParams.set("sectionId", params.sectionId);
  }
  if (params.tag) {
    searchParams.set("tag", params.tag);
  }
  if (params.language) {
    searchParams.set("language", params.language);
  }

  const query = searchParams.toString();
  return requestJson(`/diagrams${query ? `?${query}` : ""}`);
}

export async function fetchDiagram(diagramId: string): Promise<DiagramDto> {
  return requestJson(`/diagrams/${diagramId}`);
}

export async function createDiagram(
  payload: CreateDiagramPayload,
): Promise<DiagramDto> {
  return requestJson("/diagrams", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function uploadDiagramFile(
  file: File,
  metadata: {
    title?: string;
    description?: string;
    tags?: string[];
    language?: string;
    sectionId?: string | null;
  },
): Promise<DiagramDto> {
  const formData = new FormData();
  formData.append("file", file);
  if (metadata.title) {
    formData.append("title", metadata.title);
  }
  if (metadata.description) {
    formData.append("description", metadata.description);
  }
  if (metadata.tags?.length) {
    formData.append("tags", metadata.tags.join(","));
  }
  if (metadata.language) {
    formData.append("language", metadata.language);
  }
  if (metadata.sectionId) {
    formData.append("sectionId", metadata.sectionId);
  }

  return requestJson("/diagrams", {
    method: "POST",
    body: formData,
  });
}

export async function deleteDiagram(diagramId: string): Promise<void> {
  await requestJson(`/diagrams/${diagramId}`, { method: "DELETE" });
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
