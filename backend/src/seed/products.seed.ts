/**
 * Seeds the product catalog with placeholder images so pages have something
 * to render before real product photography exists.
 *
 *   npm run seed:products                    # backfill + 24 new mock products
 *   npm run seed:products -- --count=100      # backfill + 100 new mock products
 *   npm run seed:products -- --count=0        # backfill only, no new products
 *   npm run seed:products -- --no-backfill    # skip the unknown.jpg backfill
 *
 * Placeholder images come from picsum.photos — `ProductImage.imageUrl` and
 * `Product.imageUrl` are plain string columns (see product.entity.ts /
 * product-image.entity.ts), so no file upload is needed, just a URL.
 *
 * Runs through `createApplicationContext` rather than a standalone DataSource
 * so it picks up exactly the same env/DB config as the app (see app.module.ts),
 * same pattern as shipping.seed.ts.
 */
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { ProductOption } from '../product-options/entities/product-option.entity';
import { ProductOptionValue } from '../product-option-values/entities/product-option-value.entity';
import { ProductSku } from '../product-skus/entities/product-sku.entity';
import { ProductSkuOptionValue } from '../product-sku-option-values/entities/product-sku-option-value.entity';
import { ProductImage } from '../product-images/entities/product-image.entity';
import { StoreType } from '../common/enums/store-type.enum';

const logger = new Logger('ProductsSeed');

const DEFAULT_PRODUCT_IMAGE = '/product-images/unknown.jpg';

