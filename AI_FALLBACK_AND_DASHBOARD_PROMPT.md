# PROMPT: Implement Multi-Provider AI Fallback System with Admin Dashboard

Use this prompt to add alternative AI providers and an admin dashboard to any AI-powered website.

---

## OBJECTIVE

Upgrade all AI-powered features in this project by implementing:

1. **Multi-Provider Fallback System** - Automatically switch between AI providers when one fails
2. **Admin AI Dashboard** - Management panel for administrators to control AI providers, view usage, and debug issues

---

## PROVIDER FALLBACK CHAIN

| Priority | Provider | Model | Type |
|----------|----------|-------|------|
| 1 | Google Gemini | `gemini-2.5-flash` | Primary |
| 2 | OpenRouter | `google/gemini-2.0-flash-001` | Free Fallback |
| 3 | Cloudflare Workers AI | `@cf/meta/llama-3.2-3b-instruct` | Free Fallback |
| 4 | OpenAI | `gpt-4o-mini` | Paid Fallback |

The system must allow reordering providers through the admin dashboard.

---

## REQUIRED ENVIRONMENT VARIABLES

```
GEMINI_API_KEY=your-gemini-key
OPENROUTER_API_KEY=your-openrouter-key
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_API_TOKEN=your-cloudflare-token
OPENAI_API_KEY=your-openai-key
```

---

## PART 1: MULTI-PROVIDER FALLBACK SYSTEM

### Step 1.1: Create Provider Interface

```typescript
interface AIProvider {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  apiKeyEnvVar: string;
  endpoint: string;
  model: string;
  limits: {
    requestsPerMinute: number;
    requestsPerDay: number;
    tokensPerMinute: number;
  };
  usage: {
    requestsToday: number;
    tokensToday: number;
    lastUsed: Date | null;
    lastError: string | null;
  };
  call: (prompt: string, maxTokens: number, temperature: number) => Promise<string>;
}

interface FallbackConfig {
  maxTokens: number;
  temperature: number;
  providers?: AIProvider[];
}

interface AILog {
  id: string;
  timestamp: Date;
  provider: string;
  function: string;
  status: 'success' | 'error' | 'fallback';
  duration: number;
  tokens: number;
  error?: string;
}
```

### Step 1.2: Create Provider Implementations

```typescript
const geminiProvider: AIProvider = {
  id: 'gemini',
  name: 'Google Gemini',
  enabled: true,
  priority: 1,
  apiKeyEnvVar: 'GEMINI_API_KEY',
  endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
  model: 'gemini-2.5-flash',
  limits: { requestsPerMinute: 15, requestsPerDay: 1500, tokensPerMinute: 1000000 },
  usage: { requestsToday: 0, tokensToday: 0, lastUsed: null, lastError: null },
  call: async (prompt, maxTokens, temp) => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: { maxOutputTokens: maxTokens, temperature: temp }
    });
    return response.text || '';
  }
};

const openRouterProvider: AIProvider = {
  id: 'openrouter',
  name: 'OpenRouter',
  enabled: true,
  priority: 2,
  apiKeyEnvVar: 'OPENROUTER_API_KEY',
  endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  model: 'google/gemini-2.0-flash-001',
  limits: { requestsPerMinute: 20, requestsPerDay: 50, tokensPerMinute: 100000 },
  usage: { requestsToday: 0, tokensToday: 0, lastUsed: null, lastError: null },
  call: async (prompt, maxTokens, temp) => {
    if (!process.env.OPENROUTER_API_KEY) throw new Error('No OpenRouter key');
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: temp
      })
    });
    if (!response.ok) throw new Error(`OpenRouter: ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
};

