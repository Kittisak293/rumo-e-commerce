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
  category: Category;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  imageUrl: string;
}

export interface ProductImage {
  id: number;
  imageUrl: string;
  productId: number;
  index: number;
  storeType: 'mall' | 'seller';
}

export interface ProductOption {
  id: number;
  name: string;
  displayName: string;
  sortOrder: number;
  isRequired: boolean;
}

export interface ProductOptionValue {
  id: number;
  value: string;
  valueCode: string;
  extraPrice: string | null;
  sortOrder: number;
}

// --- auth ------------------------------------------------------------------

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  age: number | null;
  emailVerified: boolean;
}

/** Which flow an in-flight otpToken belongs to. Mirrors the backend `typ` claim. */
export type OtpPurpose = 'login' | 'verifyEmail' | 'passwordReset';

/** Shape returned by login / register / forgot-password / the resend endpoints. */
export interface OtpChallengeResponse {
  otpToken: string;
  expiresIn: number;
  /** Server-masked destination address, e.g. `us**@example.com`. */
  email: string;
}

export interface VerifyOtpResponse {
  user: AuthUser;
  access_token: string;
}
