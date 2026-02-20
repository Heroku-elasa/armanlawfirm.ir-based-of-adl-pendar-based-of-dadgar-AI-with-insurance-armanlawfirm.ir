import OpenAI from 'openai';

// API Provider Configurations
const API_PROVIDERS = {
  poyo1: {
    name: 'Poyo.ai (Primary)',
    client: new OpenAI({
      apiKey: 'sk-NdIelDiC8dgJXP-uSy-4_03BQnGaCX1xdtVYZXFa9Z1b4FqXF3oProuUg9huz_',
      baseURL: 'https://api.poyo.ai/v1'
    }),
    models: {
      claude: 'claude-3-5-sonnet',
      gemini: 'gemini-3',
      gpt: 'gpt-4'
    },
    priority: 1
  },
  
  poyo2: {
    name: 'Poyo.ai (Backup)',
    client: new OpenAI({
      apiKey: 'sk-G8djO1CepO_vfl0u5CDGDdD6dXC5zG67rX07RDUZadqQQ5zI627VTifWq5CsJm',
      baseURL: 'https://api.poyo.ai/v1'
    }),
    models: {
      claude: 'claude-3-5-sonnet',
      gemini: 'gemini-3',
      gpt: 'gpt-4'
    },
    priority: 2
  },
  
  portkey: {
    name: 'Portkey.ai',
    client: new OpenAI({
      apiKey: 'gASN7iokVzgqJLweJTWr12V75JG+',
      baseURL: 'https://api.portkey.ai/v1',
      defaultHeaders: {
        'x-portkey-api-key': 'gASN7iokVzgqJLweJTWr12V75JG+'
      }
    }),
    models: {
      claude: 'claude-3-5-sonnet-20241022',
      gemini: 'gemini-pro',
      gpt: 'gpt-4'
    },
    priority: 3
  },
  
  openrouter: {
    name: 'OpenRouter',
    client: new OpenAI({
      apiKey: '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',
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://armanlawfirm.ir',
        'X-Title': 'Arman Law Firm'
      }
    }),
    models: {
      claude: 'anthropic/claude-3.5-sonnet',
      gemini: 'google/gemini-pro-1.5',
      gpt: 'openai/gpt-4-turbo'
    },
    priority: 4
  }
};

class MultiAPIManager {
  constructor() {
    this.providers = API_PROVIDERS;
    this.currentProvider = 'poyo1';
    this.failedProviders = new Set();
  }

  // Get sorted providers by priority (excluding failed ones)
  getAvailableProviders() {
    return Object.entries(this.providers)
      .filter(([key]) => !this.failedProviders.has(key))
      .sort(([, a], [, b]) => a.priority - b.priority);
  }

  // Main chat function with automatic fallback
  async chat(message, options = {}) {
    const {
      model = 'claude',
      temperature = 0.7,
      maxTokens = 2000,
      systemPrompt = 'You are a helpful assistant.',
      forceProvider = null
    } = options;

    // Try specific provider if requested
    if (forceProvider && this.providers[forceProvider]) {
      return await this.tryProvider(forceProvider, message, model, {
        temperature,
        maxTokens,
        systemPrompt
      });
    }

    // Try providers in order until one succeeds
    const providers = this.getAvailableProviders();
    
    for (const [providerKey, provider] of providers) {
      console.log(`🔄 Trying ${provider.name}...`);
      
      const result = await this.tryProvider(providerKey, message, model, {
        temperature,
        maxTokens,
        systemPrompt
      });

      if (result.success) {
        console.log(`✅ Success with ${provider.name}`);
        this.currentProvider = providerKey;
        return result;
      } else {
        console.log(`❌ Failed with ${provider.name}: ${result.error}`);
      }
    }

    // All providers failed
    return {
      success: false,
      error: 'All API providers failed',
      attemptedProviders: providers.map(([, p]) => p.name)
    };
  }

  // Try a specific provider
  async tryProvider(providerKey, message, modelType, options) {
    const provider = this.providers[providerKey];
    const modelName = provider.models[modelType] || provider.models.claude;

    try {
      const response = await provider.client.chat.completions.create({
        model: modelName,
        messages: [
          { role: 'system', content: options.systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: options.temperature,
        max_tokens: options.maxTokens
      });

      // Remove from failed list if it was there
      this.failedProviders.delete(providerKey);

      return {
        success: true,
        content: response.choices[0].message.content,
        provider: provider.name,
        model: modelName,
        usage: response.usage
      };
    } catch (error) {
      // Mark as failed temporarily
      this.failedProviders.add(providerKey);
      
      // Clear failed status after 5 minutes
      setTimeout(() => {
        this.failedProviders.delete(providerKey);
      }, 5 * 60 * 1000);

      return {
        success: false,
        error: error.message,
        provider: provider.name
      };
    }
  }

  // Stream with fallback
  async streamChat(message, onChunk, options = {}) {
    const { model = 'claude' } = options;
    
    const providers = this.getAvailableProviders();
    
    for (const [providerKey, provider] of providers) {
      try {
        const modelName = provider.models[model];
        const stream = await provider.client.chat.completions.create({
          model: modelName,
          messages: [{ role: 'user', content: message }],
          stream: true
        });

        console.log(`✅ Streaming with ${provider.name}`);
        
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) onChunk(content);
        }
        
        return { success: true, provider: provider.name };
      } catch (error) {
        console.log(`❌ Stream failed with ${provider.name}`);
        continue;
      }
    }

    return { success: false, error: 'All streaming providers failed' };
  }

  // Get provider status
  getStatus() {
    return Object.entries(this.providers).map(([key, provider]) => ({
      key,
      name: provider.name,
      available: !this.failedProviders.has(key),
      priority: provider.priority,
      isCurrent: key === this.currentProvider
    }));
  }
}

// Export singleton
export const aiAPI = new MultiAPIManager();
