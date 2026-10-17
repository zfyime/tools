'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faCopy,
  faEye,
  faEyeSlash,
  faList,
  faPlay,
  faRobot,
  faSpinner,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import ToolHeader from '@/components/ToolHeader';
import { useLanguage } from '@/context/LanguageContext';
import { apiClient } from '@/lib/api-client';

type Protocol = 'openai_chat' | 'openai_responses' | 'anthropic' | 'gemini';

const PROTOCOLS: Protocol[] = ['openai_chat', 'openai_responses', 'anthropic', 'gemini'];

const DEFAULT_BASE: Record<Protocol, string> = {
  openai_chat: 'https://api.openai.com/v1',
  openai_responses: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
};

const DEFAULT_PROMPT = 'Reply with exactly: OK';

const PREF_STORAGE_KEY = 'ai_api_checker_prefs';

const styles = {
  card: 'card p-6',
  input: 'search-input w-full',
  label: 'block mb-1.5 text-sm text-[rgb(var(--color-text-secondary))]',
  hint: 'text-xs mt-1.5 text-[rgb(var(--color-text-tertiary))]',
  btn: 'btn-secondary text-sm px-3 py-2',
  primaryBtn: 'btn-primary text-sm px-4 py-2',
  section: 'mb-6',
  chip: 'px-2.5 py-1 rounded-md border border-[var(--color-border)] text-xs text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-bg-secondary))] transition-colors',
  metaLabel: 'text-xs text-[rgb(var(--color-text-tertiary))]',
  metaValue: 'text-sm font-medium text-[rgb(var(--color-text-primary))] mt-0.5',
};

interface ProxyResponse {
  status?: number;
  statusText?: string;
  time?: number;
  headers?: Record<string, string>;
  data?: unknown;
  error?: string;
}

interface CheckResult {
  success: boolean;
  status: number;
  statusText: string;
  time: number;
  url: string;
  content: string;
  error: string;
  raw: unknown;
}

/**
 * 规范化 Base URL：补全协议头与版本路径
 */
function normalizeBase(base: string, protocol: Protocol): string {
  let value = base.trim();
  if (!value) return '';
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  value = value.replace(/\/+$/, '');

  try {
    const url = new URL(value);
    if (url.pathname === '' || url.pathname === '/') {
      url.pathname = protocol === 'gemini' ? '/v1beta' : '/v1';
      return url.toString().replace(/\/+$/, '');
    }
  } catch {
    return value;
  }

  return value;
}

function chatUrl(base: string, protocol: Protocol, model: string): string {
  const normalized = normalizeBase(base, protocol);
  if (protocol === 'gemini') {
    const suffix = `/models/${encodeURIComponent(model)}:generateContent`;
    return normalized.endsWith(suffix) ? normalized : `${normalized}${suffix}`;
  }
  const suffix =
    protocol === 'openai_chat'
      ? '/chat/completions'
      : protocol === 'openai_responses'
        ? '/responses'
        : '/messages';
  return normalized.endsWith(suffix) ? normalized : `${normalized}${suffix}`;
}

function modelsUrl(base: string, protocol: Protocol): string {
  const normalized = normalizeBase(base, protocol);
  if (normalized.endsWith('/models')) return normalized;
  if (protocol === 'gemini') return `${normalized}/models?pageSize=1000`;
  if (protocol === 'anthropic') return `${normalized}/models?limit=1000`;
  return `${normalized}/models`;
}

function buildHeaders(protocol: Protocol, apiKey: string): Record<string, string> {
  if (protocol === 'anthropic') {
    return {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    };
  }
  if (protocol === 'gemini') {
    return {
      'x-goog-api-key': apiKey,
      'content-type': 'application/json',
    };
  }
  return {
    authorization: `Bearer ${apiKey}`,
    'content-type': 'application/json',
  };
}

function buildBody(protocol: Protocol, model: string, prompt: string): unknown {
  if (protocol === 'openai_chat') {
    return { model, messages: [{ role: 'user', content: prompt }], stream: false };
  }
  if (protocol === 'openai_responses') {
    return { model, input: prompt, stream: false };
  }
  if (protocol === 'anthropic') {
    return { model, max_tokens: 64, messages: [{ role: 'user', content: prompt }] };
  }
  return {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 64 },
  };
}

