import axios from 'axios';
import type { ResumeData, PublicResumeConfig } from '../types/resume';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Resume APIs ──

export async function fetchResumes(): Promise<ResumeData[]> {
  const { data } = await api.get('/resumes/');
  return data;
}

/** Fetch all resumes with full data (for initial hydration when localStorage is empty). */
export async function fetchResumesFull(): Promise<ResumeData[]> {
  const { data } = await api.get('/resumes/full');
  return data;
}

export async function fetchResume(id: string): Promise<ResumeData> {
  const { data } = await api.get(`/resumes/${id}`);
  return data;
}

export async function fetchResumeBySlug(slug: string): Promise<ResumeData> {
  const { data } = await api.get(`/resumes/slug/${slug}`);
  return data;
}

export async function createResume(resume: Omit<ResumeData, 'id'>): Promise<ResumeData> {
  const { data } = await api.post('/resumes/', resume);
  return data;
}

export async function updateResume(
  id: string,
  resume: Partial<ResumeData>
): Promise<ResumeData> {
  const { data } = await api.patch(`/resumes/${id}`, resume);
  return data;
}

export async function deleteResumeApi(id: string): Promise<void> {
  await api.delete(`/resumes/${id}`);
}

/**
 * Push the entire local resume list to the backend (source of truth = frontend).
 * The backend will upsert all incoming and delete any local-source resumes not included.
 */
export async function syncResumesToBackend(
  resumes: ResumeData[],
  activeResumeId: string | null,
  publicConfigMap?: Record<string, PublicResumeConfig>,
): Promise<{ synced: number; ids: string[] }> {
  const payload = {
    resumes: resumes.map((r) => ({
      id: r.id,
      data: {
        title: r.title,
        slug: r.slug,
        template_id: r.template_id,
        basics: r.basics,
        education: r.education,
        work: r.work,
        skills_text: r.skills_text,
        projects: r.projects,
        awards: r.awards,
        languages: r.languages,
        interests: r.interests,
        custom_sections: r.custom_sections,
        style_config: r.style_config,
        section_visibility: r.section_visibility,
        section_order: r.section_order,
        sort_order: r.sort_order,
        public_config: publicConfigMap?.[r.id] ?? null,
      },
    })),
    active_resume_id: activeResumeId,
  };
  const { data } = await api.put('/resumes/sync', payload);
  return data;
}

// ── Git 同步 APIs ──

export interface SyncConfig {
  repo_url: string;
  branch: string;
}

export interface SyncResult {
  ok: boolean;
  message?: string;
  error?: string;
  detail?: string;
}

export interface GitStatus {
  initialized: boolean;
  configured: boolean;
  branch?: string;
  has_uncommitted_changes?: boolean;
  changes?: string;
}

export async function getSyncConfig(): Promise<SyncConfig> {
  const { data } = await api.get('/sync/config');
  return data;
}

export async function updateSyncConfig(config: SyncConfig): Promise<{ ok: boolean; config: SyncConfig }> {
  const { data } = await api.put('/sync/config', config);
  return data;
}

export async function gitPull(): Promise<SyncResult> {
  const { data } = await api.post('/sync/pull');
  return data;
}

export async function gitPush(): Promise<SyncResult> {
  const { data } = await api.post('/sync/push');
  return data;
}

export async function getGitStatus(): Promise<GitStatus> {
  const { data } = await api.get('/sync/status');
  return data;
}

export async function exportResumeJson(id: string): Promise<ResumeData> {
  const { data } = await api.post(`/resumes/${id}/export-json`);
  return data;
}

export async function importResumeJson(resume: Omit<ResumeData, 'id'>): Promise<unknown> {
  const { data } = await api.post('/resumes/import-json', resume);
  return data;
}

// ── Font APIs ──

export interface FontInfo {
  id: string;
  name: string;
  family: string;
  mime_type: string;
  file_size: number;
}

export async function listFonts(): Promise<FontInfo[]> {
  const { data } = await api.get('/fonts/');
  return data;
}

export async function uploadFont(file: File, family?: string): Promise<FontInfo> {
  const form = new FormData();
  form.append('file', file);
  if (family) form.append('family', family);
  const { data } = await api.post('/fonts/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteFont(id: string): Promise<void> {
  await api.delete(`/fonts/${id}`);
}

export function getFontFileUrl(id: string): string {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  return `${base}/fonts/${id}/file`;
}

export default api;
