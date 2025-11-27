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
import { ProductImagesService } from './product-images.service';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 } from 'uuid';

@Controller('product-images')
export class ProductImagesController {
  constructor(private readonly productImagesService: ProductImagesService) {}

  @Post()
  @ApiBody({ description: 'รูปภาพสินค้า', type: CreateProductImageDto })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('imageUrl', {
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
    @Body() createProductImageDto: CreateProductImageDto,
  ) {
    return this.productImagesService.create({
      ...createProductImageDto,
      imageUrl: file
        ? '/product-images/' + file.filename
        : '/product-images/unknown.jpg',
    });
  }

  @Get()
  findAll() {
    return this.productImagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productImagesService.findOne(+id);
  }

  @Patch(':id')
  @ApiBody({ description: 'รูปภาพสินค้า', type: UpdateProductImageDto })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('imageUrl', {
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
    @Body() updateProductDto: UpdateProductImageDto,
  ) {
    console.log(file);
    return this.productImagesService.update(+id, {
      ...updateProductDto,
      imageUrl: file ? '/product-images/' + file.filename : undefined,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productImagesService.remove(+id);
  }
}
