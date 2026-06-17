import {
  authorizePaymentResponseSchema,
  type AuthorizePaymentRequest,
  type AuthorizePaymentResponse,
} from '@repo/schemas';

export class PaymentAuthorizationConflictError extends Error {
  constructor() {
    super('Payment authorization already exists');
    this.name = 'PaymentAuthorizationConflictError';
  }
}

export class PaymentsClient {
  async authorize(request: AuthorizePaymentRequest): Promise<AuthorizePaymentResponse> {
    const { PAYMENTS_API_URL, INTERNAL_API_KEY } = process.env;

    if (!PAYMENTS_API_URL || !INTERNAL_API_KEY) {
      throw new Error('Payments API is not configured');
    }

    let response: Response;

    try {
      response = await fetch(`${PAYMENTS_API_URL}/payments/authorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-key': INTERNAL_API_KEY,
        },
        body: JSON.stringify(request),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown fetch error';
      throw new Error(`Failed to reach Payments API: ${message}`);
    }

    if (response.status === 409) {
      throw new PaymentAuthorizationConflictError();
    }

    if (!response.ok) {
      throw new Error(`Payments API returned HTTP ${response.status}`);
    }

    const body: unknown = await response.json();
    return authorizePaymentResponseSchema.parse(body);
  }
}