function placeholderImage(seed: string, size = 600): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${size}/${size}`;
}

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-');
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function cartesian<T>(groups: T[][]): T[][] {
  return groups.reduce<T[][]>(
    (acc, group) =>
      acc.flatMap((combo) => group.map((item) => [...combo, item])),
    [[]],
  );
}

interface OptionValueSpec {
  value: string;
  valueCode: string;
}
interface OptionSpec {
  name: string;
  displayName: string;
  values: OptionValueSpec[];
}

const SIZE_OPTION: OptionSpec = {
  name: 'size',
  displayName: 'ไซส์',
  values: [
    { value: 'S', valueCode: 'S' },
    { value: 'M', valueCode: 'M' },
    { value: 'L', valueCode: 'L' },
    { value: 'XL', valueCode: 'XL' },
  ],
};

const COLOR_OPTION: OptionSpec = {
  name: 'color',
  displayName: 'สี',
  values: [
    { value: 'ดำ', valueCode: 'black' },
    { value: 'ขาว', valueCode: 'white' },
    { value: 'แดง', valueCode: 'red' },
    { value: 'น้ำเงิน', valueCode: 'navy' },
  ],
};

interface CategorySpec {
  name: string;
  productNames: string[];
  optionSpecs: OptionSpec[];
}

const CATEGORY_SPECS: CategorySpec[] = [
  {
    name: 'เสื้อผ้าแฟชั่น',
    productNames: [
      'เสื้อยืดคอกลมผ้าคอตตอน',
      'เสื้อเชิ้ตลายสก็อต',
      'กางเกงยีนส์ทรงกระบอก',
      'เดรสลายดอกแขนสั้น',
      'แจ็คเก็ตยีนส์',
      'เสื้อฮู้ดมีซิป',
    ],
    optionSpecs: [COLOR_OPTION, SIZE_OPTION],
  },
  {
    name: 'รองเท้า',
    productNames: [
      'รองเท้าผ้าใบสนีกเกอร์',
      'รองเท้าแตะยางกันลื่น',
      'รองเท้าหนังทางการ',
      'รองเท้าวิ่งพื้นเบา',
    ],
    optionSpecs: [COLOR_OPTION, SIZE_OPTION],
  },
  {
    name: 'กระเป๋า',
    productNames: [
      'กระเป๋าสะพายข้างหนัง PU',
      'กระเป๋าเป้เดินทาง',
      'กระเป๋าคลัตช์ออกงาน',
      'กระเป๋าสตางค์หนังแท้',
    ],
    optionSpecs: [COLOR_OPTION],
  },
  {
    name: 'อุปกรณ์อิเล็กทรอนิกส์',
    productNames: [
      'หูฟังไร้สายตัดเสียงรบกวน',
      'พาวเวอร์แบงค์ 20000mAh',
      'สายชาร์จ USB-C ถัก',
      'ลำโพงบลูทูธพกพา',
      'เมาส์ไร้สายเงียบ',
    ],
    optionSpecs: [],
  },
  {
    name: 'ของใช้ในบ้าน',
    productNames: [
      'แก้วเก็บอุณหภูมิสแตนเลส',
      'ผ้าปูที่นอนไมโครไฟเบอร์',
      'ที่วางของอเนกประสงค์',
      'หมอนรองคอเมมโมรี่โฟม',
    ],
    optionSpecs: [],
  },
  {
    name: 'ความงาม',
    productNames: [
      'ครีมกันแดด SPF50',
      'เซรั่มบำรุงผิวหน้า',
      'ลิปสติกแมทท์',
      'แชมพูสมุนไพร',
    ],
    optionSpecs: [],
  },
  {
    name: 'อาหารและเครื่องดื่ม',
    productNames: ['กาแฟคั่วบด 250g', 'ชาเขียวมัทฉะ', 'ขนมขบเคี้ยวธัญพืช'],
    optionSpecs: [],
  },
  {
    name: 'ของเล่นและงานอดิเรก',
    productNames: ['ตุ๊กตาผ้ากำมะหยี่', 'โมเดลตัวต่อ 3D', 'เกมกระดานครอบครัว'],
    optionSpecs: [],
  },
];

function parseArgs() {
  const countArg = process.argv.find((a) => a.startsWith('--count='));
  const count = countArg ? Number(countArg.split('=')[1]) : 24;
  const skipBackfill = process.argv.includes('--no-backfill');
  return {
    count: Number.isFinite(count) && count >= 0 ? count : 24,
    skipBackfill,
  };
}

async function seedCategories(
  dataSource: DataSource,
): Promise<Array<{ category: Category; spec: CategorySpec }>> {
  const repo = dataSource.getRepository(Category);
  const result: Array<{ category: Category; spec: CategorySpec }> = [];

  for (const spec of CATEGORY_SPECS) {
    const slug = slugify(spec.name);
    let category = await repo.findOne({ where: { slug } });
    if (!category) {
      category = await repo.save(
        repo.create({
          name: spec.name,
          slug,
          imageUrl: placeholderImage(`category-${slug}`),
        }),
      );
      logger.log(`Created category ${spec.name}`);
    }
    result.push({ category, spec });
  }
  return result;
}

/** Points any Product/ProductImage still on the built-in unknown.jpg default at a placeholder. */
async function backfillProductImages(dataSource: DataSource): Promise<void> {
  const productsRepo = dataSource.getRepository(Product);
  const imagesRepo = dataSource.getRepository(ProductImage);

  const stale = await productsRepo.find({
    where: { imageUrl: DEFAULT_PRODUCT_IMAGE },
  });

  for (const product of stale) {
    const url = placeholderImage(`product-${product.id}`);
    product.imageUrl = url;
    await productsRepo.save(product);
    await imagesRepo.save(
      imagesRepo.create({ product, imageUrl: url, index: 0 }),
    );
  }
  logger.log(`Backfilled placeholder images for ${stale.length} product(s)`);
}

async function seedOneProduct(
  dataSource: DataSource,
  category: Category,
  spec: CategorySpec,
  name: string,
  seedTag: string,
): Promise<void> {
  const productsRepo = dataSource.getRepository(Product);
  const optionsRepo = dataSource.getRepository(ProductOption);
  const optionValuesRepo = dataSource.getRepository(ProductOptionValue);
  const skusRepo = dataSource.getRepository(ProductSku);
  const skuOptionValuesRepo = dataSource.getRepository(ProductSkuOptionValue);
  const imagesRepo = dataSource.getRepository(ProductImage);

  const basePrice = randomInt(99, 3990);

  const product = await productsRepo.save(
    productsRepo.create({
      name,
      description: `${name} คุณภาพดี คัดสรรมาเพื่อคุณโดยเฉพาะ เหมาะกับการใช้งานในชีวิตประจำวัน`,
      price: basePrice,
      stock: randomInt(0, 200),
      ratingAvg: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
      ratingCount: randomInt(0, 500),
      soldCount: randomInt(0, 1000),
      imageUrl: placeholderImage(seedTag),
      storeType: Math.random() < 0.3 ? StoreType.MALL : StoreType.SELLER,
      category,
    }),
  );

  const images = await imagesRepo.save(
    [0, 1, 2].map((index) =>
      imagesRepo.create({
        product,
        imageUrl: placeholderImage(`${seedTag}-${index}`),
        index,
      }),
    ),
  );
  product.imageUrl = images[0].imageUrl;
  await productsRepo.save(product);

  if (spec.optionSpecs.length === 0) {
    await skusRepo.save(
      skusRepo.create({
        product,
        skuCode: `${seedTag}-STD`,
        price: basePrice.toFixed(2),
        stockQty: product.stock,
        weight: (Math.random() * 2 + 0.1).toFixed(2),
        imageUrl: images[0].imageUrl,
        isActive: true,
      }),
    );
    return;
  }

  const savedOptions: Array<{
    option: ProductOption;
    values: ProductOptionValue[];
  }> = [];

  for (const [i, optSpec] of spec.optionSpecs.entries()) {
    const option = await optionsRepo.save(
      optionsRepo.create({
        product,
        name: optSpec.name,
        displayName: optSpec.displayName,
        sortOrder: i + 1,
        isRequired: true,
      }),
    );
    const values = await optionValuesRepo.save(
      optSpec.values.map((v, sortOrder) =>
        optionValuesRepo.create({
          productOption: option,
          value: v.value,
          valueCode: v.valueCode,
          extraPrice: null,
          sortOrder,
        }),
      ),
    );
    savedOptions.push({ option, values });
  }

  const combos = cartesian(savedOptions.map((o) => o.values));

  for (const combo of combos) {
    const skuCode = `${seedTag}-${combo.map((v) => v.valueCode).join('-')}`;
    const sku = await skusRepo.save(
      skusRepo.create({
        product,
        skuCode,
        price: basePrice.toFixed(2),
        stockQty: randomInt(0, 100),
        weight: (Math.random() * 2 + 0.1).toFixed(2),
        imageUrl: images[0].imageUrl,
        isActive: true,
      }),
    );
    await skuOptionValuesRepo.save(
      combo.map((productOptionValue) =>
        skuOptionValuesRepo.create({ productSku: sku, productOptionValue }),
      ),
    );
  }
}

async function seedMockProducts(
  dataSource: DataSource,
  count: number,
): Promise<void> {
  if (count === 0) {
    logger.log('--count=0, skipping mock product creation');
    return;
  }

  const categories = await seedCategories(dataSource);
  const startIndex = Date.now();

  for (let i = 0; i < count; i++) {
    const { category, spec } = pick(categories);
    const baseName = pick(spec.productNames);
    const name = `${baseName} รุ่น ${i + 1}`;
    const seedTag = `product-${startIndex}-${i}`;
    await seedOneProduct(dataSource, category, spec, name, seedTag);
  }
  logger.log(`Created ${count} mock product(s)`);
}

async function main() {
  const { count, skipBackfill } = parseArgs();
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const dataSource = app.get(DataSource);
    if (!skipBackfill) {
      await backfillProductImages(dataSource);
    }
    await seedMockProducts(dataSource, count);
  } finally {
    await app.close();
  }
}

void main().catch((err) => {
  logger.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
