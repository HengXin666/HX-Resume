import axios from 'axios';
import type { ResumeData } from '../types/resume';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchResumes(): Promise<ResumeData[]> {
  const { data } = await api.get('/resumes/');
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

export async function deleteResume(id: string): Promise<void> {
  await api.delete(`/resumes/${id}`);
}

export async function syncFromGithub(): Promise<{ synced: unknown[]; count: number }> {
  const { data } = await api.post('/resumes/sync-github');
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
