import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AwardItem,
  Basics,
  CustomSection,
  CustomSectionItem,
  EducationItem,
  InterestItem,
  LanguageItem,
  ProjectItem,
  ResumeData,
  ResumeVersion,
  SectionKey,
  SectionVisibility,
  StyleConfig,
  WorkItem,
} from '../types/resume';
import { DEFAULT_SECTION_ORDER, DEFAULT_SECTION_VISIBILITY, createEmptyResume } from '../types/resume';

interface ResumeStore {
  // Multi-resume state
  resumes: ResumeData[];
  activeResumeId: string | null;

  // Derived getter
  activeResume: () => ResumeData | null;

  // Resume list management
  createResume: () => string;
  duplicateResume: (id: string) => string | null;
  deleteResume: (id: string) => void;
  setActiveResume: (id: string) => void;
  reorderResumes: (fromIndex: number, toIndex: number) => void;

  // Version snapshot (manual, with change detection)
  saveVersion: (resumeId?: string, label?: string) => boolean;
  restoreVersion: (resumeId: string, versionId: string) => void;
  deleteVersion: (resumeId: string, versionId: string) => void;

  // Edit current resume
  updateBasics: (basics: Partial<Basics>) => void;
  setEducation: (education: EducationItem[]) => void;
  addEducation: (item: EducationItem) => void;
  removeEducation: (index: number) => void;
  updateEducation: (index: number, item: EducationItem) => void;
  setWork: (work: WorkItem[]) => void;
  addWork: (item: WorkItem) => void;
  removeWork: (index: number) => void;
  updateWork: (index: number, item: WorkItem) => void;
  updateSkillsText: (text: string) => void;
  setProjects: (projects: ProjectItem[]) => void;
  addProject: (item: ProjectItem) => void;
  removeProject: (index: number) => void;
  updateProject: (index: number, item: ProjectItem) => void;
  // Awards
  setAwards: (awards: AwardItem[]) => void;
  addAward: (item: AwardItem) => void;
  removeAward: (index: number) => void;
  updateAward: (index: number, item: AwardItem) => void;
  // Languages
  setLanguages: (languages: LanguageItem[]) => void;
  addLanguage: (item: LanguageItem) => void;
  removeLanguage: (index: number) => void;
  updateLanguage: (index: number, item: LanguageItem) => void;
  // Interests
  setInterests: (interests: InterestItem[]) => void;
  addInterest: (item: InterestItem) => void;
  removeInterest: (index: number) => void;
  updateInterest: (index: number, item: InterestItem) => void;
  // Custom sections
  addCustomSection: (title: string) => string;
  removeCustomSection: (id: string) => void;
  updateCustomSectionTitle: (id: string, title: string) => void;
  addCustomSectionItem: (sectionId: string, item: CustomSectionItem) => void;
  removeCustomSectionItem: (sectionId: string, itemIndex: number) => void;
  updateCustomSectionItem: (sectionId: string, itemIndex: number, item: CustomSectionItem) => void;
  updateStyleConfig: (config: Partial<StyleConfig>) => void;
  setTemplateId: (id: string) => void;
  setTitle: (title: string) => void;
  toggleSectionVisibility: (section: SectionKey) => void;
  setSectionVisibility: (visibility: Partial<SectionVisibility>) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;

  // Import/Export
  importResume: (data: Partial<ResumeData>) => string;
  setResume: (data: ResumeData) => void;
}

/** Mutate the active resume inside the list immutably */
function patchActive(
  state: { resumes: ResumeData[]; activeResumeId: string | null },
  patcher: (r: ResumeData) => Partial<ResumeData>,
): { resumes: ResumeData[] } {
  return {
    resumes: state.resumes.map((r) =>
      r.id === state.activeResumeId
        ? { ...r, ...patcher(r), updated_at: new Date().toISOString() }
        : r,
    ),
  };
}

/** Mutate a specific resume by id */
function patchById(
  state: { resumes: ResumeData[] },
  targetId: string,
  patcher: (r: ResumeData) => Partial<ResumeData>,
): { resumes: ResumeData[] } {
  return {
    resumes: state.resumes.map((r) =>
      r.id === targetId
        ? { ...r, ...patcher(r), updated_at: new Date().toISOString() }
        : r,
    ),
  };
}

/**
 * Create a fingerprint of resume content (excluding versions/metadata)
 * for change detection.
 */
