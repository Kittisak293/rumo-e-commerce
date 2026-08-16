import { ConflictException, Injectable } from '@nestjs/common';
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

  // `slug` is unique in the DB and derived 1:1 from `name` at creation time,
  // so a duplicate name would fail on save anyway — checked up front instead
  // so the admin form can show a field-level error rather than a raw 500.
  private async assertNameAvailable(
    name: string,
    excludeId?: number,
  ): Promise<void> {
    const existing = await this.categoriesRepository.findOne({
      where: { name },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('ชื่อหมวดหมู่นี้มีอยู่แล้ว');
    }
  }

  // Thai (or any non-Latin) names have no ASCII form to fall back on, so the
  // slug can come out empty after stripping — in that case fall back to
  // "category" and let ensureUniqueSlug's numeric suffix disambiguate it.
  private slugify(name: string): string {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return base || 'category';
  }

  private async ensureUniqueSlug(
    base: string,
    excludeId?: number,
  ): Promise<string> {
    let slug = base;
    let suffix = 2;
    for (;;) {
      const existing = await this.categoriesRepository.findOne({
        where: { slug },
      });
      if (!existing || existing.id === excludeId) return slug;
      slug = `${base}-${suffix++}`;
    }
  }

  async create(
    createCategoryDto: CreateCategoryDto & { imageUrl: string },
  ): Promise<Category> {
    await this.assertNameAvailable(createCategoryDto.name);

    const category = this.categoriesRepository.create(createCategoryDto);
    category.slug = await this.ensureUniqueSlug(this.slugify(category.name));

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

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto & { imageUrl?: string },
  ): Promise<Category> {
    if (updateCategoryDto.name) {
      await this.assertNameAvailable(updateCategoryDto.name, id);
    }
    // `slug` is intentionally dropped even if the client sends one — it's
    // frozen after creation so existing category links keep working.
    const rest = { ...updateCategoryDto };
    delete rest.slug;
    await this.categoriesRepository.update(id, rest);
    return await this.categoriesRepository.findOneOrFail({
      where: { id: id },
    });
  }

  async remove(id: number) {
    const category = await this.categoriesRepository.findOne({
      where: { id: id },
    });
    await this.categoriesRepository.softDelete(id);
    return category;
  }
}
