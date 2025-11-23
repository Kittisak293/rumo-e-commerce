import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Brackets, Repository } from 'typeorm';
import { Category } from 'src/categories/entities/category.entity';
import { StoreType } from 'src/common/enums/store-type.enum';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async create(
    createProductDto: CreateProductDto & { imageUrl: string },
  ): Promise<Product> {
    const product = this.productsRepository.create({ ...createProductDto });
    const category = await this.categoriesRepository.findOneByOrFail({
      id: createProductDto.categoryId,
    });
    product.category = category;
    product.ratingAvg = 0;
    product.ratingCount = 0;
    product.soldCount = 0;
    return await this.productsRepository.save(product);
  }

  async findAll() {
    return await this.productsRepository.find();
  }

  async findOne(id: number): Promise<Product> {
    return await this.productsRepository.findOneOrFail({ where: { id: id } });
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto & { imageUrl?: string },
  ): Promise<Product> {
    const product = this.productsRepository.create(updateProductDto);
    const category = await this.categoriesRepository.findOneByOrFail({
      id: updateProductDto.categoryId,
    });
    product.category = category;
    await this.productsRepository.update(id, product);
    return await this.productsRepository.findOneOrFail({ where: { id: id } });
  }

  async remove(id: number) {
    const product = await this.productsRepository.findOne({
      where: { id: id },
    });
    await this.productsRepository.softDelete(id);
    return product;
  }

  async findMallProducts() {
    return await this.productsRepository.find({
      where: { storeType: StoreType.MALL },
    });
  }

  async search(filters: {
    q: string;
    sortBy?: string;
    storeType?: 'mall' | 'seller';
    priceMin?: number;
    priceMax?: number;
    ratingMin?: number;
  }) {
    const qb = this.productsRepository.createQueryBuilder('p');

    // ค้นหา
    qb.where(
      new Brackets((qb1) => {
        qb1
          .where('LOWER(p.name) LIKE LOWER(:q)', { q: `%${filters.q}%` })
          .orWhere('LOWER(p.description) LIKE LOWER(:q)', {
            q: `%${filters.q}%`,
          });
      }),
    );

    // ประเภทร้าน
    if (filters.storeType) {
      qb.andWhere('p.storeType = :storeType', { storeType: filters.storeType });
    }

    // ราคา
    if (filters.priceMin !== null && filters.priceMin !== undefined) {
      qb.andWhere('p.price >= :min', { min: filters.priceMin });
    }

    if (filters.priceMax !== null && filters.priceMax !== undefined) {
      qb.andWhere('p.price <= :max', { max: filters.priceMax });
    }

    // คะแนน
    if (filters.ratingMin !== null && filters.ratingMin !== undefined) {
      qb.andWhere('p.ratingAvg >= :rating', { rating: filters.ratingMin });
    }

    // จัดเรียง
    switch (filters.sortBy) {
      case 'popular':
        qb.orderBy('p.sold', 'DESC');
        break;
      case 'latest':
        qb.orderBy('p.createdAt', 'DESC');
        break;
      case 'priceAsc':
        qb.orderBy('p.price', 'ASC');
        break;
      case 'priceDesc':
        qb.orderBy('p.price', 'DESC');
        break;
      default:
        qb.orderBy('p.id', 'DESC');
    }
    return qb.getMany();
  }

  async searchHomeProducts(filters: {
    sortBy?: string;
    storeType?: 'mall' | 'seller';
    priceMin?: number;
    priceMax?: number;
    ratingMin?: number;
  }) {
    const qb = this.productsRepository.createQueryBuilder('p');
    // ประเภทร้าน
    if (filters.storeType) {
      qb.andWhere('p.storeType = :storeType', { storeType: filters.storeType });
    }

    // ราคา
    if (filters.priceMin !== null && filters.priceMin !== undefined) {
      qb.andWhere('p.price >= :min', { min: filters.priceMin });
    }

    if (filters.priceMax !== null && filters.priceMax !== undefined) {
      qb.andWhere('p.price <= :max', { max: filters.priceMax });
    }

    // คะแนน
    if (filters.ratingMin !== null && filters.ratingMin !== undefined) {
      qb.andWhere('p.ratingAvg >= :rating', { rating: filters.ratingMin });
    }

    // จัดเรียง
    switch (filters.sortBy) {
      case 'popular':
        qb.orderBy('p.sold', 'DESC');
        break;
      case 'latest':
        qb.orderBy('p.createdAt', 'DESC');
        break;
      case 'priceAsc':
        qb.orderBy('p.price', 'ASC');
        break;
      case 'priceDesc':
        qb.orderBy('p.price', 'DESC');
        break;
      default:
        qb.orderBy('p.id', 'DESC');
    }
    return qb.getMany();
  }
}
