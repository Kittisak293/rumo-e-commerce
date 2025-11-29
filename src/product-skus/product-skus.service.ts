import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductSkus } from './entities/product-skus.entity';
import { Product } from 'src/products/entities/product.entity';
import { CreateProductSkusDto } from './dto/create-product-skus.dto';
import { UpdateProductSkusDto } from './dto/update-product-skus.dto';

@Injectable()
export class ProductSkusService {
  constructor(
    @InjectRepository(ProductSkus)
    private readonly skuRepo: Repository<ProductSkus>,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async create(dto: CreateProductSkusDto): Promise<ProductSkus> {
    const product = await this.productRepo.findOne({
      where: { id: dto.productId },
    });

    if (!product) throw new NotFoundException('Product not found');

    const sku = this.skuRepo.create({
      skuCode: dto.skuCode,
      barcode: dto.barcode ?? null,
      price: dto.price.toString(),
      compareAtPrice: dto.compareAtPrice?.toString() ?? null,
      stockQty: dto.stockQty,
      weight: dto.weight.toString(),
      imageUrl: dto.imageUrl ?? null,
      isActive: dto.isActive ?? true,
      product,
    });

    return this.skuRepo.save(sku);
  }

  async findAll(productId?: number): Promise<ProductSkus[]> {
    const qb = this.skuRepo
      .createQueryBuilder('sku')
      .leftJoinAndSelect('sku.product', 'product');

    if (productId) {
      qb.where('sku.product_id = :productId', { productId });
    }

    return qb.getMany();
  }

  async findOne(id: number): Promise<ProductSkus> {
    const sku = await this.skuRepo.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!sku) throw new NotFoundException('Product SKU not found');
    return sku;
  }

  async update(id: number, dto: UpdateProductSkusDto): Promise<ProductSkus> {
    const sku = await this.findOne(id);

    // change product
    if (dto.productId) {
      const product = await this.productRepo.findOne({
        where: { id: dto.productId },
      });

      if (!product) throw new NotFoundException('Product not found');
      sku.product = product;
    }

    if (dto.skuCode !== undefined) sku.skuCode = dto.skuCode;
    if (dto.barcode !== undefined) sku.barcode = dto.barcode;
    if (dto.price !== undefined) sku.price = dto.price.toString();
    if (dto.compareAtPrice !== undefined)
      sku.compareAtPrice = dto.compareAtPrice?.toString() ?? null;
    if (dto.stockQty !== undefined) sku.stockQty = dto.stockQty;
    if (dto.weight !== undefined) sku.weight = dto.weight.toString();
    if (dto.imageUrl !== undefined) sku.imageUrl = dto.imageUrl;
    if (dto.isActive !== undefined) sku.isActive = dto.isActive;

    return this.skuRepo.save(sku);
  }

  async remove(id: number): Promise<void> {
    await this.skuRepo.softDelete(id);
  }
}
