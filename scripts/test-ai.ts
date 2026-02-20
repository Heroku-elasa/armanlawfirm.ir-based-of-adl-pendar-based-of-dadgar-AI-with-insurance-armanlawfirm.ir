import { aiAPI } from './services/multi-api.ts';

async function testAllProviders() {
  console.log('🧪 Testing all API providers...\n');

  // Test with automatic fallback
  console.log('--- AUTO FALLBACK TEST ---');
  const auto = await aiAPI.chat('Say "Hello from [your provider name]" in 10 words or less');
  if (auto.success) {
    console.log('Result:', auto.content);
    console.log('Provider used:', auto.provider, '\n');
  } else {
    console.log('❌ Auto fallback failed:', auto.error, '\n');
  }

  // Test each provider manually
  const providers = ['poyo1', 'poyo2', 'portkey', 'openrouter'];
  
  for (const provider of providers) {
    console.log(`--- Testing ${provider} ---`);
    const result = await aiAPI.chat('Say hi in 5 words', { 
      forceProvider: provider 
    });
    
    if (result.success) {
      console.log('✅', result.content);
      console.log('Model:', result.model);
    } else {
      console.log('❌', result.error);
    }
    console.log('');
  }

  // Show status
  console.log('--- PROVIDER STATUS ---');
  console.table(aiAPI.getStatus());
}

testAllProviders().catch(console.error);
