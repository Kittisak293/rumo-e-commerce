import { Test, TestingModule } from '@nestjs/testing';
import { ProductSkuOptionValuesService } from './product-sku-option-values.service';

describe('ProductSkuOptionsService', () => {
  let service: ProductSkuOptionValuesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductSkuOptionValuesService],
    }).compile();

    service = module.get<ProductSkuOptionValuesService>(
      ProductSkuOptionValuesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
