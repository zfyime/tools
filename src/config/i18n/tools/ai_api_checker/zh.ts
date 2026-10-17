export const aiApiCheckerZh = {
  title: 'AI API 可用性检测',
  description: '检测 OpenAI、Claude、Gemini 兼容接口的连通性，并获取可用模型',

  // 协议选择
  protocol: '接口协议',
  protocol_openai_chat: 'OpenAI Chat Completions',
  protocol_openai_responses: 'OpenAI Responses',
  protocol_anthropic: 'Claude Messages',
  protocol_gemini: 'Gemini generateContent',

  // 接口配置
  base_url: 'Base URL',
  base_url_placeholder: '例如 https://api.openai.com/v1',
  base_url_hint: '支持官方地址或兼容中转站地址；未填写路径时会自动补全版本前缀',
  api_key: 'API Key',
  api_key_placeholder: '输入 API Key',
  show_key: '显示',
  hide_key: '隐藏',
  model: '模型',
  model_placeholder: '输入模型名称，或点击「获取模型」',
  fetch_models: '获取模型',
  fetching_models: '获取中...',
  models_empty: '接口未返回可用模型',
  models_failed: '获取模型失败',
  models_hint: '点击模型名称可直接填入',

  // 测试选项
  advanced: '测试选项',
  test_prompt: '测试提示词',
  test_prompt_placeholder: '发送给模型的测试内容',
  test_prompt_hint: '默认提示词仅让模型回复 OK，消耗的 token 极少',
  test_connection: '开始检测',
  testing: '检测中...',
  clear: '清空',

  // 结果
  result: '检测结果',
  success: '可用',
  failed: '不可用',
  http_status: 'HTTP 状态',
  latency: '耗时',
  request_url: '请求地址',
  response_content: '模型回复',
  error_message: '错误信息',
  raw_response: '原始响应',
  copy: '复制',
  copied: '已复制',
  no_result: '尚未执行检测',
  empty_response: '（响应中没有文本内容）',

  // 提示
  privacy_note: 'API Key 仅用于本次检测转发，服务端不会记录或保存。',
  enter_base_url: '请输入 Base URL',
  enter_api_key: '请输入 API Key',
  enter_model: '请先填写模型或获取模型列表',
  network_error: '请求失败',
  models_count: '共 {count} 个模型',
};

export default aiApiCheckerZh;
