import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PublicResumeConfig,
  RedactItem,
  RedactStyle,
} from '../types/resume';
import { DEFAULT_PUBLIC_RESUME_CONFIG } from '../types/resume';

let _nextId = 1;
function genId() {
  return `redact_${Date.now()}_${_nextId++}`;
}

/** 历史栈最大深度 */
const MAX_HISTORY = 50;

interface PublicResumeStore {
  config: PublicResumeConfig;

  /** 每个简历的打码配置缓存（用于同步到后端） */
  _configMap: Record<string, PublicResumeConfig>;

  /** undo/redo 历史 */
  _history: RedactItem[][];
  _future: RedactItem[][];

  setEnabled: (enabled: boolean) => void;

  /** 添加一条打码记录 */
  addRedactItem: (originalText: string, style?: RedactStyle) => void;
  /** 移除一条打码记录 */
  removeRedactItem: (id: string) => void;
  /** 更新打码记录的样式 */
  updateRedactItem: (id: string, patch: Partial<RedactItem>) => void;

  /** 设置全局默认样式 */
  setDefaultStyle: (style: RedactStyle) => void;
  setDefaultSolidColor: (color: string) => void;

  /** 撤回 / 反撤回 */
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  /** 重置 */
  reset: () => void;

  /** 切换当前活跃的简历 ID —— 保存当前 config 到 map，加载目标 config */
  switchResume: (resumeId: string) => void;
  /** 将当前 config 保存到 map 中（用于同步前调用） */
  saveCurrentToMap: (resumeId: string) => void;
  /** 获取指定简历的配置（用于同步） */
  getConfigForResume: (resumeId: string) => PublicResumeConfig | null;
  /** 获取所有简历的配置 map（用于批量同步） */
  getConfigMap: () => Record<string, PublicResumeConfig>;
  /** 从后端数据加载配置（合并，后端数据不覆盖本地已有） */
  loadFromBackend: (resumeId: string, config: PublicResumeConfig) => void;
}

/** 向历史栈推入当前状态，清空 future */
function pushHistory(state: PublicResumeStore) {
  const history = [...state._history, [...state.config.redactedItems]];
  if (history.length > MAX_HISTORY) history.shift();
  return { _history: history, _future: [] as RedactItem[][] };
}

export const usePublicResumeStore = create<PublicResumeStore>()(
  persist(
    (set, get) => ({
      config: { ...DEFAULT_PUBLIC_RESUME_CONFIG },
      _configMap: {},
      _history: [],
      _future: [],

      setEnabled: (enabled) =>
        set((s) => ({ config: { ...s.config, enabled } })),

      addRedactItem: (originalText, style) =>
        set((s) => {
          // 避免重复添加相同文本
          if (s.config.redactedItems.some((item) => item.originalText === originalText)) return s;
          const hist = pushHistory(s);
          const newItem: RedactItem = {
            id: genId(),
            originalText,
            style: style ?? s.config.defaultStyle,
            solidColor: s.config.defaultSolidColor,
            replacement: '',
          };
          return {
            ...hist,
            config: {
              ...s.config,
              redactedItems: [...s.config.redactedItems, newItem],
            },
          };
        }),

      removeRedactItem: (id) =>
        set((s) => {
          const hist = pushHistory(s);
          return {
            ...hist,
            config: {
              ...s.config,
              redactedItems: s.config.redactedItems.filter((item) => item.id !== id),
            },
          };
        }),

      updateRedactItem: (id, patch) =>
        set((s) => {
          const hist = pushHistory(s);
          return {
            ...hist,
            config: {
              ...s.config,
              redactedItems: s.config.redactedItems.map((item) =>
                item.id === id ? { ...item, ...patch } : item,
              ),
            },
          };
        }),

      setDefaultStyle: (style) =>
        set((s) => ({ config: { ...s.config, defaultStyle: style } })),
      setDefaultSolidColor: (color) =>
        set((s) => ({ config: { ...s.config, defaultSolidColor: color } })),

      undo: () =>
        set((s) => {
          if (s._history.length === 0) return s;
          const history = [...s._history];
          const prev = history.pop()!;
          return {
            _history: history,
            _future: [...s._future, [...s.config.redactedItems]],
            config: { ...s.config, redactedItems: prev },
          };
        }),

      redo: () =>
        set((s) => {
          if (s._future.length === 0) return s;
          const future = [...s._future];
          const next = future.pop()!;
          return {
            _history: [...s._history, [...s.config.redactedItems]],
            _future: future,
            config: { ...s.config, redactedItems: next },
          };
        }),

      canUndo: () => get()._history.length > 0,
      canRedo: () => get()._future.length > 0,

      reset: () =>
        set((s) => {
          const hist = pushHistory(s);
          return {
            ...hist,
            config: { ...DEFAULT_PUBLIC_RESUME_CONFIG, enabled: s.config.enabled },
          };
        }),

      switchResume: (resumeId) =>
        set((s) => {
          // 从 map 中加载目标简历的配置
          const saved = s._configMap[resumeId];
          return {
            config: saved ? { ...saved } : { ...DEFAULT_PUBLIC_RESUME_CONFIG },
            _history: [],
            _future: [],
          };
        }),

      saveCurrentToMap: (resumeId) =>
        set((s) => ({
          _configMap: {
            ...s._configMap,
            [resumeId]: { ...s.config },
          },
        })),

      getConfigForResume: (resumeId) => {
        return get()._configMap[resumeId] ?? null;
      },

      getConfigMap: () => get()._configMap,

      loadFromBackend: (resumeId, config) =>
        set((s) => {
          // 如果本地已有该简历的配置且有打码项，保留本地版本（本地优先）
          const existing = s._configMap[resumeId];
          if (existing && existing.redactedItems.length > 0) {
            return s;
          }
          return {
            _configMap: {
              ...s._configMap,
              [resumeId]: { ...config },
            },
          };
        }),
    }),
    {
      name: 'hx-resume-public-config',
      version: 1,
      partialize: (state) => ({
        config: state.config,
        _configMap: state._configMap,
      }),
    },
  ),
);