const cloudflareProvider: AIProvider = {
  id: 'cloudflare',
  name: 'Cloudflare Workers AI',
  enabled: true,
  priority: 3,
  apiKeyEnvVar: 'CLOUDFLARE_API_TOKEN',
  endpoint: 'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run',
  model: '@cf/meta/llama-3.2-3b-instruct',
  limits: { requestsPerMinute: 50, requestsPerDay: 130, tokensPerMinute: 50000 },
  usage: { requestsToday: 0, tokensToday: 0, lastUsed: null, lastError: null },
  call: async (prompt, maxTokens, temp) => {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const token = process.env.CLOUDFLARE_API_TOKEN;
    if (!accountId || !token) throw new Error('No Cloudflare credentials');
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.2-3b-instruct`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens
        })
      }
    );
    if (!response.ok) throw new Error(`Cloudflare: ${response.status}`);
    const data = await response.json();
    return data.result?.response || '';
  }
};

const openAIProvider: AIProvider = {
  id: 'openai',
  name: 'OpenAI',
  enabled: true,
  priority: 4,
  apiKeyEnvVar: 'OPENAI_API_KEY',
  endpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-4o-mini',
  limits: { requestsPerMinute: 60, requestsPerDay: 10000, tokensPerMinute: 200000 },
  usage: { requestsToday: 0, tokensToday: 0, lastUsed: null, lastError: null },
  call: async (prompt, maxTokens, temp) => {
    if (!process.env.OPENAI_API_KEY) throw new Error('No OpenAI key');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: temp
      })
    });
    if (!response.ok) throw new Error(`OpenAI: ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
};
```

### Step 1.3: Create Main Fallback Function

```typescript
async function callWithFallback(
  prompt: string,
  config: FallbackConfig,
  logFunction?: string
): Promise<string> {
  const providers = (config.providers || getEnabledProviders())
    .sort((a, b) => a.priority - b.priority);
  
  const errors: string[] = [];
  const startTime = Date.now();
  
  for (const provider of providers) {
    if (!provider.enabled) continue;
    
    try {
      console.log(`[AI Fallback] Trying ${provider.name}...`);
      const providerStart = Date.now();
      
      const result = await provider.call(prompt, config.maxTokens, config.temperature);
      
      if (result && result.trim().length > 0) {
        const duration = Date.now() - providerStart;
        console.log(`[AI Fallback] ✓ ${provider.name} succeeded (${duration}ms)`);
        
        // Log success
        await logAICall({
          provider: provider.id,
          function: logFunction || 'unknown',
          status: 'success',
          duration,
          tokens: result.length / 4 // Approximate token count
        });
        
        // Update usage
        provider.usage.requestsToday++;
        provider.usage.lastUsed = new Date();
        provider.usage.lastError = null;
        
        return result;
      }
      
      console.log(`[AI Fallback] ${provider.name} returned empty response`);
    } catch (error: any) {
      const errorMsg = error?.message || 'Unknown error';
      errors.push(`${provider.name}: ${errorMsg}`);
      console.error(`[AI Fallback] ✗ ${provider.name} failed:`, errorMsg);
      
      // Update usage with error
      provider.usage.lastError = errorMsg;
      
      // Log error
      await logAICall({
        provider: provider.id,
        function: logFunction || 'unknown',
        status: 'error',
        duration: Date.now() - startTime,
        tokens: 0,
        error: errorMsg
      });
      
      // Wait before trying next provider
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // All providers failed
  console.error('[AI Fallback] All providers failed:', errors);
  throw new Error('AI service unavailable. Please try again later.');
}
```

### Step 1.4: Create JSON Fallback Function

```typescript
async function callWithFallbackJSON<T>(
  prompt: string,
  config: FallbackConfig,
  parseFunction: (text: string) => T,
  logFunction?: string
): Promise<T> {
  const result = await callWithFallback(prompt, config, logFunction);
  
  try {
    const jsonMatch = result.match(/```json\n?([\s\S]*?)\n?```/) || 
                      result.match(/\{[\s\S]*\}/) ||
                      result.match(/\[[\s\S]*\]/);
    
    const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : result;
    return parseFunction(jsonText);
  } catch (parseError) {
    console.error('[AI Fallback] JSON parse error:', parseError);
    throw new Error('Error processing response. Please try again.');
  }
}
```

---

## PART 2: ADMIN AI DASHBOARD

### Step 2.1: Database Schema

```sql
-- Provider configurations
CREATE TABLE ai_providers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  priority INT DEFAULT 0,
  endpoint VARCHAR(255),
  model VARCHAR(100),
  api_key_env_var VARCHAR(100),
  requests_per_minute INT DEFAULT 15,
  requests_per_day INT DEFAULT 1500,
  tokens_per_minute INT DEFAULT 1000000,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily usage tracking
CREATE TABLE ai_usage (
  id SERIAL PRIMARY KEY,
  provider_id VARCHAR(50) REFERENCES ai_providers(id),
  date DATE DEFAULT CURRENT_DATE,
  requests_count INT DEFAULT 0,
  tokens_count INT DEFAULT 0,
  errors_count INT DEFAULT 0,
  UNIQUE(provider_id, date)
);

-- AI call logs
CREATE TABLE ai_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  provider_id VARCHAR(50),
  function_name VARCHAR(100),
  status VARCHAR(20),
  duration_ms INT,
  tokens_used INT,
  error_message TEXT,
  request_preview TEXT,
  response_preview TEXT
);

-- Insert default providers
INSERT INTO ai_providers (id, name, priority, endpoint, model, api_key_env_var, requests_per_day) VALUES
('gemini', 'Google Gemini', 1, 'googleapis.com', 'gemini-2.5-flash', 'GEMINI_API_KEY', 1500),
('openrouter', 'OpenRouter', 2, 'openrouter.ai', 'google/gemini-2.0-flash-001', 'OPENROUTER_API_KEY', 50),
('cloudflare', 'Cloudflare Workers AI', 3, 'cloudflare.com', '@cf/meta/llama-3.2-3b-instruct', 'CLOUDFLARE_API_TOKEN', 130),
('openai', 'OpenAI', 4, 'api.openai.com', 'gpt-4o-mini', 'OPENAI_API_KEY', 10000);
```

### Step 2.2: Backend API Endpoints

```typescript
// GET /api/admin/ai/providers - List all providers
app.get('/api/admin/ai/providers', requireAdmin, async (req, res) => {
  const providers = await db.query('SELECT * FROM ai_providers ORDER BY priority');
  res.json(providers);
});

// PUT /api/admin/ai/providers/:id - Update provider
app.put('/api/admin/ai/providers/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { enabled, priority, model } = req.body;
  await db.query(
    'UPDATE ai_providers SET enabled = $1, priority = $2, model = $3, updated_at = NOW() WHERE id = $4',
    [enabled, priority, model, id]
  );
  res.json({ success: true });
});

// PUT /api/admin/ai/providers/reorder - Reorder providers
app.put('/api/admin/ai/providers/reorder', requireAdmin, async (req, res) => {
  const { order } = req.body; // ['gemini', 'openrouter', 'cloudflare', 'openai']
  for (let i = 0; i < order.length; i++) {
    await db.query('UPDATE ai_providers SET priority = $1 WHERE id = $2', [i + 1, order[i]]);
  }
  res.json({ success: true });
});

// POST /api/admin/ai/providers/:id/test - Test provider connection
app.post('/api/admin/ai/providers/:id/test', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const provider = getProviderById(id);
  
  try {
    const start = Date.now();
    const result = await provider.call('Say "Connection successful" in exactly 2 words.', 10, 0.1);
    const duration = Date.now() - start;
    res.json({ success: true, duration, response: result.substring(0, 100) });
  } catch (error: any) {
    res.json({ success: false, error: error.message });
  }
});

// GET /api/admin/ai/usage - Get usage statistics
app.get('/api/admin/ai/usage', requireAdmin, async (req, res) => {
  const usage = await db.query(`
    SELECT 
      p.id, p.name, p.enabled, p.requests_per_day as daily_limit,
      COALESCE(u.requests_count, 0) as requests_today,
      COALESCE(u.tokens_count, 0) as tokens_today,
      COALESCE(u.errors_count, 0) as errors_today
    FROM ai_providers p
    LEFT JOIN ai_usage u ON p.id = u.provider_id AND u.date = CURRENT_DATE
    ORDER BY p.priority
  `);
  res.json(usage);
});

// GET /api/admin/ai/logs - Get logs with pagination
app.get('/api/admin/ai/logs', requireAdmin, async (req, res) => {
  const { page = 1, limit = 50, provider, status, function: fn } = req.query;
  const offset = (page - 1) * limit;
  
  let query = 'SELECT * FROM ai_logs WHERE 1=1';
  const params: any[] = [];
  
  if (provider) {
    params.push(provider);
    query += ` AND provider_id = $${params.length}`;
  }
  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }
  if (fn) {
    params.push(fn);
    query += ` AND function_name = $${params.length}`;
  }
  
  query += ` ORDER BY timestamp DESC LIMIT ${limit} OFFSET ${offset}`;
  
  const logs = await db.query(query, params);
  res.json(logs);
});

// DELETE /api/admin/ai/logs - Clear logs
app.delete('/api/admin/ai/logs', requireAdmin, async (req, res) => {
  await db.query('DELETE FROM ai_logs WHERE timestamp < NOW() - INTERVAL \'30 days\'');
  res.json({ success: true });
});

