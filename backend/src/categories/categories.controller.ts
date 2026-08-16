import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { CategoryService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 } from 'uuid';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  @ApiBody({ description: 'ข้อมูลหมวดหมู่', type: CreateCategoryDto })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('imageUrl', {
      storage: diskStorage({
        destination: './uploads/categories',
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
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoryService.create({
      ...createCategoryDto,
      imageUrl: file
        ? '/category-images/' + file.filename
        : '/category-images/unknown.jpg',
    });
  }

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(+id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('imageUrl', {
      storage: diskStorage({
        destination: './uploads/categories',
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
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(+id, {
      ...updateCategoryDto,
      imageUrl: file ? '/category-images/' + file.filename : undefined,
    });
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoryService.remove(+id);
  }
}
