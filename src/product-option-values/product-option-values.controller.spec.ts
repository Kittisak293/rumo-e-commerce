import { Test, TestingModule } from '@nestjs/testing';
import { ProductOptionValuesController } from './product-option-values.controller';
import { ProductOptionValuesService } from './product-option-values.service';

describe('ProductOptionValuesController', () => {
  let controller: ProductOptionValuesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductOptionValuesController],
      providers: [ProductOptionValuesService],
    }).compile();

    controller = module.get<ProductOptionValuesController>(ProductOptionValuesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
