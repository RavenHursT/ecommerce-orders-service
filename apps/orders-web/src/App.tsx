import { OrderForm } from '@/components/order-form';
import { OrderList } from '@/components/order-list';
import { ModeToggle } from '@/components/mode-toggle';
import { useCatalog } from '@/hooks/use-catalog';
import { useOrders } from '@/hooks/use-orders';

export default function App() {
  const { products, loading: loadingCatalog, error: catalogError } = useCatalog();
  const { orders, loading: loadingOrders, error: ordersError, reload } = useOrders();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold">EOS Orders</h1>
            <p className="text-sm text-muted-foreground">Place orders and track fulfillment</p>
          </div>
          <ModeToggle />
        </div>
      </header>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-2">
        <OrderForm
          products={products}
          loadingCatalog={loadingCatalog}
          catalogError={catalogError}
          onOrderCreated={reload}
        />
        <OrderList
          orders={orders}
          products={products}
          loading={loadingOrders}
          error={ordersError}
          onRefresh={reload}
        />
      </main>
    </div>
  );
}
