import type { OrderResponse, ProductCatalogItem } from '@repo/schemas';
import { StatusBadge } from '@/components/status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

type OrderListProps = {
  orders: OrderResponse[];
  products: ProductCatalogItem[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

function truncateId(id: string) {
  return `${id.slice(0, 8)}…`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function getPaymentLabel(order: OrderResponse) {
  const { status, paymentAuthorizationId } = order;
  if (status === 'PAYMENT_COMPLETE' && paymentAuthorizationId) {
    return 'Authorized';
  }
  if (status === 'PAYMENT_FAILED') {
    return 'Declined';
  }
  if (status === 'PENDING' || status === 'PROCESSING' || status === 'FULFILLABLE') {
    return 'Pending';
  }
  return 'N/A';
}

function getProductName(products: ProductCatalogItem[], productId: string) {
  return products.find(({ id }) => id === productId)?.name ?? productId;
}

export function OrderList({ orders, products, loading, error, onRefresh }: OrderListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Orders</CardTitle>
        <Button variant="outline" onClick={onRefresh}>
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Failed to load orders</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {loading && orders.length === 0 ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : null}
        {!loading && orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : null}
        {orders.map((order) => {
          const {
            id,
            status,
            customer,
            totalAmount,
            createdAt,
            warehouseName,
            distanceKm,
            estimatedShipment,
            unfulfillableReason,
            paymentAuthorizationId,
            items,
          } = order;

          return (
            <Card key={id}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{truncateId(id)}</p>
                    <p className="text-sm text-muted-foreground">{customer.name} · {customer.email}</p>
                  </div>
                  <StatusBadge status={status} />
                </div>
                <div className="text-sm">
                  <p>Total: ${totalAmount.toFixed(2)}</p>
                  <p className="text-muted-foreground">Created: {formatDate(createdAt)}</p>
                </div>
                <Separator />
                <div className="space-y-1 text-sm">
                  <p className="font-medium">Fulfillment</p>
                  {status === 'UNFULFILLABLE' && unfulfillableReason ? (
                    <p>{unfulfillableReason}</p>
                  ) : warehouseName ? (
                    <>
                      <p>{warehouseName}</p>
                      {distanceKm !== undefined ? <p>{distanceKm.toFixed(1)} km</p> : null}
                      {estimatedShipment ? (
                        <p>
                          {(estimatedShipment as { carrier?: string; serviceLevel?: string; estimatedDays?: number }).carrier}
                          {' · '}
                          {(estimatedShipment as { serviceLevel?: string }).serviceLevel}
                          {' · '}
                          {(estimatedShipment as { estimatedDays?: number }).estimatedDays} days
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-muted-foreground">Not assigned yet</p>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">Payment</p>
                  <p>
                    {getPaymentLabel(order)}
                    {paymentAuthorizationId ? ` · ${truncateId(paymentAuthorizationId)}` : ''}
                  </p>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">Items</p>
                  {items.map(({ productId, quantity, unitPrice }) => (
                    <p key={`${id}-${productId}`}>
                      {getProductName(products, productId)} · qty {quantity} · ${unitPrice.toFixed(2)}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}
