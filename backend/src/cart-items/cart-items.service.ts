import { Injectable } from '@nestjs/common';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CartItem } from './entities/cart-item.entity';
import { User } from 'src/users/entities/user.entity';
import { Product } from 'src/products/entities/product.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CartItemService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartItemsRepository: Repository<CartItem>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async create(createCartItemDto: CreateCartItemDto) {
    const user = await this.usersRepository.findOneByOrFail({
      id: createCartItemDto.userId,
    });

    const product = await this.productsRepository.findOneByOrFail({
      id: createCartItemDto.productId,
    });

    const existingItem = await this.cartItemsRepository.findOne({
      where: {
        user: { id: user.id },
        product: { id: product.id },
      },
      relations: ['product', 'user'],
    });

    if (existingItem) {
      existingItem.quantity += createCartItemDto.quantity;
      return this.cartItemsRepository.save(existingItem);
    }

    const item = this.cartItemsRepository.create({
      ...createCartItemDto,
      user,
      product,
    });

    return await this.cartItemsRepository.save(item);
  }

  async findByUserId(userId: number): Promise<CartItem[]> {
    return await this.cartItemsRepository.find({
      where: { user: { id: userId } },
      relations: ['product', 'user'],
    });
  }

  async findAll() {
    return await this.cartItemsRepository.find();
  }

  async findOne(id: number) {
    return await this.cartItemsRepository.findOne({ where: { id: id } });
  }

  async update(id: number, updateCartItemDto: UpdateCartItemDto) {
    const item = await this.cartItemsRepository.findOneByOrFail({ id });

    item.quantity = updateCartItemDto.quantity ?? item.quantity;
    item.price = updateCartItemDto.price ?? item.price;

    return await this.cartItemsRepository.save(item);
  }

  async remove(id: number) {
    const item = await this.cartItemsRepository.findOneByOrFail({ id });
    await this.cartItemsRepository.softDelete(id);
    return item;
  }
}
