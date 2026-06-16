import { Injectable } from '@nestjs/common';
import type {
  EstimatedShipment,
  EvaluateFulfillmentRequest,
  EvaluateFulfillmentResponse,
  FulfillmentLineItem,
} from '@repo/schemas';
import { PrismaService } from '../database/prisma.service';
import { GoogleGeocodingService } from '../geocoding/google-geocoding.service';
import { haversineDistanceKm } from '../utils/haversine';

type WarehouseCandidate = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
};

@Injectable()
export class FulfillmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geocoding: GoogleGeocodingService,
  ) {}

  async evaluate(
    request: EvaluateFulfillmentRequest,
  ): Promise<EvaluateFulfillmentResponse> {
    const candidateWarehouseIds = await this.findWarehousesWithFullInventory(
      request.items,
    );

    if (candidateWarehouseIds.length === 0) {
      return {
        status: 'UNFULFILLABLE',
        reason: 'NO_WAREHOUSE_WITH_FULL_INVENTORY',
      };
    }

    const { latitude, longitude } = await this.geocoding.geocode(request.shippingAddress);
    const warehouses = await this.prisma.client.warehouse.findMany({
      where: {
        id: { in: candidateWarehouseIds },
      },
    });

    const rankedWarehouses = warehouses
      .map(({ id, name, latitude: warehouseLatitude, longitude: warehouseLongitude }) => ({
        id,
        name,
        latitude: warehouseLatitude,
        longitude: warehouseLongitude,
        distanceKm: haversineDistanceKm(
          latitude,
          longitude,
          warehouseLatitude,
          warehouseLongitude,
        ),
      }))
      .sort((left, right) => left.distanceKm - right.distanceKm);

    const closestWarehouse = rankedWarehouses[0];

    return {
      status: 'ACCEPTED',
      warehouseId: closestWarehouse.id,
      warehouseName: closestWarehouse.name,
      distanceKm: Number(closestWarehouse.distanceKm.toFixed(3)),
      estimatedShipment: this.buildEstimatedShipment(closestWarehouse),
    };
  }

  private async findWarehousesWithFullInventory(
    items: FulfillmentLineItem[],
  ): Promise<string[]> {
    let candidateWarehouseIds: string[] | null = null;

    for (const { productId, quantity } of items) {
      const inventoryRows = await this.prisma.client.warehouseInventory.findMany({
        where: {
          productId,
          quantity: { gte: quantity },
        },
        select: { warehouseId: true },
      });
      const warehouseIdsForItem = inventoryRows.map(({ warehouseId }) => warehouseId);

      if (warehouseIdsForItem.length === 0) {
        return [];
      }

      candidateWarehouseIds =
        candidateWarehouseIds === null
          ? warehouseIdsForItem
          : candidateWarehouseIds.filter((warehouseId) =>
              warehouseIdsForItem.includes(warehouseId),
            );

      if (candidateWarehouseIds.length === 0) {
        return [];
      }
    }

    return candidateWarehouseIds ?? [];
  }

  private buildEstimatedShipment({
    distanceKm,
  }: WarehouseCandidate): EstimatedShipment {
    return {
      carrier: 'EOS Freight',
      serviceLevel: distanceKm < 500 ? 'standard' : 'economy',
      estimatedDays: Math.max(1, Math.ceil(distanceKm / 300)),
    };
  }
}