/**
 * 从各协议的响应结构中提取模型回复文本
 */
function extractContent(protocol: Protocol, data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const payload = data as Record<string, unknown>;

  try {
    if (protocol === 'openai_chat') {
      const choices = payload.choices as
        | Array<{ message?: { content?: unknown; reasoning_content?: unknown } }>
        | undefined;
      const message = choices?.[0]?.message;
      if (typeof message?.content === 'string') return message.content;
      if (typeof message?.reasoning_content === 'string') return message.reasoning_content;
      return '';
    }

    if (protocol === 'openai_responses') {
      if (typeof payload.output_text === 'string') return payload.output_text;
      const output = payload.output as
        | Array<{ content?: Array<{ text?: unknown }> }>
        | undefined;
      if (!output) return '';
      return output
        .flatMap((item) => item.content || [])
        .map((part) => (typeof part.text === 'string' ? part.text : ''))
        .join('');
    }

    if (protocol === 'anthropic') {
      const content = payload.content as Array<{ text?: unknown }> | undefined;
      return (content || [])
        .map((part) => (typeof part.text === 'string' ? part.text : ''))
        .join('');
    }

    if (protocol === 'gemini') {
      const candidates = payload.candidates as
        | Array<{ content?: { parts?: Array<{ text?: unknown }> } }>
        | undefined;
      const parts = candidates?.[0]?.content?.parts || [];
      return parts.map((part) => (typeof part.text === 'string' ? part.text : '')).join('');
    }
  } catch {
    return '';
  }

  return '';
}

/**
 * 提取错误信息
 */
function extractError(data: unknown): string {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    const payload = data as Record<string, unknown>;
    const error = payload.error;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object') {
      const detail = error as Record<string, unknown>;
      if (typeof detail.message === 'string') return detail.message;
      if (typeof detail.type === 'string') return detail.type;
    }
    if (typeof payload.message === 'string') return payload.message;
  }

  try {
    return JSON.stringify(data) || '';
  } catch {
    return String(data);
  }
}

/**
 * 解析模型列表
 */