// POST /api/admin/ai/health-check - Run health check on all providers
app.post('/api/admin/ai/health-check', requireAdmin, async (req, res) => {
  const providers = await getEnabledProviders();
  const results = [];
  
  for (const provider of providers) {
    try {
      const start = Date.now();
      await provider.call('Test', 5, 0.1);
      results.push({ id: provider.id, status: 'ok', latency: Date.now() - start });
    } catch (error: any) {
      results.push({ id: provider.id, status: 'error', error: error.message });
    }
  }
  
  res.json(results);
});
```

### Step 2.3: Dashboard UI Component

```tsx
function AIDashboard() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [usage, setUsage] = useState<any[]>([]);
  const [logs, setLogs] = useState<AILog[]>([]);
  const [activeTab, setActiveTab] = useState<'providers' | 'usage' | 'logs' | 'debug'>('providers');

  useEffect(() => {
    fetchProviders();
    fetchUsage();
    fetchLogs();
  }, []);

  return (
    <div className="ai-dashboard">
      <h1>AI API Management</h1>
      
      <div className="tabs">
        <button onClick={() => setActiveTab('providers')}>Providers</button>
        <button onClick={() => setActiveTab('usage')}>Usage & Limits</button>
        <button onClick={() => setActiveTab('logs')}>Logs</button>
        <button onClick={() => setActiveTab('debug')}>Debug</button>
      </div>

      {activeTab === 'providers' && (
        <ProviderManagementPanel 
          providers={providers} 
          onUpdate={fetchProviders}
        />
      )}

      {activeTab === 'usage' && (
        <UsageDashboard usage={usage} />
      )}

      {activeTab === 'logs' && (
        <LogViewer logs={logs} onRefresh={fetchLogs} />
      )}

      {activeTab === 'debug' && (
        <DebugConsole providers={providers} />
      )}
    </div>
  );
}

function ProviderManagementPanel({ providers, onUpdate }) {
  const toggleProvider = async (id: string, enabled: boolean) => {
    await fetch(`/api/admin/ai/providers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    onUpdate();
  };

  const testProvider = async (id: string) => {
    const res = await fetch(`/api/admin/ai/providers/${id}/test`, { method: 'POST' });
    const result = await res.json();
    alert(result.success ? `Success! (${result.duration}ms)` : `Failed: ${result.error}`);
  };

  return (
    <div className="provider-panel">
      <h2>AI Providers</h2>
      <table>
        <thead>
          <tr>
            <th>Priority</th>
            <th>Provider</th>
            <th>Model</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {providers.map(p => (
            <tr key={p.id}>
              <td>{p.priority}</td>
              <td>{p.name}</td>
              <td>{p.model}</td>
              <td>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={p.enabled} 
                    onChange={(e) => toggleProvider(p.id, e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </td>
              <td>
                <button onClick={() => testProvider(p.id)}>Test</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsageDashboard({ usage }) {
  return (
    <div className="usage-dashboard">
      <h2>Usage & Limits</h2>
      <div className="usage-cards">
        {usage.map(u => (
          <div key={u.id} className={`usage-card ${u.enabled ? 'active' : 'disabled'}`}>
            <h3>{u.name}</h3>
            <div className="progress-bar">
              <div 
                className="progress" 
                style={{ width: `${(u.requests_today / u.daily_limit) * 100}%` }}
              />
            </div>
            <p>{u.requests_today} / {u.daily_limit} requests</p>
            <p>{u.tokens_today.toLocaleString()} tokens used</p>
            {u.errors_today > 0 && <p className="error">{u.errors_today} errors today</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function LogViewer({ logs, onRefresh }) {
  const [filter, setFilter] = useState({ status: '', provider: '' });

  return (
    <div className="log-viewer">
      <h2>AI Logs</h2>
      <div className="filters">
        <select onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All Status</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
          <option value="fallback">Fallback</option>
        </select>
        <button onClick={onRefresh}>Refresh</button>
        <button onClick={() => exportLogs(logs)}>Export CSV</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Provider</th>
            <th>Function</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id} className={log.status}>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
              <td>{log.provider}</td>
              <td>{log.function}</td>
              <td>{log.status}</td>
              <td>{log.duration}ms</td>
              <td>{log.error || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DebugConsole({ providers }) {
  const [testPrompt, setTestPrompt] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  const runHealthCheck = async () => {
    const res = await fetch('/api/admin/ai/health-check', { method: 'POST' });
    const results = await res.json();
    setTestResult(results);
  };

  const testFunction = async () => {
    const start = Date.now();
    try {
      const result = await callWithFallback(testPrompt, { maxTokens: 500, temperature: 0.5 });
      setTestResult({ success: true, duration: Date.now() - start, response: result });
    } catch (error: any) {
      setTestResult({ success: false, error: error.message });
    }
  };

  return (
    <div className="debug-console">
      <h2>Debug Tools</h2>
      
      <div className="health-check">
        <h3>Health Check</h3>
        <button onClick={runHealthCheck}>Test All Providers</button>
        {testResult && Array.isArray(testResult) && (
          <ul>
            {testResult.map(r => (
              <li key={r.id} className={r.status}>
                {r.id}: {r.status} {r.latency && `(${r.latency}ms)`} {r.error}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="test-prompt">
        <h3>Test Prompt</h3>
        <textarea 
          value={testPrompt}
          onChange={(e) => setTestPrompt(e.target.value)}
          placeholder="Enter a test prompt..."
        />
        <button onClick={testFunction}>Run Test</button>
        {testResult && !Array.isArray(testResult) && (
          <div className={`result ${testResult.success ? 'success' : 'error'}`}>
            {testResult.success ? (
              <>
                <p>Duration: {testResult.duration}ms</p>
                <pre>{testResult.response}</pre>
              </>
            ) : (
              <p>Error: {testResult.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Step 2.4: WordPress Integration (Optional)

```php
<?php
// Add to functions.php or create a custom plugin

add_action('admin_menu', function() {
  add_menu_page(
    'AI Dashboard',
    'AI Dashboard',
    'manage_options',
    'ai-dashboard',
    'render_ai_dashboard',
    'dashicons-admin-generic',
    30
  );
});

function render_ai_dashboard() {
  ?>
  <div class="wrap">
    <h1>AI API Management Dashboard</h1>
    <div id="ai-dashboard-root"></div>
  </div>
  <script src="<?php echo plugins_url('ai-dashboard.js', __FILE__); ?>"></script>
  <?php
}

// REST API endpoints
add_action('rest_api_init', function() {
  register_rest_route('ai/v1', '/providers', [
    'methods' => 'GET',
    'callback' => 'get_ai_providers',
    'permission_callback' => function() { return current_user_can('manage_options'); }
  ]);
  
  register_rest_route('ai/v1', '/providers/(?P<id>[a-z]+)', [
    'methods' => 'PUT',
    'callback' => 'update_ai_provider',
    'permission_callback' => function() { return current_user_can('manage_options'); }
  ]);
  
  register_rest_route('ai/v1', '/usage', [
    'methods' => 'GET',
    'callback' => 'get_ai_usage',
    'permission_callback' => function() { return current_user_can('manage_options'); }
  ]);
  
  register_rest_route('ai/v1', '/logs', [
    'methods' => 'GET',
    'callback' => 'get_ai_logs',
    'permission_callback' => function() { return current_user_can('manage_options'); }
  ]);
});
?>
```

---

## PART 3: CONVERTING EXISTING AI FUNCTIONS

### How to Convert Each Function

**Before (Single Provider):**
```typescript
export async function generateChatResponse(message: string): Promise<string> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ parts: [{ text: message }] }],
    config: { maxOutputTokens: 800, temperature: 0.6 }
  });
  return response.text || '';
}
```

**After (With Fallback):**
```typescript
export async function generateChatResponse(message: string): Promise<string> {
  return callWithFallback(message, {
    maxTokens: 800,
    temperature: 0.6
  }, 'generateChatResponse');
}
```

### Function Configuration Reference

| Function | Max Tokens | Temperature | Notes |
|----------|------------|-------------|-------|
| Chat responses | 800 | 0.6 | Standard |
| Contract analysis | 2000 | 0.3 | Low temp for accuracy |
| Suggestions | 150 | 0.5 | Short responses |
| Search/Finder | 1000 | 0.7 | Higher creativity |
| Legal citations | 1500 | 0.3 | Low temp for accuracy |
| Content generation | 500-1500 | 0.7-0.8 | Creative |
| Document generation | 2000-2500 | 0.5 | Balanced |

---

## PART 4: SECURITY REQUIREMENTS

1. **Authentication**: Dashboard accessible only to admin users
2. **API Key Storage**: Store keys encrypted in environment variables, never in database
3. **Rate Limiting**: Prevent abuse of test endpoints
4. **Audit Trail**: Log all admin actions (key changes, provider toggles)
5. **Input Validation**: Sanitize all inputs before processing
6. **CORS**: Restrict API endpoints to same-origin requests

---

## PART 5: TESTING CHECKLIST

After implementation, verify:

- [ ] Fallback system works (disable primary provider and verify fallback)
- [ ] All providers can be enabled/disabled from dashboard
- [ ] Priority order can be changed via drag-drop
- [ ] Usage stats update in real-time
- [ ] Logs display correctly with filters
- [ ] Test connection works for all providers
- [ ] Health check runs successfully
- [ ] Error messages display correctly in user's language
- [ ] Response times are acceptable (< 10s per provider attempt)
- [ ] Dashboard is only accessible to admin users

---

## IMPLEMENTATION PRIORITY

### Phase 1: Core Fallback System
1. Add provider interfaces and implementations
2. Create callWithFallback function
3. Convert critical AI functions

### Phase 2: Basic Dashboard
1. Create database schema
2. Add API endpoints for providers and usage
3. Build basic provider management UI

### Phase 3: Monitoring
1. Add logging system
2. Build log viewer UI
3. Add usage statistics

### Phase 4: Advanced Features
1. Add debug console
2. Add health check functionality
3. Add export/import features
4. Add usage alerts

---

## PART 6: COMPLETE WORDPRESS INTEGRATION (For Any WordPress AI Site)

This section provides a complete, reusable WordPress plugin for AI API management.

### Step 6.1: Create Plugin File Structure

```
wp-content/plugins/ai-dashboard/
├── ai-dashboard.php          (Main plugin file)
├── includes/
│   ├── class-ai-providers.php
│   ├── class-ai-logger.php
│   └── class-ai-fallback.php
├── admin/
│   ├── class-admin-dashboard.php
│   ├── views/
│   │   ├── dashboard.php
│   │   ├── providers.php
│   │   ├── usage.php
│   │   ├── logs.php
│   │   └── debug.php
│   └── css/
│       └── admin-style.css
└── assets/
    └── js/
        └── dashboard.js
