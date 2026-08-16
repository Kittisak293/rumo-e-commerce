import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
  UseGuards,
  ParseFloatPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { extname } from 'path';
import { v4 } from 'uuid';
import { diskStorage } from 'multer';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  @ApiBody({ description: 'ข้อมูลสินค้า', type: CreateProductDto })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('imageUrl', {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (req, file, callback) => {
          const uniqueFileName = v4() + extname(file.originalname);
          callback(null, uniqueFileName);
        },
      }),
    }),
  )
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productsService.create({
      ...createProductDto,
      imageUrl: file
        ? '/static-images/' + file.filename
        : '/static-images/unknown.jpg',
    });
  }

  @Get('mall')
  findMallProducts() {
    return this.productsService.findMallProducts();
  }

  @Get('search')
  search(
    @Query('q') q: string,
    @Query('sortBy') sortBy?: string,
    @Query('storeType') storeType?: 'mall' | 'seller',
    @Query('priceMin', new ParseFloatPipe({ optional: true })) priceMin?: number,
    @Query('priceMax', new ParseFloatPipe({ optional: true })) priceMax?: number,
    @Query('ratingMin', new ParseFloatPipe({ optional: true })) ratingMin?: number,
  ) {
    return this.productsService.search({
      q,
      sortBy,
      storeType,
      priceMin,
      priceMax,
      ratingMin,
    });
  }

  @Get('home')
  searchHomeProducts(
    @Query('sortBy') sortBy?: string,
    @Query('storeType') storeType?: 'mall' | 'seller',
    @Query('priceMin', new ParseFloatPipe({ optional: true })) priceMin?: number,
    @Query('priceMax', new ParseFloatPipe({ optional: true })) priceMax?: number,
    @Query('ratingMin', new ParseFloatPipe({ optional: true })) ratingMin?: number,
    @Query('categoryId', new ParseIntPipe({ optional: true })) categoryId?: number,
  ) {
    return this.productsService.searchHomeProducts({
      sortBy,
      storeType,
      priceMin,
      priceMax,
      ratingMin,
      categoryId,
    });
  }

  @Get('category')
  searchCategoryProducts(
    @Query('sortBy') sortBy?: string,
    @Query('storeType') storeType?: 'mall' | 'seller',
    @Query('priceMin', new ParseFloatPipe({ optional: true })) priceMin?: number,
    @Query('priceMax', new ParseFloatPipe({ optional: true })) priceMax?: number,
    @Query('ratingMin', new ParseFloatPipe({ optional: true })) ratingMin?: number,
    @Query('categoryId', new ParseIntPipe({ optional: true })) categoryId?: number,
  ) {
    return this.productsService.searchCategoryProducts({
      sortBy,
      storeType,
      priceMin,
      priceMax,
      ratingMin,
      categoryId,
    });
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  @ApiBody({ description: 'ข้อมูลสินค้า', type: UpdateProductDto })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('imageUrl', {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (req, file, callback) => {
          const uniqueFileName = v4() + extname(file.originalname);
          callback(null, uniqueFileName);
        },
      }),
    }),
  )
  update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(+id, {
      ...updateProductDto,
      imageUrl: file ? '/static-images/' + file.filename : undefined,
    });
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