function parseModels(protocol: Protocol, data: unknown): string[] {
  if (Array.isArray(data)) {
    return Array.from(
      new Set(
        data
          .map((item) =>
            item && typeof item === 'object'
              ? ((item as Record<string, unknown>).id as string) ||
                ((item as Record<string, unknown>).name as string)
              : ''
          )
          .filter(Boolean)
          .map((name) => (name as string).replace(/^models\//, ''))
      )
    )
      .filter(Boolean)
      .sort();
  }

  if (!data || typeof data !== 'object') return [];
  const payload = data as Record<string, unknown>;

  if (protocol === 'gemini') {
    const models = payload.models as
      | Array<{ name?: string; supportedGenerationMethods?: string[] }>
      | undefined;
    return (models || [])
      .filter(
        (model) =>
          !model.supportedGenerationMethods ||
          model.supportedGenerationMethods.includes('generateContent')
      )
      .map((model) => (model.name || '').replace(/^models\//, ''))
      .filter(Boolean)
      .sort();
  }

  const models = payload.data as Array<{ id?: string }> | undefined;
  return Array.from(new Set((models || []).map((model) => model.id || '').filter(Boolean))).sort();
}

export default function AiApiChecker() {
  const { t } = useLanguage();

  const [protocol, setProtocol] = useState<Protocol>('openai_chat');
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE.openai_chat);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [showKey, setShowKey] = useState(false);

  const [models, setModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState('');

  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [formError, setFormError] = useState('');
  const [copied, setCopied] = useState(false);

  const [prefsReady, setPrefsReady] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 恢复上次使用的协议、地址和模型（不保存 API Key）
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PREF_STORAGE_KEY);
      if (saved) {
        const prefs = JSON.parse(saved) as {
          protocol?: Protocol;
          baseUrl?: string;
          model?: string;
        };
        if (prefs.protocol && PROTOCOLS.includes(prefs.protocol)) {
          setProtocol(prefs.protocol);
        }
        if (typeof prefs.baseUrl === 'string' && prefs.baseUrl.trim()) {
          setBaseUrl(prefs.baseUrl);
        }
        if (typeof prefs.model === 'string') {
          setModel(prefs.model);
        }
      }
    } catch {
      // 忽略本地存储解析失败
    }
    setPrefsReady(true);
  }, []);

  useEffect(() => {
    if (!prefsReady) return;
    try {
      localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify({ protocol, baseUrl, model }));
    } catch {
      // 忽略本地存储写入失败
    }
  }, [prefsReady, protocol, baseUrl, model]);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const handleProtocolChange = (next: Protocol) => {
    if (next === protocol) return;

    setProtocol(next);
    // 用户没有自定义地址时，跟随协议切换默认地址
    if (!baseUrl.trim() || baseUrl.trim().replace(/\/+$/, '') === DEFAULT_BASE[protocol]) {
      setBaseUrl(DEFAULT_BASE[next]);
    }
    setModels([]);
    setModelsError('');
    setResult(null);
    setFormError('');
  };

  const validateBase = (): string | null => {
    const normalized = normalizeBase(baseUrl, protocol);
    if (!normalized) {
      setFormError(t('tools.ai_api_checker.enter_base_url'));
      return null;
    }
    return normalized;
  };

  const handleFetchModels = async () => {
    setFormError('');
    setModelsError('');
    setModels([]);

    if (!validateBase()) return;
    if (!apiKey.trim()) {
      setFormError(t('tools.ai_api_checker.enter_api_key'));
      return;
    }

    setModelsLoading(true);
    try {
      const response = await apiClient.post<ProxyResponse>('/api/ai-check', {
        url: modelsUrl(baseUrl, protocol),
        method: 'GET',
        headers: buildHeaders(protocol, apiKey.trim()),
      });

      const status = response.status ?? 0;
      if (status < 200 || status >= 300) {
        setModelsError(
          extractError(response.data) || `${t('tools.ai_api_checker.models_failed')} (${status})`
        );
        return;
      }

      const list = parseModels(protocol, response.data);
      if (list.length === 0) {
        setModelsError(t('tools.ai_api_checker.models_empty'));
        return;
      }

      setModels(list);
      setModelsError('');
    } catch (error) {
      setModelsError(error instanceof Error ? error.message : t('tools.ai_api_checker.models_failed'));
    } finally {
      setModelsLoading(false);
    }
  };

  const handleCheck = async () => {
    setFormError('');
    setResult(null);

    if (!validateBase()) return;
    if (!apiKey.trim()) {
      setFormError(t('tools.ai_api_checker.enter_api_key'));
      return;
    }
    if (!model.trim()) {
      setFormError(t('tools.ai_api_checker.enter_model'));
      return;
    }

    const url = chatUrl(baseUrl, protocol, model.trim());
    const testPrompt = prompt.trim() || DEFAULT_PROMPT;

    setTesting(true);
    try {
      const response = await apiClient.post<ProxyResponse>('/api/ai-check', {
        url,
        method: 'POST',
        headers: buildHeaders(protocol, apiKey.trim()),
        body: buildBody(protocol, model.trim(), testPrompt),
      });

      const status = response.status ?? 0;
      const success = status >= 200 && status < 300;

      setResult({
        success,
        status,
        statusText: response.statusText || '',
        time: response.time || 0,
        url,
        content: success ? extractContent(protocol, response.data) : '',
        error: success ? '' : extractError(response.data),
        raw: response.data,
      });
    } catch (error) {
      setResult({
        success: false,
        status: 0,
        statusText: '',
        time: 0,
        url,
        content: '',
        error: error instanceof Error ? error.message : t('tools.ai_api_checker.network_error'),
        raw: null,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.content) return;
    try {
      await navigator.clipboard.writeText(result.content);
      setCopied(true);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // 忽略剪贴板失败
    }
  };

  const handleClear = () => {
    setResult(null);
    setModels([]);
    setModelsError('');
    setFormError('');
    setPrompt(DEFAULT_PROMPT);
  };

  const rawText = (() => {
    if (result === null) return '';
    if (typeof result.raw === 'string') return result.raw;
    try {
      return JSON.stringify(result.raw, null, 2) || String(result.raw);
    } catch {
      return String(result.raw);
    }
  })();

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <ToolHeader
        toolCode="ai_api_checker"
        icon={faRobot}
        title={t('tools.ai_api_checker.title')}
        description={t('tools.ai_api_checker.description')}
      />

      <div className={styles.section}>
        <div className={styles.card}>
          {/* 协议选择 */}
          <div className="mb-5">
            <label className={styles.label}>{t('tools.ai_api_checker.protocol')}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PROTOCOLS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleProtocolChange(item)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                    protocol === item
                      ? 'border-[rgb(var(--color-primary))] bg-[rgba(var(--color-primary),0.06)] text-[rgb(var(--color-text-primary))]'
                      : 'border-[var(--color-border)] text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-bg-secondary))]'
                  }`}
                >
                  {t(`tools.ai_api_checker.protocol_${item}`)}
                </button>
              ))}
            </div>
          </div>

          {/* 地址与密钥 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={styles.label}>{t('tools.ai_api_checker.base_url')}</label>
              <input
                className={styles.input}
                type="text"
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder={t('tools.ai_api_checker.base_url_placeholder')}
                spellCheck={false}
              />
              <div className={styles.hint}>{t('tools.ai_api_checker.base_url_hint')}</div>
            </div>

            <div>
              <label className={styles.label}>{t('tools.ai_api_checker.api_key')}</label>
              <div className="relative">
                <input
                  className={`${styles.input} pr-16`}
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder={t('tools.ai_api_checker.api_key_placeholder')}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setShowKey((value) => !value)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded text-[rgb(var(--color-text-tertiary))] hover:text-[rgb(var(--color-text-primary))]"
                >
                  <FontAwesomeIcon icon={showKey ? faEyeSlash : faEye} className="mr-1" />
                  {showKey
                    ? t('tools.ai_api_checker.hide_key')
                    : t('tools.ai_api_checker.show_key')}
                </button>
              </div>
              <div className={styles.hint}>{t('tools.ai_api_checker.privacy_note')}</div>
            </div>
          </div>

          {/* 模型 */}
          <div className="mt-4">
            <label className={styles.label}>{t('tools.ai_api_checker.model')}</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                className={styles.input}
                type="text"
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder={t('tools.ai_api_checker.model_placeholder')}
                spellCheck={false}
              />
              <button
                type="button"
                className={`${styles.btn} whitespace-nowrap flex items-center justify-center gap-2`}
                onClick={handleFetchModels}
                disabled={modelsLoading}
              >
                <FontAwesomeIcon
                  icon={modelsLoading ? faSpinner : faList}
                  className={modelsLoading ? 'animate-spin' : ''}
                />
                {modelsLoading
                  ? t('tools.ai_api_checker.fetching_models')
                  : t('tools.ai_api_checker.fetch_models')}
              </button>
            </div>

            {modelsError && (
              <div className="text-xs mt-2 text-[rgb(var(--color-error))] break-all">{modelsError}</div>
            )}

            {models.length > 0 && (
              <div className="mt-3">
                <div className={styles.hint + ' mb-2'}>
                  {t('tools.ai_api_checker.models_count').replace('{count}', String(models.length))}
                  {' · '}
                  {t('tools.ai_api_checker.models_hint')}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto p-1">
                  {models.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`${styles.chip} ${
                        model === item
                          ? 'border-[rgb(var(--color-primary))] text-[rgb(var(--color-text-primary))]'
                          : ''
                      }`}
                      onClick={() => setModel(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 测试选项 */}
          <div className="mt-5 pt-5 border-t border-[var(--color-border)]">
            <label className={styles.label}>{t('tools.ai_api_checker.test_prompt')}</label>
            <input
              className={styles.input}
              type="text"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={t('tools.ai_api_checker.test_prompt_placeholder')}
            />
            <div className={styles.hint}>{t('tools.ai_api_checker.test_prompt_hint')}</div>
          </div>

          {formError && (
            <div className="text-sm mt-4 text-[rgb(var(--color-error))]">{formError}</div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              className={`${styles.primaryBtn} flex items-center gap-2`}
              onClick={handleCheck}
              disabled={testing}
            >
              <FontAwesomeIcon icon={testing ? faSpinner : faPlay} className={testing ? 'animate-spin' : ''} />
              {testing ? t('tools.ai_api_checker.testing') : t('tools.ai_api_checker.test_connection')}
            </button>
            <button
              type="button"
              className={`${styles.btn} flex items-center gap-2`}
              onClick={handleClear}
              disabled={testing}
            >
              <FontAwesomeIcon icon={faTrash} />
              {t('tools.ai_api_checker.clear')}
            </button>
          </div>
        </div>
      </div>

      {/* 检测结果 */}
      <div className={styles.section}>
        <div className={styles.card}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">{t('tools.ai_api_checker.result')}</h2>
            {result && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs border ${
                  result.success
                    ? 'border-[rgba(var(--color-success),0.4)] text-[rgb(var(--color-success))]'
                    : 'border-[rgba(var(--color-error),0.4)] text-[rgb(var(--color-error))]'
                }`}
              >
                {result.success
                  ? t('tools.ai_api_checker.success')
                  : t('tools.ai_api_checker.failed')}
              </span>
            )}
          </div>

          {!result && (
            <div className="text-sm text-[rgb(var(--color-text-tertiary))]">
              {t('tools.ai_api_checker.no_result')}
            </div>
          )}

          {result && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className={styles.metaLabel}>{t('tools.ai_api_checker.http_status')}</div>
                  <div className={styles.metaValue}>
                    {result.status || '-'}
                    {result.statusText ? ` ${result.statusText}` : ''}
                  </div>
                </div>
                <div>
                  <div className={styles.metaLabel}>{t('tools.ai_api_checker.latency')}</div>
                  <div className={styles.metaValue}>{result.time ? `${result.time} ms` : '-'}</div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <div className={styles.metaLabel}>{t('tools.ai_api_checker.request_url')}</div>
                  <div className="text-xs mt-1 break-all text-[rgb(var(--color-text-secondary))]">
                    {result.url}
                  </div>
                </div>
              </div>

              {result.success ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={styles.label + ' mb-0'}>
                      {t('tools.ai_api_checker.response_content')}
                    </label>
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded text-[rgb(var(--color-text-tertiary))] hover:text-[rgb(var(--color-text-primary))]"
                      onClick={handleCopy}
                      disabled={!result.content}
                    >
                      <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="mr-1" />
                      {copied
                        ? t('tools.ai_api_checker.copied')
                        : t('tools.ai_api_checker.copy')}
                    </button>
                  </div>
                  <pre className="p-3 rounded-md border border-[var(--color-border)] bg-[rgb(var(--color-bg-secondary))] text-sm whitespace-pre-wrap break-all max-h-60 overflow-auto">
                    {result.content || t('tools.ai_api_checker.empty_response')}
                  </pre>
                </div>
              ) : (
                <div>
                  <div className={styles.label}>{t('tools.ai_api_checker.error_message')}</div>
                  <pre className="p-3 rounded-md border border-[rgba(var(--color-error),0.35)] text-sm text-[rgb(var(--color-error))] whitespace-pre-wrap break-all max-h-60 overflow-auto">
                    {result.error || '-'}
                  </pre>
                </div>
              )}

              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-[rgb(var(--color-text-secondary))] select-none">
                  {t('tools.ai_api_checker.raw_response')}
                </summary>
                <pre className="mt-2 p-3 rounded-md border border-[var(--color-border)] bg-[rgb(var(--color-bg-secondary))] text-xs whitespace-pre-wrap break-all max-h-80 overflow-auto">
                  {rawText || '-'}
                </pre>
              </details>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