```

### Step 6.2: Main Plugin File (ai-dashboard.php)

```php
<?php
/**
 * Plugin Name: AI Dashboard - Multi-Provider Fallback System
 * Description: Manage AI API providers with automatic fallback and admin dashboard
 * Version: 1.0.0
 * Author: Your Name
 * Text Domain: ai-dashboard
 */

if (!defined('ABSPATH')) exit;

define('AI_DASHBOARD_VERSION', '1.0.0');
define('AI_DASHBOARD_PATH', plugin_dir_path(__FILE__));
define('AI_DASHBOARD_URL', plugin_dir_url(__FILE__));

// Load dependencies
require_once AI_DASHBOARD_PATH . 'includes/class-ai-providers.php';
require_once AI_DASHBOARD_PATH . 'includes/class-ai-logger.php';
require_once AI_DASHBOARD_PATH . 'includes/class-ai-fallback.php';
require_once AI_DASHBOARD_PATH . 'admin/class-admin-dashboard.php';

// Initialize plugin
add_action('plugins_loaded', function() {
    AI_Providers::init();
    AI_Logger::init();
    AI_Fallback::init();
    
    if (is_admin()) {
        AI_Admin_Dashboard::init();
    }
});

// Activation hook - create database tables
register_activation_hook(__FILE__, function() {
    global $wpdb;
    $charset_collate = $wpdb->get_charset_collate();
    
    // Providers table
    $sql1 = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}ai_providers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        enabled TINYINT(1) DEFAULT 1,
        priority INT DEFAULT 0,
        endpoint VARCHAR(255),
        model VARCHAR(100),
        api_key_option VARCHAR(100),
        requests_per_minute INT DEFAULT 15,
        requests_per_day INT DEFAULT 1500,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) $charset_collate;";
    
    // Usage table
    $sql2 = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}ai_usage (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        provider_id VARCHAR(50),
        date DATE DEFAULT (CURRENT_DATE),
        requests_count INT DEFAULT 0,
        tokens_count INT DEFAULT 0,
        errors_count INT DEFAULT 0,
        UNIQUE KEY provider_date (provider_id, date)
    ) $charset_collate;";
    
    // Logs table
    $sql3 = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}ai_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        provider_id VARCHAR(50),
        function_name VARCHAR(100),
        status VARCHAR(20),
        duration_ms INT,
        tokens_used INT,
        error_message TEXT,
        INDEX idx_timestamp (timestamp),
        INDEX idx_provider (provider_id),
        INDEX idx_status (status)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql1);
    dbDelta($sql2);
    dbDelta($sql3);
    
    // Insert default providers
    $wpdb->replace("{$wpdb->prefix}ai_providers", [
        'id' => 'gemini',
        'name' => 'Google Gemini',
        'priority' => 1,
        'endpoint' => 'googleapis.com',
        'model' => 'gemini-2.5-flash',
        'api_key_option' => 'ai_gemini_api_key',
        'requests_per_day' => 1500
    ]);
    
    $wpdb->replace("{$wpdb->prefix}ai_providers", [
        'id' => 'openrouter',
        'name' => 'OpenRouter',
        'priority' => 2,
        'endpoint' => 'openrouter.ai',
        'model' => 'google/gemini-2.0-flash-001',
        'api_key_option' => 'ai_openrouter_api_key',
        'requests_per_day' => 50
    ]);
    
    $wpdb->replace("{$wpdb->prefix}ai_providers", [
        'id' => 'cloudflare',
        'name' => 'Cloudflare Workers AI',
        'priority' => 3,
        'endpoint' => 'cloudflare.com',
        'model' => '@cf/meta/llama-3.2-3b-instruct',
        'api_key_option' => 'ai_cloudflare_api_token',
        'requests_per_day' => 130
    ]);
    
    $wpdb->replace("{$wpdb->prefix}ai_providers", [
        'id' => 'openai',
        'name' => 'OpenAI',
        'priority' => 4,
        'endpoint' => 'api.openai.com',
        'model' => 'gpt-4o-mini',
        'api_key_option' => 'ai_openai_api_key',
        'requests_per_day' => 10000
    ]);
});
```

### Step 6.3: AI Providers Class (includes/class-ai-providers.php)

```php
<?php
class AI_Providers {
    private static $providers = [];
    
