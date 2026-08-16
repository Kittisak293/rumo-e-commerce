import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { StoreType } from 'src/common/enums/store-type.enum';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    findMallProducts: jest.Mock;
    search: jest.Mock;
    searchHomeProducts: jest.Mock;
    searchCategoryProducts: jest.Mock;
  };

  const mockProduct = {
    id: 10,
    name: 'Wireless Earbuds',
    description: 'Noise Cancelling',
    price: 1400,
    stock: 12,
    imageUrl: '/static-images/test.jpg',
    storeType: StoreType.MALL,
    categoryId: 1,
  };

  beforeEach(async () => {
    productsService = {
      create: jest.fn().mockResolvedValue(mockProduct),
      findAll: jest.fn().mockResolvedValue([mockProduct]),
      findOne: jest.fn().mockResolvedValue(mockProduct),
      update: jest.fn().mockResolvedValue({ ...mockProduct, price: 1500 }),
      remove: jest.fn().mockResolvedValue(mockProduct),
      findMallProducts: jest.fn().mockResolvedValue([mockProduct]),
      search: jest.fn().mockResolvedValue([mockProduct]),
      searchHomeProducts: jest.fn().mockResolvedValue([mockProduct]),
      searchCategoryProducts: jest.fn().mockResolvedValue([mockProduct]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: productsService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('returns array of products', async () => {
      const result = await controller.findAll();
      expect(productsService.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockProduct]);
    });
  });

  describe('findOne', () => {
    it('returns product by id', async () => {
      const result = await controller.findOne('10');
      expect(productsService.findOne).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('create', () => {
    it('calls service.create with formatted imageUrl when file is uploaded', async () => {
      const file = {
        filename: 'uuid-123.jpg',
        originalname: 'test.jpg',
      } as Express.Multer.File;

      const dto = {
        name: 'Wireless Earbuds',
        description: 'Noise Cancelling',
        price: 1400,
        stock: 12,
        categoryId: 1,
        storeType: StoreType.MALL,
      };

      await controller.create(file, dto);
      expect(productsService.create).toHaveBeenCalledWith({
        ...dto,
        imageUrl: '/static-images/uuid-123.jpg',
      });
    });

    it('uses fallback unknown.jpg when no file is uploaded', async () => {
      const dto = {
        name: 'Wireless Earbuds',
        description: 'Noise Cancelling',
        price: 1400,
        stock: 12,
        categoryId: 1,
        storeType: StoreType.MALL,
      };

      await controller.create(null as unknown as Express.Multer.File, dto);
      expect(productsService.create).toHaveBeenCalledWith({
        ...dto,
        imageUrl: '/static-images/unknown.jpg',
      });
    });
  });

  describe('update', () => {
    it('calls service.update with imageUrl if file is uploaded', async () => {
      const file = {
        filename: 'new-uuid.jpg',
      } as Express.Multer.File;

      const updateDto = {
        price: 1500,
      };

      await controller.update('10', file, updateDto);
      expect(productsService.update).toHaveBeenCalledWith(10, {
        ...updateDto,
        imageUrl: '/static-images/new-uuid.jpg',
      });
    });

    it('calls service.update with undefined imageUrl if no file is uploaded', async () => {
      const updateDto = {
        price: 1500,
      };

      await controller.update(
        '10',
        null as unknown as Express.Multer.File,
        updateDto,
      );
      expect(productsService.update).toHaveBeenCalledWith(10, {
        ...updateDto,
        imageUrl: undefined,
      });
    });
  });

  describe('remove', () => {
    it('calls service.remove with parsed number id', async () => {
      await controller.remove('10');
      expect(productsService.remove).toHaveBeenCalledWith(10);
    });
  });
});
