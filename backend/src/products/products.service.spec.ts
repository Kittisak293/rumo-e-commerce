import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { Category } from 'src/categories/entities/category.entity';
import { StoreType } from 'src/common/enums/store-type.enum';

describe('ProductsService', () => {
  let service: ProductsService;
  let productsRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOneOrFail: jest.Mock;
    softDelete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let categoriesRepo: {
    findOneByOrFail: jest.Mock;
  };

  const mockCategory: Category = {
    id: 1,
    name: 'Electronics',
    products: [],
  };

  const mockProduct: Product = {
    id: 10,
    name: 'Test Product',
    description: 'Test Description',
    price: 1000,
    stock: 20,
    imageUrl: '/static-images/test.jpg',
    storeType: StoreType.MALL,
    ratingAvg: 0,
    ratingCount: 0,
    soldCount: 0,
    category: mockCategory,
    cartItems: [],
    orderItems: [],
    productImages: [],
    productOptions: [],
    productSkus: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    productsRepo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto })),
      save: jest.fn().mockImplementation((prod) => Promise.resolve(prod)),
      find: jest.fn().mockResolvedValue([mockProduct]),
      findOneOrFail: jest.fn().mockResolvedValue({ ...mockProduct }),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn(),
    };

    categoriesRepo = {
      findOneByOrFail: jest.fn().mockResolvedValue(mockCategory),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: productsRepo,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: categoriesRepo,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates product with category relation and default rating/sales', async () => {
      const dto = {
        name: 'New Item',
        description: 'New Desc',
        price: 500,
        stock: 15,
        categoryId: 1,
        storeType: StoreType.MALL,
        imageUrl: '/static-images/test.png',
      };

      const res = await service.create(dto);
      expect(productsRepo.create).toHaveBeenCalled();
      expect(categoriesRepo.findOneByOrFail).toHaveBeenCalledWith({ id: 1 });
      expect(productsRepo.save).toHaveBeenCalled();
      expect(res.category).toEqual(mockCategory);
      expect(res.ratingAvg).toBe(0);
      expect(res.soldCount).toBe(0);
    });
  });

  describe('findAll', () => {
    it('returns all products sorted by id DESC with category relation', async () => {
      const res = await service.findAll();
      expect(productsRepo.find).toHaveBeenCalledWith({
        relations: ['category'],
        order: { id: 'DESC' },
      });
      expect(res).toEqual([mockProduct]);
    });
  });

  describe('findOne', () => {
    it('returns single product by id with category relation', async () => {
      const res = await service.findOne(10);
      expect(productsRepo.findOneOrFail).toHaveBeenCalledWith({
        where: { id: 10 },
        relations: ['category'],
      });
      expect(res.name).toBe(mockProduct.name);
    });
  });

  describe('update', () => {
    it('finds existing entity, updates changed fields, and saves', async () => {
      const updateDto = {
        name: 'Updated Name',
        price: 1200,
        stock: 5,
      };

      const res = await service.update(10, updateDto);
      expect(productsRepo.findOneOrFail).toHaveBeenCalledWith({
        where: { id: 10 },
        relations: ['category'],
      });
      expect(res.name).toBe('Updated Name');
      expect(res.price).toBe(1200);
      expect(res.stock).toBe(5);
      expect(productsRepo.save).toHaveBeenCalled();
    });

    it('updates category relation when categoryId is provided', async () => {
      const newCategory = { id: 2, name: 'Fashion', products: [] };
      categoriesRepo.findOneByOrFail.mockResolvedValue(newCategory);

      const res = await service.update(10, { categoryId: 2 });
      expect(categoriesRepo.findOneByOrFail).toHaveBeenCalledWith({ id: 2 });
      expect(res.category).toEqual(newCategory);
      expect(productsRepo.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('performs softDelete on product and returns existing product', async () => {
      const res = await service.remove(10);
      expect(productsRepo.findOneOrFail).toHaveBeenCalledWith({
        where: { id: 10 },
        relations: ['category'],
      });
      expect(productsRepo.softDelete).toHaveBeenCalledWith(10);
      expect(res.id).toBe(10);
    });
  });
});
