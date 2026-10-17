export const aiApiCheckerEn = {
  title: 'AI API Availability Checker',
  description: 'Check connectivity of OpenAI, Claude and Gemini compatible APIs and list available models',

  // Protocol selection
  protocol: 'Protocol',
  protocol_openai_chat: 'OpenAI Chat Completions',
  protocol_openai_responses: 'OpenAI Responses',
  protocol_anthropic: 'Claude Messages',
  protocol_gemini: 'Gemini generateContent',

  // API configuration
  base_url: 'Base URL',
  base_url_placeholder: 'e.g. https://api.openai.com/v1',
  base_url_hint: 'Official or compatible proxy endpoints are supported; the version prefix is added automatically when the path is empty',
  api_key: 'API Key',
  api_key_placeholder: 'Enter API key',
  show_key: 'Show',
  hide_key: 'Hide',
  model: 'Model',
  model_placeholder: 'Enter a model name, or click "Fetch Models"',
  fetch_models: 'Fetch Models',
  fetching_models: 'Fetching...',
  models_empty: 'No available models returned',
  models_failed: 'Failed to fetch models',
  models_hint: 'Click a model name to fill it in',

  // Test options
  advanced: 'Test Options',
  test_prompt: 'Test Prompt',
  test_prompt_placeholder: 'Content sent to the model',
  test_prompt_hint: 'The default prompt only asks the model to reply OK, consuming minimal tokens',
  test_connection: 'Run Check',
  testing: 'Checking...',
  clear: 'Clear',

  // Result
  result: 'Result',
  success: 'Available',
  failed: 'Unavailable',
  http_status: 'HTTP Status',
  latency: 'Latency',
  request_url: 'Request URL',
  response_content: 'Model Reply',
  error_message: 'Error',
  raw_response: 'Raw Response',
  copy: 'Copy',
  copied: 'Copied',
  no_result: 'No check has been run yet',
  empty_response: '(No text content in response)',

  // Hints
  privacy_note: 'The API key is only forwarded for this check; it is never logged or stored by the server.',
  enter_base_url: 'Please enter a Base URL',
  enter_api_key: 'Please enter an API key',
  enter_model: 'Please enter a model or fetch the model list first',
  network_error: 'Request failed',
  models_count: '{count} models',
};

export default aiApiCheckerEn;
