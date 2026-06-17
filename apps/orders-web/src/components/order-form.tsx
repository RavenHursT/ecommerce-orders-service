import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { Controller, FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { createOrderRequestSchema, type CreateOrderRequest, type ProductCatalogItem } from '@repo/schemas';
import { ApiError, createOrder } from '@/api/client';
import { LineItemRow } from '@/components/line-item-row';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCardNumber, isValidCardNumber, parseCardNumberInput } from '@/lib/card-number';
import { z } from 'zod';

const orderFormSchema = createOrderRequestSchema.extend({
  payment: createOrderRequestSchema.shape.payment.extend({
    cardNumber: z
      .string()
      .min(1, 'Card number is required')
      .refine(isValidCardNumber, 'Enter a valid card number'),
  }),
});

type OrderFormProps = {
  products: ProductCatalogItem[];
  loadingCatalog: boolean;
  catalogError: string | null;
  onOrderCreated: () => void;
};

const defaultValues: CreateOrderRequest = {
  customer: { name: '', email: '' },
  shippingAddress: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
  },
  items: [{ productId: '', quantity: 1 }],
  payment: { cardNumber: '', description: '' },
};

export function OrderForm({
  products,
  loadingCatalog,
  catalogError,
  onOrderCreated,
}: OrderFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<CreateOrderRequest>({
    resolver: zodResolver(orderFormSchema),
    defaultValues,
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });
  const watchedItems = form.watch('items');
  const selectedProductIds = useMemo(
    () => watchedItems.map(({ productId }) => productId).filter(Boolean),
    [watchedItems],
  );

  useEffect(() => {
    const firstAvailable = products.find(({ availableQuantity }) => availableQuantity > 0);
    if (!firstAvailable) {
      return;
    }

    const currentProductId = form.getValues('items.0.productId');
    if (!currentProductId) {
      form.setValue('items.0.productId', firstAvailable.id);
    }
  }, [products, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    const uniqueIds = new Set(values.items.map(({ productId }) => productId));
    if (uniqueIds.size !== values.items.length) {
      setSubmitError('Each line item must use a different product.');
      return;
    }

    try {
      const order = await createOrder(values);
      toast.success(`Order ${order.id} created`);
      form.reset(defaultValues);
      const firstAvailable = products.find(({ availableQuantity }) => availableQuantity > 0);
      if (firstAvailable) {
        form.setValue('items.0.productId', firstAvailable.id);
      }
      onOrderCreated();
    } catch (caught) {
      const message = caught instanceof ApiError
        ? `Order failed (${caught.status})`
        : 'Order failed';
      setSubmitError(message);
    }
  });

  if (loadingCatalog) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Place Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Place Order</CardTitle>
      </CardHeader>
      <CardContent>
        {catalogError ? (
          <Alert variant="destructive">
            <AlertTitle>Catalog unavailable</AlertTitle>
            <AlertDescription>{catalogError}</AlertDescription>
          </Alert>
        ) : null}
        {submitError ? (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Submission failed</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}
        <FormProvider {...form}>
          <form className="space-y-6" onSubmit={onSubmit}>
            <section className="space-y-3">
              <h3 className="text-sm font-medium">Customer</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer.name">Name</Label>
                  <Input id="customer.name" {...form.register('customer.name')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer.email">Email</Label>
                  <Input id="customer.email" type="email" {...form.register('customer.email')} />
                </div>
              </div>
            </section>
            <Separator />
            <section className="space-y-3">
              <h3 className="text-sm font-medium">Shipping</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="shippingAddress.line1">Line 1</Label>
                  <Input id="shippingAddress.line1" {...form.register('shippingAddress.line1')} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="shippingAddress.line2">Line 2 (optional)</Label>
                  <Input id="shippingAddress.line2" {...form.register('shippingAddress.line2')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingAddress.city">City</Label>
                  <Input id="shippingAddress.city" {...form.register('shippingAddress.city')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingAddress.state">State</Label>
                  <Input id="shippingAddress.state" {...form.register('shippingAddress.state')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingAddress.postalCode">Postal code</Label>
                  <Input id="shippingAddress.postalCode" {...form.register('shippingAddress.postalCode')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingAddress.country">Country</Label>
                  <Input id="shippingAddress.country" {...form.register('shippingAddress.country')} />
                </div>
              </div>
            </section>
            <Separator />
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Line items</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ productId: '', quantity: 1 })}
                >
                  Add item
                </Button>
              </div>
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <LineItemRow
                    key={field.id}
                    index={index}
                    products={products}
                    selectedProductIds={selectedProductIds}
                    canRemove={fields.length > 1}
                    onRemove={() => remove(index)}
                  />
                ))}
              </div>
            </section>
            <Separator />
            <section className="space-y-3">
              <h3 className="text-sm font-medium">Payment</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="payment.cardNumber">Card number</Label>
                  <Controller
                    name="payment.cardNumber"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          id="payment.cardNumber"
                          inputMode="numeric"
                          autoComplete="cc-number"
                          placeholder="4242 4242 4242 4242"
                          aria-invalid={fieldState.invalid}
                          value={formatCardNumber(field.value)}
                          onChange={(event) => {
                            field.onChange(parseCardNumberInput(event.target.value, field.value));
                          }}
                          onBlur={field.onBlur}
                        />
                        {fieldState.error ? (
                          <p className="text-sm text-destructive">{fieldState.error.message}</p>
                        ) : null}
                      </>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment.description">Description (optional)</Label>
                  <Input id="payment.description" {...form.register('payment.description')} />
                </div>
              </div>
            </section>
            <Button type="submit">Submit order</Button>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