    public static function init() {
        self::load_providers();
    }
    
    public static function load_providers() {
        global $wpdb;
        $results = $wpdb->get_results(
            "SELECT * FROM {$wpdb->prefix}ai_providers ORDER BY priority ASC"
        );
        
        foreach ($results as $row) {
            self::$providers[$row->id] = [
                'id' => $row->id,
                'name' => $row->name,
                'enabled' => (bool) $row->enabled,
                'priority' => (int) $row->priority,
                'endpoint' => $row->endpoint,
                'model' => $row->model,
                'api_key' => get_option($row->api_key_option, ''),
                'limits' => [
                    'requests_per_minute' => (int) $row->requests_per_minute,
                    'requests_per_day' => (int) $row->requests_per_day
                ]
            ];
        }
    }
    
    public static function get_all() {
        return self::$providers;
    }
    
    public static function get_enabled() {
        return array_filter(self::$providers, function($p) {
            return $p['enabled'] && !empty($p['api_key']);
        });
    }
    
    public static function get($id) {
        return self::$providers[$id] ?? null;
    }
    
    public static function update($id, $data) {
        global $wpdb;
        $wpdb->update(
            "{$wpdb->prefix}ai_providers",
            $data,
            ['id' => $id]
        );
        self::load_providers();
    }
    
    public static function reorder($order) {
        global $wpdb;
        foreach ($order as $priority => $id) {
            $wpdb->update(
                "{$wpdb->prefix}ai_providers",
                ['priority' => $priority + 1],
                ['id' => $id]
            );
        }
        self::load_providers();
    }
    
    public static function call($provider_id, $prompt, $max_tokens = 500, $temperature = 0.7) {
        $provider = self::get($provider_id);
        if (!$provider) {
            throw new Exception("Provider not found: $provider_id");
        }
        
        switch ($provider_id) {
            case 'gemini':
                return self::call_gemini($provider, $prompt, $max_tokens, $temperature);
            case 'openrouter':
                return self::call_openrouter($provider, $prompt, $max_tokens, $temperature);
            case 'cloudflare':
                return self::call_cloudflare($provider, $prompt, $max_tokens, $temperature);
            case 'openai':
                return self::call_openai($provider, $prompt, $max_tokens, $temperature);
            default:
                throw new Exception("Unknown provider: $provider_id");
        }
    }
    
    private static function call_gemini($provider, $prompt, $max_tokens, $temperature) {
        $response = wp_remote_post(
            "https://generativelanguage.googleapis.com/v1beta/models/{$provider['model']}:generateContent?key={$provider['api_key']}",
            [
                'headers' => ['Content-Type' => 'application/json'],
                'body' => json_encode([
                    'contents' => [['parts' => [['text' => $prompt]]]],
                    'generationConfig' => [
                        'maxOutputTokens' => $max_tokens,
                        'temperature' => $temperature
                    ]
                ]),
                'timeout' => 30
            ]
        );
        
        if (is_wp_error($response)) {
            throw new Exception($response->get_error_message());
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        return $body['candidates'][0]['content']['parts'][0]['text'] ?? '';
    }
    
    private static function call_openrouter($provider, $prompt, $max_tokens, $temperature) {
        $response = wp_remote_post(
            'https://openrouter.ai/api/v1/chat/completions',
            [
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Authorization' => 'Bearer ' . $provider['api_key'],
                    'HTTP-Referer' => home_url()
                ],
                'body' => json_encode([
                    'model' => $provider['model'],
                    'messages' => [['role' => 'user', 'content' => $prompt]],
                    'max_tokens' => $max_tokens,
                    'temperature' => $temperature
                ]),
                'timeout' => 30
            ]
        );
        
        if (is_wp_error($response)) {
            throw new Exception($response->get_error_message());
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        return $body['choices'][0]['message']['content'] ?? '';
    }
    
    private static function call_cloudflare($provider, $prompt, $max_tokens, $temperature) {
        $account_id = get_option('ai_cloudflare_account_id', '');
        
        $response = wp_remote_post(
            "https://api.cloudflare.com/client/v4/accounts/{$account_id}/ai/run/{$provider['model']}",
            [
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Authorization' => 'Bearer ' . $provider['api_key']
                ],
                'body' => json_encode([
                    'messages' => [['role' => 'user', 'content' => $prompt]],
                    'max_tokens' => $max_tokens
                ]),
                'timeout' => 30
            ]
        );
        
        if (is_wp_error($response)) {
            throw new Exception($response->get_error_message());
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        return $body['result']['response'] ?? '';
    }
    
    private static function call_openai($provider, $prompt, $max_tokens, $temperature) {
        $response = wp_remote_post(
            'https://api.openai.com/v1/chat/completions',
            [
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Authorization' => 'Bearer ' . $provider['api_key']
                ],
                'body' => json_encode([
                    'model' => $provider['model'],
                    'messages' => [['role' => 'user', 'content' => $prompt]],
                    'max_tokens' => $max_tokens,
                    'temperature' => $temperature
                ]),
                'timeout' => 30
            ]
        );
        
        if (is_wp_error($response)) {
            throw new Exception($response->get_error_message());
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        return $body['choices'][0]['message']['content'] ?? '';
    }
}
```

### Step 6.4: AI Fallback Class (includes/class-ai-fallback.php)

```php
<?php
class AI_Fallback {
    
