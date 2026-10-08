# @haiec/anthropic

Anthropic Claude SDK wrapper with automatic usage tracking and cost calculation for HAIEC AI Inventory.

## Installation

```bash
npm install @haiec/anthropic
```

## Quick Start

### 1. Get Your HAIEC API Key

1. Go to [HAIEC Dashboard](https://haiec.com/dashboard/ai-inventory/api-keys)
2. Click "Add API Key"
3. Enter your Anthropic API key details
4. Check "Generate tracking key for SDK usage"
5. Copy the generated `haiec_sk_xxx` key (shown only once!)

### 2. Install and Use

```typescript
import { TrackedAnthropic } from '@haiec/anthropic';

const client = new TrackedAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,     // Your Anthropic key
  haiecApiKey: process.env.HAIEC_API_KEY,    // Your HAIEC tracking key
});

// Use exactly like the official Anthropic SDK
const response = await client.messages.create({
  model: 'claude-3-opus-20240229',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello!' }],
});

console.log(response.content[0].text);
```

### 3. View Usage in Dashboard

Visit [HAIEC Dashboard](https://haiec.com/dashboard/ai-inventory/usage) to see:
- Real-time API usage
- Cost per request
- Token consumption
- Latency metrics
- Error rates

## Features

- ✅ **Automatic Usage Tracking**: Every API call logged with tokens, cost, and latency
- ✅ **Accurate Cost Calculation**: Real-time pricing for all Claude models
- ✅ **100% API Compatible**: Drop-in replacement for the official SDK
- ✅ **Streaming Support**: Works with both regular and streaming responses
- ✅ **Silent Error Handling**: Logging failures don't break your app
- ✅ **Minimal Overhead**: <10ms added latency
- ✅ **Compliance Ready**: SOC 2, GDPR, HIPAA audit trails

## Supported Models

| Model | Input Cost | Output Cost |
|-------|------------|-------------|
| claude-3-opus-20240229 | $15.00/1M | $75.00/1M |
| claude-3-sonnet-20240229 | $3.00/1M | $15.00/1M |
| claude-3-haiku-20240307 | $0.25/1M | $1.25/1M |
| claude-2.1 | $8.00/1M | $24.00/1M |
| claude-2.0 | $8.00/1M | $24.00/1M |
| claude-instant-1.2 | $0.80/1M | $2.40/1M |

## Configuration

```typescript
const client = new TrackedAnthropic({
  // Required
  apiKey: string,              // Your Anthropic API key
  haiecApiKey: string,         // Your HAIEC tracking key (haiec_sk_xxx)
  
  // Optional
  haiecEndpoint?: string,      // Custom endpoint (default: https://haiec.com/api/v1/inventory/usage/log)
});
```

## Environment Variables

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-xxx
HAIEC_API_KEY=haiec_sk_xxx
```

## Advanced Usage

### Error Handling

```typescript
try {
  const response = await client.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hello!' }],
  });
} catch (error) {
  console.error('Anthropic API error:', error);
  // Usage is still logged even on errors
}
```

### Streaming

```typescript
const stream = await client.messages.stream({
  model: 'claude-3-opus-20240229',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Tell me a story' }],
});

for await (const chunk of stream) {
  if (chunk.type === 'content_block_delta') {
    process.stdout.write(chunk.delta.text || '');
  }
}

// Usage logged after stream completes
const finalMessage = await stream.finalMessage();
console.log('Total tokens:', finalMessage.usage.input_tokens + finalMessage.usage.output_tokens);
```

## Troubleshooting

### "Invalid or inactive API key"
- Verify your HAIEC API key starts with `haiec_sk_`
- Check the key is active in your dashboard
- Ensure you copied the full key (64+ characters)

### "Failed to log usage to HAIEC"
- Check your internet connection
- Verify the HAIEC endpoint is accessible
- Logging failures are non-blocking (your app continues)

### Usage not appearing in dashboard
- Wait 1-2 minutes for data to sync
- Check you're viewing the correct organization
- Verify the API key is linked to your account
const client = new TrackedAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  haiecApiKey: process.env.HAIEC_API_KEY!,
  haiecEndpoint: 'https://your-haiec-instance.com/api/v1/inventory/usage/log',
});
```

## Supported Models & Pricing

| Model | Input Cost (per 1M tokens) | Output Cost (per 1M tokens) |
|-------|---------------------------|----------------------------|
| claude-3-opus-20240229 | $15.00 | $75.00 |
| claude-3-sonnet-20240229 | $3.00 | $15.00 |
| claude-3-haiku-20240307 | $0.25 | $1.25 |
| claude-2.1 | $8.00 | $24.00 |
| claude-2.0 | $8.00 | $24.00 |
| claude-instant-1.2 | $0.80 | $2.40 |

*Pricing is automatically updated based on Anthropic's latest rates.*

## What Gets Tracked

For each API call, the following data is logged to HAIEC:

- **Provider**: `anthropic`
- **Model**: e.g., `claude-3-opus-20240229`
- **Endpoint**: `messages` or `messages.stream`
- **Request Tokens**: Number of input tokens
- **Response Tokens**: Number of output tokens
- **Cost**: Calculated cost in USD
- **Latency**: Response time in milliseconds
- **Status Code**: HTTP status code
- **Error Message**: If the request failed

## Performance

- **Overhead**: <10ms per request
- **Async Logging**: Usage is logged asynchronously to avoid blocking
- **Streaming**: No additional overhead for streaming responses
- **Error Handling**: Tracking failures don't affect your API calls

## Error Handling

If usage tracking fails, the error is logged to console but your Anthropic API call continues normally:

```typescript
try {
  const response = await client.messages.create({...});
  // Your response is returned even if tracking fails
} catch (error) {
  // Only Anthropic API errors are thrown
}
```

## API Compatibility

This wrapper maintains 100% compatibility with the official Anthropic SDK. All methods and parameters work exactly the same.

## Streaming Support

Both regular and streaming responses are fully supported:

```typescript
// Regular response
const response = await client.messages.create({...});

// Streaming response
const stream = await client.messages.stream({...});
for await (const event of stream) {
  // Process events
}
```

Usage is automatically tracked for both modes.

## Getting Your HAIEC API Key

1. Sign up at [haiec.com](https://haiec.com)
2. Navigate to Settings > API Keys
3. Click "Create API Key"
4. Copy your key and add it to your environment variables

## Comparison with OpenAI Wrapper

| Feature | @haiec/openai | @haiec/anthropic |
|---------|--------------|------------------|
| Provider | OpenAI | Anthropic |
| Streaming | ✅ | ✅ |
| Cost Tracking | ✅ | ✅ |
| Error Handling | ✅ | ✅ |
| Overhead | <10ms | <10ms |

## Support

- **Documentation**: [docs.haiec.com](https://docs.haiec.com)
- **Issues**: [GitHub Issues](https://github.com/haiec/haiec-anthropic/issues)
- **Email**: support@haiec.com

## License

MIT