function resumeContentFingerprint(r: ResumeData): string {
  const snapshot = {
    title: r.title,
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
  };
  return JSON.stringify(snapshot);
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      resumes: [],
      activeResumeId: null,

      activeResume: () => {
        const { resumes, activeResumeId } = get();
        return resumes.find((r) => r.id === activeResumeId) ?? null;
      },

      // ── Resume list management ──
      createResume: () => {
        const newResume = createEmptyResume();
        newResume.sort_order = get().resumes.length;
        set((s) => ({
          resumes: [...s.resumes, newResume],
          activeResumeId: newResume.id,
        }));
        return newResume.id;
      },

      duplicateResume: (id) => {
        const source = get().resumes.find((r) => r.id === id);
        if (!source) return null;
        const now = new Date().toISOString();
        const dup: ResumeData = {
          ...structuredClone(source),
          id: crypto.randomUUID(),
          title: `${source.title} (副本)`,
          slug: `resume-${Date.now()}`,
          created_at: now,
          updated_at: now,
          sort_order: get().resumes.length,
          versions: [],
        };
        set((s) => ({
          resumes: [...s.resumes, dup],
          activeResumeId: dup.id,
        }));
        return dup.id;
      },

      deleteResume: (id) => {
        set((s) => {
          const remaining = s.resumes.filter((r) => r.id !== id);
          const newActiveId =
            s.activeResumeId === id
              ? remaining[0]?.id ?? null
              : s.activeResumeId;
          return { resumes: remaining, activeResumeId: newActiveId };
        });
      },

      setActiveResume: (id) => set({ activeResumeId: id }),

      reorderResumes: (fromIndex, toIndex) => {
        set((s) => {
          const list = [...s.resumes];
          const [moved] = list.splice(fromIndex, 1);
          list.splice(toIndex, 0, moved);
          return {
            resumes: list.map((r, i) => ({ ...r, sort_order: i })),
          };
        });
      },

      // ── Version snapshot (with change detection) ──
      saveVersion: (resumeId, label) => {
        const targetId = resumeId ?? get().activeResumeId;
        const resume = get().resumes.find((r) => r.id === targetId);
        if (!resume) return false;

        // Check if content has actually changed since last snapshot
        const currentFingerprint = resumeContentFingerprint(resume);
        if (resume.versions.length > 0) {
          const lastVersion = resume.versions[resume.versions.length - 1];
          const lastFingerprint = resumeContentFingerprint(lastVersion.data);
          if (currentFingerprint === lastFingerprint) {
            // No changes since last snapshot
            return false;
          }
        }

        const version: ResumeVersion = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          label: label ?? `v${resume.versions.length + 1}`,
          data: structuredClone({ ...resume, versions: [] }),
        };
        set((s) => patchById(s, resume.id, (r) => ({
          versions: [...r.versions, version],
        })));
        return true;
      },

      restoreVersion: (resumeId, versionId) => {
        set((s) => ({
          resumes: s.resumes.map((r) => {
            if (r.id !== resumeId) return r;
            const ver = r.versions.find((v) => v.id === versionId);
            if (!ver) return r;
            return {
              ...ver.data,
              id: r.id,
              versions: r.versions,
              sort_order: r.sort_order,
              updated_at: new Date().toISOString(),
            };
          }),
        }));
      },

      deleteVersion: (resumeId, versionId) => {
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === resumeId
              ? { ...r, versions: r.versions.filter((v) => v.id !== versionId) }
              : r,
          ),
        }));
      },

      // ── Edit active resume fields ──
      updateBasics: (basics) =>
        set((s) => patchActive(s, (r) => ({
          basics: { ...r.basics, ...basics },
        }))),

      setEducation: (education) =>
        set((s) => patchActive(s, () => ({ education }))),
      addEducation: (item) =>
        set((s) => patchActive(s, (r) => ({
          education: [...r.education, item],
        }))),
      removeEducation: (index) =>
        set((s) => patchActive(s, (r) => ({
          education: r.education.filter((_, i) => i !== index),
        }))),
      updateEducation: (index, item) =>
        set((s) => patchActive(s, (r) => ({
          education: r.education.map((e, i) => (i === index ? item : e)),
        }))),

      setWork: (work) =>
        set((s) => patchActive(s, () => ({ work }))),
      addWork: (item) =>
        set((s) => patchActive(s, (r) => ({
          work: [...r.work, item],
        }))),
      removeWork: (index) =>
        set((s) => patchActive(s, (r) => ({
          work: r.work.filter((_, i) => i !== index),
        }))),
      updateWork: (index, item) =>
        set((s) => patchActive(s, (r) => ({
          work: r.work.map((w, i) => (i === index ? item : w)),
        }))),

      updateSkillsText: (text) =>
        set((s) => patchActive(s, () => ({ skills_text: text }))),

      setProjects: (projects) =>
        set((s) => patchActive(s, () => ({ projects }))),
      addProject: (item) =>
        set((s) => patchActive(s, (r) => ({
          projects: [...r.projects, item],
        }))),
      removeProject: (index) =>
        set((s) => patchActive(s, (r) => ({
          projects: r.projects.filter((_, i) => i !== index),
        }))),
      updateProject: (index, item) =>
        set((s) => patchActive(s, (r) => ({
          projects: r.projects.map((p, i) => (i === index ? item : p)),
        }))),

      // ── Awards ──
      setAwards: (awards) =>
        set((s) => patchActive(s, () => ({ awards }))),
      addAward: (item) =>
        set((s) => patchActive(s, (r) => ({ awards: [...r.awards, item] }))),
      removeAward: (index) =>
        set((s) => patchActive(s, (r) => ({ awards: r.awards.filter((_, i) => i !== index) }))),
      updateAward: (index, item) =>
        set((s) => patchActive(s, (r) => ({ awards: r.awards.map((a, i) => (i === index ? item : a)) }))),

      // ── Languages ──
      setLanguages: (languages) =>
        set((s) => patchActive(s, () => ({ languages }))),
      addLanguage: (item) =>
        set((s) => patchActive(s, (r) => ({ languages: [...r.languages, item] }))),
      removeLanguage: (index) =>
        set((s) => patchActive(s, (r) => ({ languages: r.languages.filter((_, i) => i !== index) }))),
      updateLanguage: (index, item) =>
        set((s) => patchActive(s, (r) => ({ languages: r.languages.map((l, i) => (i === index ? item : l)) }))),

      // ── Interests ──
      setInterests: (interests) =>
        set((s) => patchActive(s, () => ({ interests }))),
      addInterest: (item) =>
        set((s) => patchActive(s, (r) => ({ interests: [...r.interests, item] }))),
      removeInterest: (index) =>
        set((s) => patchActive(s, (r) => ({ interests: r.interests.filter((_, i) => i !== index) }))),
      updateInterest: (index, item) =>
        set((s) => patchActive(s, (r) => ({ interests: r.interests.map((it, i) => (i === index ? item : it)) }))),

      // ── Custom Sections ──
      addCustomSection: (title) => {
        const id = crypto.randomUUID();
        const section: CustomSection = { id, title, items: [] };
        set((s) => patchActive(s, (r) => ({
          custom_sections: [...r.custom_sections, section],
          section_order: [...(r.section_order ?? DEFAULT_SECTION_ORDER), `custom_${id}` as SectionKey],
          section_visibility: {
            ...(r.section_visibility ?? DEFAULT_SECTION_VISIBILITY),
            [`custom_${id}`]: true,
          } as SectionVisibility,
        })));
        return id;
      },
      removeCustomSection: (id) =>
        set((s) => patchActive(s, (r) => {
          const customKey = `custom_${id}`;
          const newVisibility = { ...(r.section_visibility ?? DEFAULT_SECTION_VISIBILITY) };
          delete (newVisibility as Record<string, boolean>)[customKey];
          return {
            custom_sections: r.custom_sections.filter((cs) => cs.id !== id),
            section_order: (r.section_order ?? DEFAULT_SECTION_ORDER).filter((k) => k !== customKey),
            section_visibility: newVisibility,
          };
        })),
      updateCustomSectionTitle: (id, title) =>
        set((s) => patchActive(s, (r) => ({
          custom_sections: r.custom_sections.map((cs) =>
            cs.id === id ? { ...cs, title } : cs,
          ),
        }))),
      addCustomSectionItem: (sectionId, item) =>
        set((s) => patchActive(s, (r) => ({
          custom_sections: r.custom_sections.map((cs) =>
            cs.id === sectionId ? { ...cs, items: [...cs.items, item] } : cs,
          ),
        }))),
      removeCustomSectionItem: (sectionId, itemIndex) =>
        set((s) => patchActive(s, (r) => ({
          custom_sections: r.custom_sections.map((cs) =>
            cs.id === sectionId
              ? { ...cs, items: cs.items.filter((_, i) => i !== itemIndex) }
              : cs,
          ),
        }))),
      updateCustomSectionItem: (sectionId, itemIndex, item) =>
        set((s) => patchActive(s, (r) => ({
          custom_sections: r.custom_sections.map((cs) =>
            cs.id === sectionId
              ? { ...cs, items: cs.items.map((it, i) => (i === itemIndex ? item : it)) }
              : cs,
          ),
        }))),

      updateStyleConfig: (config) =>
        set((s) => patchActive(s, (r) => ({
          style_config: { ...r.style_config, ...config },
        }))),

      setTemplateId: (id) =>
        set((s) => patchActive(s, () => ({ template_id: id }))),

      setTitle: (title) =>
        set((s) => patchActive(s, () => ({ title }))),

      toggleSectionVisibility: (section) =>
        set((s) => patchActive(s, (r) => ({
          section_visibility: {
            ...(r.section_visibility ?? DEFAULT_SECTION_VISIBILITY),
            [section]: !(r.section_visibility ?? DEFAULT_SECTION_VISIBILITY)[section],
          },
        }))),

      setSectionVisibility: (visibility) =>
        set((s) => patchActive(s, (r) => ({
          section_visibility: {
            ...(r.section_visibility ?? DEFAULT_SECTION_VISIBILITY),
            ...visibility,
          },
        }))),

      reorderSections: (fromIndex, toIndex) =>
        set((s) => patchActive(s, (r) => {
          const order = [...(r.section_order ?? DEFAULT_SECTION_ORDER)];
          const [moved] = order.splice(fromIndex, 1);
          order.splice(toIndex, 0, moved);
          return { section_order: order };
        })),

      // ── Import/Export ──
      importResume: (data) => {
        const base = createEmptyResume();
        const merged: ResumeData = {
          ...base,
          ...data,
          id: crypto.randomUUID(),
          sort_order: get().resumes.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          versions: [],
        };
        set((s) => ({
          resumes: [...s.resumes, merged],
          activeResumeId: merged.id,
        }));
        return merged.id;
      },

      setResume: (data) => {
        const id = get().importResume(data);
        set({ activeResumeId: id });
      },
    }),
    {
      name: 'hx-resume-data',
      version: 7,
      partialize: (state) => ({
        resumes: state.resumes,
        activeResumeId: state.activeResumeId,
      }),
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { resumes?: ResumeData[]; activeResumeId?: string | null };
        if (version < 3 && state.resumes) {
          // Add missing section_visibility and section_order to old resumes
          state.resumes = state.resumes.map((r) => ({
            ...r,
            section_visibility: r.section_visibility ?? { ...DEFAULT_SECTION_VISIBILITY },
            section_order: r.section_order ?? [...DEFAULT_SECTION_ORDER],
          }));
        }
        if (version < 4 && state.resumes) {
          // Migrate to v4: skills array → skills_text, work summary+highlights → description, education.description
          state.resumes = state.resumes.map((r: Record<string, unknown>) => {
            // Migrate skills
            const oldSkills = r.skills as Array<{ name?: string; level?: string; keywords?: string[] }> | undefined;
            if (oldSkills && Array.isArray(oldSkills) && !r.skills_text) {
              const lines = oldSkills.map((s) => {
                const kw = s.keywords?.length ? `: ${s.keywords.join(', ')}` : '';
                const lv = s.level ? ` (${s.level})` : '';
                return `- **${s.name || ''}**${lv}${kw}`;
              });
              (r as Record<string, unknown>).skills_text = lines.join('\n');
            }
            if (!r.skills_text) (r as Record<string, unknown>).skills_text = '';
            delete (r as Record<string, unknown>).skills;

            // Migrate work items
            const workItems = r.work as Array<Record<string, unknown>> | undefined;
            if (workItems && Array.isArray(workItems)) {
              (r as Record<string, unknown>).work = workItems.map((w) => {
                if (!w.description && (w.summary || (w.highlights as string[] | undefined)?.length)) {
                  const parts: string[] = [];
                  if (w.summary) parts.push(String(w.summary));
                  const hl = w.highlights as string[] | undefined;
                  if (hl?.length) {
                    parts.push(hl.map((h) => `- ${h}`).join('\n'));
                  }
                  w.description = parts.join('\n\n');
                }
                if (!w.department) w.department = '';
                delete w.summary;
                delete w.highlights;
                return w;
              });
            }

            // Migrate education items
            const eduItems = r.education as Array<Record<string, unknown>> | undefined;
            if (eduItems && Array.isArray(eduItems)) {
              (r as Record<string, unknown>).education = eduItems.map((e) => {
                if (e.description === undefined) e.description = '';
                return e;
              });
            }

            return r as unknown as ResumeData;
          });
        }
        if (version < 5 && state.resumes) {
          // Migrate to v5: add logo field to work items
          state.resumes = state.resumes.map((r) => ({
            ...r,
            work: (r.work || []).map((w: Record<string, unknown>) => ({
              ...w,
              logo: w.logo ?? '',
            })),
          }));
        }
        if (version < 6 && state.resumes) {
          // Migrate to v6: add custom_css to style_config
          state.resumes = state.resumes.map((r) => ({
            ...r,
            style_config: {
              ...r.style_config,
              custom_css: (r.style_config as Record<string, unknown>).custom_css ?? '',
            },
          }));
        }
        if (version < 7 && state.resumes) {
          // Migrate to v7: remove accent_color from style_config
          state.resumes = state.resumes.map((r) => {
            const sc = { ...r.style_config } as Record<string, unknown>;
            delete sc.accent_color;
            return { ...r, style_config: sc as ResumeData['style_config'] };
          });
        }
        return state;
      },
    },
  ),
);