    public static function init() {
        // Register shortcode for AI content
        add_shortcode('ai_generate', [self::class, 'shortcode_handler']);
    }
    
    public static function call($prompt, $max_tokens = 500, $temperature = 0.7, $function_name = 'unknown') {
        $providers = AI_Providers::get_enabled();
        $errors = [];
        
        foreach ($providers as $provider) {
            $start_time = microtime(true);
            
            try {
                error_log("[AI Fallback] Trying {$provider['name']}...");
                
                $result = AI_Providers::call($provider['id'], $prompt, $max_tokens, $temperature);
                
                if (!empty(trim($result))) {
                    $duration = (microtime(true) - $start_time) * 1000;
                    error_log("[AI Fallback] ✓ {$provider['name']} succeeded ({$duration}ms)");
                    
                    // Log success
                    AI_Logger::log([
                        'provider_id' => $provider['id'],
                        'function_name' => $function_name,
                        'status' => 'success',
                        'duration_ms' => round($duration),
                        'tokens_used' => strlen($result) / 4
                    ]);
                    
                    // Update usage
                    AI_Logger::update_usage($provider['id'], 1, strlen($result) / 4);
                    
                    return $result;
                }
                
            } catch (Exception $e) {
                $error_msg = $e->getMessage();
                $errors[] = "{$provider['name']}: $error_msg";
                error_log("[AI Fallback] ✗ {$provider['name']} failed: $error_msg");
                
                // Log error
                AI_Logger::log([
                    'provider_id' => $provider['id'],
                    'function_name' => $function_name,
                    'status' => 'error',
                    'duration_ms' => round((microtime(true) - $start_time) * 1000),
                    'error_message' => $error_msg
                ]);
                
                // Update error count
                AI_Logger::update_usage($provider['id'], 0, 0, 1);
                
                // Wait before next provider
                sleep(1);
            }
        }
        
        // All providers failed
        error_log('[AI Fallback] All providers failed: ' . implode(', ', $errors));
        throw new Exception(__('AI service unavailable. Please try again later.', 'ai-dashboard'));
    }
    
    public static function shortcode_handler($atts) {
        $atts = shortcode_atts([
            'prompt' => '',
            'max_tokens' => 500,
            'temperature' => 0.7
        ], $atts);
        
        if (empty($atts['prompt'])) {
            return '';
        }
        
        try {
            return self::call($atts['prompt'], (int)$atts['max_tokens'], (float)$atts['temperature'], 'shortcode');
        } catch (Exception $e) {
            return '<p class="ai-error">' . esc_html($e->getMessage()) . '</p>';
        }
    }
}
```

### Step 6.5: AI Logger Class (includes/class-ai-logger.php)

```php
<?php
class AI_Logger {
    
    public static function init() {
        // Schedule daily cleanup
        if (!wp_next_scheduled('ai_dashboard_cleanup')) {
            wp_schedule_event(time(), 'daily', 'ai_dashboard_cleanup');
        }
        add_action('ai_dashboard_cleanup', [self::class, 'cleanup_old_logs']);
    }
    
    public static function log($data) {
        global $wpdb;
        $wpdb->insert("{$wpdb->prefix}ai_logs", [
            'provider_id' => $data['provider_id'],
            'function_name' => $data['function_name'],
            'status' => $data['status'],
            'duration_ms' => $data['duration_ms'] ?? 0,
            'tokens_used' => $data['tokens_used'] ?? 0,
            'error_message' => $data['error_message'] ?? null
        ]);
    }
    
    public static function update_usage($provider_id, $requests = 0, $tokens = 0, $errors = 0) {
        global $wpdb;
        $today = current_time('Y-m-d');
        
        $wpdb->query($wpdb->prepare(
            "INSERT INTO {$wpdb->prefix}ai_usage (provider_id, date, requests_count, tokens_count, errors_count)
             VALUES (%s, %s, %d, %d, %d)
             ON DUPLICATE KEY UPDATE 
             requests_count = requests_count + %d,
             tokens_count = tokens_count + %d,
             errors_count = errors_count + %d",
            $provider_id, $today, $requests, $tokens, $errors,
            $requests, $tokens, $errors
        ));
    }
    
    public static function get_usage($date = null) {
        global $wpdb;
        $date = $date ?: current_time('Y-m-d');
        
        return $wpdb->get_results($wpdb->prepare(
            "SELECT p.*, 
                    COALESCE(u.requests_count, 0) as requests_today,
                    COALESCE(u.tokens_count, 0) as tokens_today,
                    COALESCE(u.errors_count, 0) as errors_today
             FROM {$wpdb->prefix}ai_providers p
             LEFT JOIN {$wpdb->prefix}ai_usage u ON p.id = u.provider_id AND u.date = %s
             ORDER BY p.priority",
            $date
        ));
    }
    
    public static function get_logs($args = []) {
        global $wpdb;
        
        $defaults = [
            'per_page' => 50,
            'page' => 1,
            'provider' => '',
            'status' => '',
            'function' => ''
        ];
        $args = wp_parse_args($args, $defaults);
        
        $where = '1=1';
        $params = [];
        
        if (!empty($args['provider'])) {
            $where .= ' AND provider_id = %s';
            $params[] = $args['provider'];
        }
        if (!empty($args['status'])) {
            $where .= ' AND status = %s';
            $params[] = $args['status'];
        }
        if (!empty($args['function'])) {
            $where .= ' AND function_name = %s';
            $params[] = $args['function'];
        }
        
        $offset = ($args['page'] - 1) * $args['per_page'];
        
        $sql = "SELECT * FROM {$wpdb->prefix}ai_logs WHERE $where ORDER BY timestamp DESC LIMIT %d OFFSET %d";
        $params[] = $args['per_page'];
        $params[] = $offset;
        
        return $wpdb->get_results($wpdb->prepare($sql, $params));
    }
    
