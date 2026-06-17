import { Controller, useFormContext } from 'react-hook-form';
import type { CreateOrderRequest, ProductCatalogItem } from '@repo/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type LineItemRowProps = {
  index: number;
  products: ProductCatalogItem[];
  selectedProductIds: string[];
  canRemove: boolean;
  onRemove: () => void;
};

export function LineItemRow({
  index,
  products,
  selectedProductIds,
  canRemove,
  onRemove,
}: LineItemRowProps) {
  const { control, register, watch, setValue } = useFormContext<CreateOrderRequest>();
  const productId = watch(`items.${index}.productId`);
  const selectedProduct = products.find(({ id }) => id === productId);
  const maxQuantity = selectedProduct?.availableQuantity ?? 1;

  return (
    <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_120px_auto]">
      <div className="space-y-2">
        <Label htmlFor={`items.${index}.productId`}>Product</Label>
        <Controller
          control={control}
          name={`items.${index}.productId`}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                const product = products.find(({ id }) => id === value);
                const quantity = watch(`items.${index}.quantity`);
                const cappedQuantity = product
                  ? Math.min(quantity, product.availableQuantity || 1)
                  : quantity;
                setValue(`items.${index}.quantity`, Math.max(1, cappedQuantity));
              }}
            >
              <SelectTrigger className="w-full" id={`items.${index}.productId`}>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => {
                  const { id, name, sku, unitPrice, availableQuantity } = product;
                  const isSelectedElsewhere = selectedProductIds.includes(id) && id !== productId;
                  const isDisabled = availableQuantity === 0 || isSelectedElsewhere;

                  return (
                    <SelectItem key={id} value={id} disabled={isDisabled}>
                      {name} ({sku}) — ${unitPrice.toFixed(2)} — {availableQuantity} in stock
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`items.${index}.quantity`}>Quantity</Label>
        <Input
          id={`items.${index}.quantity`}
          type="number"
          min={1}
          max={maxQuantity}
          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
        />
      </div>
      <div className="flex items-end">
        <Button
          type="button"
          variant="outline"
          disabled={!canRemove}
          onClick={onRemove}
        >
          Remove
        </Button>
      </div>
    </div>
  );
}
