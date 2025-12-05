export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: number;
  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  imageUrl: string;
  storeType: 'mall' | 'seller';
}

export interface Category {
  id: number;
  name: string;
  imageUrl: string;
}

export interface ProductImage {
  id: number;
  imageUrl: string;
  productId: number;
  index: number;
  storeType: 'mall' | 'seller';
}