    public static function cleanup_old_logs() {
        global $wpdb;
        $wpdb->query("DELETE FROM {$wpdb->prefix}ai_logs WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY)");
        $wpdb->query("DELETE FROM {$wpdb->prefix}ai_usage WHERE date < DATE_SUB(CURDATE(), INTERVAL 90 DAY)");
    }
    
    public static function clear_logs() {
        global $wpdb;
        $wpdb->query("TRUNCATE TABLE {$wpdb->prefix}ai_logs");
    }
}
```

### Step 6.6: Admin Dashboard Class (admin/class-admin-dashboard.php)

```php
<?php
class AI_Admin_Dashboard {
    
    public static function init() {
        add_action('admin_menu', [self::class, 'add_menu']);
        add_action('admin_enqueue_scripts', [self::class, 'enqueue_scripts']);
        add_action('wp_ajax_ai_dashboard_action', [self::class, 'handle_ajax']);
    }
    
    public static function add_menu() {
        add_menu_page(
            __('AI Dashboard', 'ai-dashboard'),
            __('AI Dashboard', 'ai-dashboard'),
            'manage_options',
            'ai-dashboard',
            [self::class, 'render_dashboard'],
            'dashicons-cloud',
            30
        );
        
        add_submenu_page('ai-dashboard', __('Providers', 'ai-dashboard'), __('Providers', 'ai-dashboard'), 'manage_options', 'ai-providers', [self::class, 'render_providers']);
        add_submenu_page('ai-dashboard', __('Usage', 'ai-dashboard'), __('Usage', 'ai-dashboard'), 'manage_options', 'ai-usage', [self::class, 'render_usage']);
        add_submenu_page('ai-dashboard', __('Logs', 'ai-dashboard'), __('Logs', 'ai-dashboard'), 'manage_options', 'ai-logs', [self::class, 'render_logs']);
        add_submenu_page('ai-dashboard', __('Debug', 'ai-dashboard'), __('Debug', 'ai-dashboard'), 'manage_options', 'ai-debug', [self::class, 'render_debug']);
        add_submenu_page('ai-dashboard', __('Settings', 'ai-dashboard'), __('Settings', 'ai-dashboard'), 'manage_options', 'ai-settings', [self::class, 'render_settings']);
    }
    
    public static function enqueue_scripts($hook) {
        if (strpos($hook, 'ai-') === false) return;
        
        wp_enqueue_style('ai-dashboard-admin', AI_DASHBOARD_URL . 'admin/css/admin-style.css', [], AI_DASHBOARD_VERSION);
        wp_enqueue_script('ai-dashboard-admin', AI_DASHBOARD_URL . 'assets/js/dashboard.js', ['jquery'], AI_DASHBOARD_VERSION, true);
        wp_localize_script('ai-dashboard-admin', 'aiDashboard', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('ai_dashboard_nonce')
        ]);
    }
    
    public static function handle_ajax() {
        check_ajax_referer('ai_dashboard_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Unauthorized');
        }
        
        $action = sanitize_text_field($_POST['ai_action'] ?? '');
        
