import { Product } from '../../types/product/Product';
import { Context, Request } from '@frontastic/extension-types';
import { ProductQuery } from '../../types/query/ProductQuery';
import { ProductApi } from '../commercetools/ProductApi';
import { LineItem } from '../../types/cart/LineItem';

export class ProductRouter {
  private static isProduct(product: Product | LineItem): product is Product {
    return (product as Product).productId !== undefined;
  }

  static generateUrlFor(item: Product | LineItem) {
    if (ProductRouter.isProduct(item)) {
      return `/${item.slug}/p/${item.variants[0].sku}`;
    }
    return `/slug/p/${item.variant.sku}`;
  }

  static identifyFrom(request: Request) {
    if (request.query.path.match(/\/p\/([^\/]+)/)) {
      return true;
    }

    return false;
  }

  static loadFor = async (request: Request, frontasticContext: Context): Promise<Product> => {
    const productApi = new ProductApi(frontasticContext, request.query.locale);

    const urlMatches = request.query.path.match(/\/p\/([^\/]+)/);

    if (urlMatches) {
      const productQuery: ProductQuery = {
        skus: [urlMatches[1]],
      };
      return productApi.getProduct(productQuery);
    }

    return null;
  };
}
