import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  evaluateFulfillmentResponseSchema,
  productResponseSchema,
  type EvaluateFulfillmentRequest,
  type EvaluateFulfillmentResponse,
  type ProductResponse,
} from '@repo/schemas';

@Injectable()
export class WarehousesClient {
  async getProduct(productId: string): Promise<ProductResponse> {
    const { WAREHOUSES_API_URL, INTERNAL_API_KEY } = process.env;

    if (!WAREHOUSES_API_URL || !INTERNAL_API_KEY) {
      throw new BadGatewayException('Warehouses API is not configured');
    }

    let response: Response;

    try {
      response = await fetch(`${WAREHOUSES_API_URL}/products/${productId}`, {
        headers: {
          'x-internal-api-key': INTERNAL_API_KEY,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown fetch error';
      throw new BadGatewayException(`Failed to reach Warehouses API: ${message}`);
    }

    if (response.status === 404) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    if (!response.ok) {
      throw new BadGatewayException(`Warehouses API returned HTTP ${response.status}`);
    }

    const body: unknown = await response.json();
    return productResponseSchema.parse(body);
  }

  async evaluateFulfillment(
    request: EvaluateFulfillmentRequest,
  ): Promise<EvaluateFulfillmentResponse> {
    const { WAREHOUSES_API_URL, INTERNAL_API_KEY } = process.env;

    if (!WAREHOUSES_API_URL || !INTERNAL_API_KEY) {
      throw new Error('Warehouses API is not configured');
    }

    let response: Response;

    try {
      response = await fetch(`${WAREHOUSES_API_URL}/fulfillment/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-key': INTERNAL_API_KEY,
        },
        body: JSON.stringify(request),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown fetch error';
      throw new Error(`Failed to reach Warehouses API: ${message}`);
    }

    if (!response.ok) {
      throw new Error(`Warehouses API returned HTTP ${response.status}`);
    }

    const body: unknown = await response.json();
    return evaluateFulfillmentResponseSchema.parse(body);
  }
}
