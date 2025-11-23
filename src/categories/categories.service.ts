import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto & { imageUrl: string },
  ): Promise<Category> {
    const category = this.categoriesRepository.create(createCategoryDto);

    category.slug = category.name.toLowerCase().trim().replace(/\s+/g, '-');

    return await this.categoriesRepository.save(category);
  }

  async findAll() {
    return await this.categoriesRepository.find();
  }

  async findOne(id: number) {
    return await this.categoriesRepository.findOne({
      where: { id: id },
    });
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    await this.categoriesRepository.update(id, updateCategoryDto);
    return await this.categoriesRepository.findOne({ where: { id: id } });
  }

  async remove(id: number) {
    const category = await this.categoriesRepository.findOne({
      where: { id: id },
    });
    await this.categoriesRepository.softDelete(id);
    return category;
  }
}
