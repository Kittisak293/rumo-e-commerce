import { Test, TestingModule } from '@nestjs/testing';
import { ProductSkuOptionsController } from './product-sku-options.controller';
import { ProductSkuOptionsService } from './product-sku-options.service';

describe('ProductSkuOptionsController', () => {
  let controller: ProductSkuOptionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductSkuOptionsController],
      providers: [ProductSkuOptionsService],
    }).compile();

    controller = module.get<ProductSkuOptionsController>(
      ProductSkuOptionsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
