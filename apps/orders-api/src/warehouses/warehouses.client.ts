import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  productResponseSchema,
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
}
