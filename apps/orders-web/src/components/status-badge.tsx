import type { OrderStatus } from '@repo/schemas';
import { Badge } from '@/components/ui/badge';

const statusVariantMap: Record<OrderStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  PROCESSING: 'secondary',
  FULFILLABLE: 'outline',
  PAYMENT_COMPLETE: 'default',
  UNFULFILLABLE: 'destructive',
  PAYMENT_FAILED: 'destructive',
  CANCELLED: 'outline',
};

type StatusBadgeProps = {
  status: OrderStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge variant={statusVariantMap[status]}>{status}</Badge>;
}
