import type { DiagramLanguage } from "./config.js";

export interface SectionRow {
  id: string;
  parent_id: string | null;
  title: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DiagramRow {
  id: string;
  section_id: string | null;
  title: string;
  description: string;
  tags: string;
  language: DiagramLanguage;
  source: string;
  file_name: string;
  byte_size: number;
  created_at: string;
  updated_at: string;
}

export interface SectionDto {
  id: string;
  parentId: string | null;
  title: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  children?: SectionDto[];
}

export interface DiagramDto {
  id: string;
  sectionId: string | null;
  title: string;
  description: string;
  tags: string[];
  language: DiagramLanguage;
  source: string;
  fileName: string;
  byteSize: number;
  createdAt: string;
  updatedAt: string;
}

export interface DiagramListItemDto {
  id: string;
  sectionId: string | null;
  title: string;
  description: string;
  tags: string[];
  language: DiagramLanguage;
  fileName: string;
  byteSize: number;
  createdAt: string;
  updatedAt: string;
}
