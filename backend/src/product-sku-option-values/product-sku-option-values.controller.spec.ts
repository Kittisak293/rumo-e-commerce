import { Test, TestingModule } from '@nestjs/testing';
import { ProductSkuOptionValuesController } from './product-sku-option-values.controller';
import { ProductSkuOptionValuesService } from './product-sku-option-values.service';

describe('ProductSkuOptionsController', () => {
  let controller: ProductSkuOptionValuesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductSkuOptionValuesController],
      providers: [ProductSkuOptionValuesService],
    }).compile();

    controller = module.get<ProductSkuOptionValuesController>(
      ProductSkuOptionValuesController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
