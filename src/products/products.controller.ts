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
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { extname } from 'path';
import { v4 } from 'uuid';
import { diskStorage } from 'multer';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiBody({ description: 'ข้อมูลสินค้า', type: CreateProductDto })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (req, file, callback) => {
          console.log(file);
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
        ? '/product-images/' + file.filename
        : '/product-images/unknown.jpg',
    });
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get('mall')
  findMallProducts() {
    return this.productsService.findMallProducts();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(':id')
  @ApiBody({ description: 'ข้อมูลสินค้า', type: UpdateProductDto })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (req, file, callback) => {
          console.log(file);
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
    console.log(file);
    return this.productsService.update(+id, {
      ...updateProductDto,
      imageUrl: file
        ? '/product-images/' + file.filename
        : '/product-images/unknown.jpg',
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
