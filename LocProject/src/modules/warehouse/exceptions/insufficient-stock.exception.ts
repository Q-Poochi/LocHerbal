import { BadRequestException } from '@nestjs/common';

export class InsufficientStockException extends BadRequestException {
    public readonly variantId: string;
    public readonly requested: number;
    public readonly available: number;

    constructor(variantId: string, requested: number, available: number) {
        super(
            `Variant ${variantId}: requested ${requested} but only ${available} available`,
        );
        this.variantId = variantId;
        this.requested = requested;
        this.available = available;
        this.name = 'InsufficientStockException';
    }
}