import { Module } from '@nestjs/common';
import { CategoryService } from './categories.service';
import { CategoryController } from './categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/products/entities/product.entity';
import { Category } from './entities/category.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Product]), AuthModule],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
