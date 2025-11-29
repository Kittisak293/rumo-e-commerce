import { Test, TestingModule } from '@nestjs/testing';
import { ProductSkuOptionsService } from './product-sku-options.service';

describe('ProductSkuOptionsService', () => {
  let service: ProductSkuOptionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductSkuOptionsService],
    }).compile();

    service = module.get<ProductSkuOptionsService>(ProductSkuOptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
