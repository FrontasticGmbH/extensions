import { Product } from '../../types/product/Product';
import { Context, Request } from '@frontastic/extension-types';
import { ProductApi } from '../commercetools/ProductApi';
import { CategoryQuery } from '../../types/query/CategoryQuery';
import { Category } from '../../types/product/Category';
import { ProductQuery } from '../../types/query/ProductQuery';

export class CategoryRouter {
  static identifyFrom(request: Request) {
    if (request.query.path.match(/.+/)) {
      return true;
    }

    return false;
  }

  static loadFor = async (request: Request, frontasticContext: Context): Promise<Product[]> => {
    const productApi = new ProductApi(frontasticContext, request.query.locale);
    const urlMatches = request.query.path.match(/.+/);

    if (this.identifyFrom(request)) {
      const categoryQuery: CategoryQuery = {
        slug: urlMatches[1],
      };

      const categoryQueryResult = await productApi.queryCategories(categoryQuery)
      const category = (categoryQueryResult.items[0] as Category).categoryId
      const productQuery: ProductQuery = {
        category,
      }

      return (await productApi.query(productQuery)).items as Product[]
    }

    return null;
  };
}
