import { Test, TestingModule } from '@nestjs/testing';
import { ProductOptionValuesService } from './product-option-values.service';

describe('ProductOptionValuesService', () => {
  let service: ProductOptionValuesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductOptionValuesService],
    }).compile();

    service = module.get<ProductOptionValuesService>(
      ProductOptionValuesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