        switch ($action) {
            case 'toggle_provider':
                $id = sanitize_text_field($_POST['provider_id']);
                $enabled = (bool) $_POST['enabled'];
                AI_Providers::update($id, ['enabled' => $enabled ? 1 : 0]);
                wp_send_json_success();
                break;
                
            case 'reorder_providers':
                $order = array_map('sanitize_text_field', $_POST['order']);
                AI_Providers::reorder($order);
                wp_send_json_success();
                break;
                
            case 'test_provider':
                $id = sanitize_text_field($_POST['provider_id']);
                $start = microtime(true);
                try {
                    $result = AI_Providers::call($id, 'Say "OK" in one word.', 5, 0.1);
                    wp_send_json_success([
                        'duration' => round((microtime(true) - $start) * 1000),
                        'response' => substr($result, 0, 100)
                    ]);
                } catch (Exception $e) {
                    wp_send_json_error($e->getMessage());
                }
                break;
                
            case 'health_check':
                $results = [];
                foreach (AI_Providers::get_enabled() as $provider) {
                    $start = microtime(true);
                    try {
                        AI_Providers::call($provider['id'], 'Test', 5, 0.1);
                        $results[] = [
                            'id' => $provider['id'],
                            'status' => 'ok',
                            'latency' => round((microtime(true) - $start) * 1000)
                        ];
                    } catch (Exception $e) {
                        $results[] = [
                            'id' => $provider['id'],
                            'status' => 'error',
                            'error' => $e->getMessage()
                        ];
                    }
                }
                wp_send_json_success($results);
                break;
                
            case 'test_prompt':
                $prompt = sanitize_textarea_field($_POST['prompt']);
                $start = microtime(true);
                try {
                    $result = AI_Fallback::call($prompt, 500, 0.7, 'test_prompt');
                    wp_send_json_success([
                        'duration' => round((microtime(true) - $start) * 1000),
                        'response' => $result
                    ]);
                } catch (Exception $e) {
                    wp_send_json_error($e->getMessage());
                }
                break;
                
            case 'save_api_key':
                $provider_id = sanitize_text_field($_POST['provider_id']);
                $api_key = sanitize_text_field($_POST['api_key']);
                $option_name = 'ai_' . $provider_id . '_api_key';
                update_option($option_name, $api_key);
                wp_send_json_success();
                break;
                
            case 'clear_logs':
                AI_Logger::clear_logs();
                wp_send_json_success();
                break;
                
            default:
                wp_send_json_error('Unknown action');
        }
    }
    
    public static function render_dashboard() {
        $usage = AI_Logger::get_usage();
        include AI_DASHBOARD_PATH . 'admin/views/dashboard.php';
    }
    
    public static function render_providers() {
        $providers = AI_Providers::get_all();
        include AI_DASHBOARD_PATH . 'admin/views/providers.php';
    }
    
    public static function render_usage() {
        $usage = AI_Logger::get_usage();
        include AI_DASHBOARD_PATH . 'admin/views/usage.php';
    }
    
    public static function render_logs() {
        $logs = AI_Logger::get_logs($_GET);
        include AI_DASHBOARD_PATH . 'admin/views/logs.php';
    }
    
    public static function render_debug() {
        $providers = AI_Providers::get_enabled();
        include AI_DASHBOARD_PATH . 'admin/views/debug.php';
    }
    
    public static function render_settings() {
        if (isset($_POST['save_settings'])) {
            check_admin_referer('ai_settings_nonce');
            
            update_option('ai_gemini_api_key', sanitize_text_field($_POST['gemini_key'] ?? ''));
            update_option('ai_openrouter_api_key', sanitize_text_field($_POST['openrouter_key'] ?? ''));
            update_option('ai_cloudflare_account_id', sanitize_text_field($_POST['cloudflare_account'] ?? ''));
            update_option('ai_cloudflare_api_token', sanitize_text_field($_POST['cloudflare_token'] ?? ''));
            update_option('ai_openai_api_key', sanitize_text_field($_POST['openai_key'] ?? ''));
            
            echo '<div class="notice notice-success"><p>Settings saved!</p></div>';
        }
        
        ?>
        <div class="wrap">
            <h1><?php _e('AI API Settings', 'ai-dashboard'); ?></h1>
            <form method="post">
                <?php wp_nonce_field('ai_settings_nonce'); ?>
                <table class="form-table">
                    <tr>
                        <th>Gemini API Key</th>
                        <td><input type="password" name="gemini_key" value="<?php echo esc_attr(get_option('ai_gemini_api_key')); ?>" class="regular-text" /></td>
                    </tr>
                    <tr>
                        <th>OpenRouter API Key</th>
                        <td><input type="password" name="openrouter_key" value="<?php echo esc_attr(get_option('ai_openrouter_api_key')); ?>" class="regular-text" /></td>
                    </tr>
                    <tr>
                        <th>Cloudflare Account ID</th>
                        <td><input type="text" name="cloudflare_account" value="<?php echo esc_attr(get_option('ai_cloudflare_account_id')); ?>" class="regular-text" /></td>
                    </tr>
                    <tr>
                        <th>Cloudflare API Token</th>
                        <td><input type="password" name="cloudflare_token" value="<?php echo esc_attr(get_option('ai_cloudflare_api_token')); ?>" class="regular-text" /></td>
                    </tr>
                    <tr>
                        <th>OpenAI API Key</th>
                        <td><input type="password" name="openai_key" value="<?php echo esc_attr(get_option('ai_openai_api_key')); ?>" class="regular-text" /></td>
                    </tr>
                </table>
                <p class="submit">
                    <input type="submit" name="save_settings" class="button-primary" value="Save Settings" />
                </p>
            </form>
        </div>
        <?php
    }
}
```

### Step 6.7: Dashboard View (admin/views/dashboard.php)

```php
<div class="wrap ai-dashboard">
    <h1><?php _e('AI Dashboard', 'ai-dashboard'); ?></h1>
    
    <div class="ai-cards">
        <?php foreach ($usage as $provider): ?>
        <div class="ai-card <?php echo $provider->enabled ? 'active' : 'disabled'; ?>">
            <h3><?php echo esc_html($provider->name); ?></h3>
            <div class="ai-progress">
                <?php 
                $percentage = $provider->requests_per_day > 0 
                    ? min(100, ($provider->requests_today / $provider->requests_per_day) * 100) 
                    : 0;
                ?>
                <div class="ai-progress-bar" style="width: <?php echo $percentage; ?>%"></div>
            </div>
            <p class="ai-stats">
                <?php echo number_format($provider->requests_today); ?> / <?php echo number_format($provider->requests_per_day); ?> requests
            </p>
            <p class="ai-tokens">
                <?php echo number_format($provider->tokens_today); ?> tokens
            </p>
            <?php if ($provider->errors_today > 0): ?>
            <p class="ai-errors"><?php echo $provider->errors_today; ?> errors</p>
            <?php endif; ?>
            <span class="ai-status <?php echo $provider->enabled ? 'online' : 'offline'; ?>">
                <?php echo $provider->enabled ? '● Online' : '○ Offline'; ?>
            </span>
        </div>
        <?php endforeach; ?>
    </div>
    
    <div class="ai-actions">
        <button class="button button-primary" id="run-health-check">
            <?php _e('Run Health Check', 'ai-dashboard'); ?>
        </button>
    </div>
    
    <div id="health-results" style="display:none; margin-top:20px;"></div>
</div>

<style>
.ai-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
.ai-card { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.ai-card.disabled { opacity: 0.6; }
.ai-card h3 { margin: 0 0 15px; }
.ai-progress { height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden; }
.ai-progress-bar { height: 100%; background: #2271b1; transition: width 0.3s; }
.ai-stats, .ai-tokens { margin: 10px 0 5px; color: #666; }
.ai-errors { color: #d63638; font-weight: bold; }
.ai-status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
.ai-status.online { background: #d4edda; color: #155724; }
.ai-status.offline { background: #f8d7da; color: #721c24; }
</style>

<script>
jQuery(function($) {
    $('#run-health-check').on('click', function() {
        var $btn = $(this).prop('disabled', true).text('Checking...');
        var $results = $('#health-results').show().html('<p>Running health check...</p>');
        
        $.post(aiDashboard.ajaxUrl, {
            action: 'ai_dashboard_action',
            ai_action: 'health_check',
            nonce: aiDashboard.nonce
        }, function(response) {
            if (response.success) {
                var html = '<h3>Health Check Results</h3><ul>';
                response.data.forEach(function(r) {
                    html += '<li><strong>' + r.id + '</strong>: ';
                    if (r.status === 'ok') {
                        html += '<span style="color:green">✓ OK (' + r.latency + 'ms)</span>';
                    } else {
                        html += '<span style="color:red">✗ ' + r.error + '</span>';
                    }
                    html += '</li>';
                });
                html += '</ul>';
                $results.html(html);
            }
            $btn.prop('disabled', false).text('Run Health Check');
        });
    });
});
</script>
```

### Step 6.8: How to Use in Your WordPress Theme/Plugin

```php
// Use the fallback function anywhere in your WordPress site

// Simple usage
$response = AI_Fallback::call('What is the capital of France?');

// With options
$response = AI_Fallback::call(
    'Summarize this article...',
    1500,  // max_tokens
    0.5,   // temperature
    'summarize_article'  // function name for logging
);

// In a shortcode (built-in)
// [ai_generate prompt="Write a poem about spring" max_tokens="200"]

// In a custom function
function my_ai_feature($user_input) {
    try {
        return AI_Fallback::call($user_input, 800, 0.7, 'my_custom_feature');
    } catch (Exception $e) {
        return 'Sorry, AI service is currently unavailable.';
    }
}
```

---

Now implement step by step, starting with the provider interfaces and fallback function.
