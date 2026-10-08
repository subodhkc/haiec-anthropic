import Anthropic from '@anthropic-ai/sdk';

interface TrackedAnthropicConfig {
  apiKey: string;
  haiecApiKey: string;
  haiecEndpoint?: string;
}

interface ModelPricing {
  inputCostPer1M: number;
  outputCostPer1M: number;
}

const MODEL_PRICING: Record<string, ModelPricing> = {
  'claude-3-opus-20240229': {
    inputCostPer1M: 15.00,
    outputCostPer1M: 75.00,
  },
  'claude-3-sonnet-20240229': {
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
  },
  'claude-3-haiku-20240307': {
    inputCostPer1M: 0.25,
    outputCostPer1M: 1.25,
  },
  'claude-2.1': {
    inputCostPer1M: 8.00,
    outputCostPer1M: 24.00,
  },
  'claude-2.0': {
    inputCostPer1M: 8.00,
    outputCostPer1M: 24.00,
  },
  'claude-instant-1.2': {
    inputCostPer1M: 0.80,
    outputCostPer1M: 2.40,
  },
};

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['claude-3-haiku-20240307'];
  
  const inputCost = (inputTokens / 1_000_000) * pricing.inputCostPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputCostPer1M;
  
  return inputCost + outputCost;
}

async function logUsage(
  haiecApiKey: string,
  endpoint: string,
  data: {
    provider: string;
    model: string;
    endpoint: string;
    requestTokens: number;
    responseTokens: number;
    cost: number;
    latencyMs: number;
    statusCode: number;
    errorMessage?: string;
  }
): Promise<void> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-HAIEC-API-KEY': haiecApiKey,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('Failed to log usage to HAIEC:', await response.text());
    }
  } catch (error) {
    console.error('Error logging usage to HAIEC:', error);
  }
}

export class TrackedAnthropic {
  private client: Anthropic;
  private haiecApiKey: string;
  private haiecEndpoint: string;

  constructor(config: TrackedAnthropicConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });

    this.haiecApiKey = config.haiecApiKey;
    this.haiecEndpoint = config.haiecEndpoint || 'https://haiec.com/api/v1/inventory/usage/log';
  }

  get messages() {
    const self = this;
    return {
      create: async (params: Anthropic.MessageCreateParams) => {
        const startTime = Date.now();
        let statusCode = 200;
        let errorMessage: string | undefined;

        try {
          const response = await self.client.messages.create(params);
          const latencyMs = Date.now() - startTime;

          if ('usage' in response && response.usage) {
            const cost = calculateCost(
              params.model,
              response.usage.input_tokens,
              response.usage.output_tokens
            );

            await logUsage(self.haiecApiKey, self.haiecEndpoint, {
              provider: 'anthropic',
              model: params.model,
              endpoint: 'messages',
              requestTokens: response.usage.input_tokens,
              responseTokens: response.usage.output_tokens,
              cost,
              latencyMs,
              statusCode,
            });
          }

          return response;
        } catch (error) {
          const latencyMs = Date.now() - startTime;
          statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
          errorMessage = error instanceof Error ? error.message : 'Unknown error';

          await logUsage(self.haiecApiKey, self.haiecEndpoint, {
            provider: 'anthropic',
            model: params.model,
            endpoint: 'messages',
            requestTokens: 0,
            responseTokens: 0,
            cost: 0,
            latencyMs,
            statusCode,
            errorMessage,
          });

          throw error;
        }
      },
      stream: async (params: Anthropic.MessageCreateParams) => {
        const startTime = Date.now();
        let statusCode = 200;
        let errorMessage: string | undefined;

        try {
          const stream = await self.client.messages.stream(params);
          
          const originalFinalMessage = stream.finalMessage.bind(stream);
          stream.finalMessage = async () => {
            const message = await originalFinalMessage();
            const latencyMs = Date.now() - startTime;

            if (message.usage) {
              const cost = calculateCost(
                params.model,
                message.usage.input_tokens,
                message.usage.output_tokens
              );

              await logUsage(self.haiecApiKey, self.haiecEndpoint, {
                provider: 'anthropic',
                model: params.model,
                endpoint: 'messages.stream',
                requestTokens: message.usage.input_tokens,
                responseTokens: message.usage.output_tokens,
                cost,
                latencyMs,
                statusCode,
              });
            }

            return message;
          };

          return stream;
        } catch (error) {
          const latencyMs = Date.now() - startTime;
          statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;
          errorMessage = error instanceof Error ? error.message : 'Unknown error';

          await logUsage(self.haiecApiKey, self.haiecEndpoint, {
            provider: 'anthropic',
            model: params.model,
            endpoint: 'messages.stream',
            requestTokens: 0,
            responseTokens: 0,
            cost: 0,
            latencyMs,
            statusCode,
            errorMessage,
          });

          throw error;
        }
      },
    };
  }
}

export default TrackedAnthropic;
