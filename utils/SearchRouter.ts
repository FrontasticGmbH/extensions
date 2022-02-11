import { Context, Request } from '@frontastic/extension-types';

import { ProductQueryFactory } from './ProductQueryFactory';
import { Result } from '../../types/product/Result';
import { ProductApi } from '../commercetools/ProductApi';

export class SearchRouter {
  static identifyFrom(request: Request) {
    const urlMatches = request.query.path.match(/\/search/);

    if (urlMatches) {
      return true;
    }

    return false;
  }

  static loadFor = async (request: Request, frontasticContext: Context): Promise<Result> | null => {
    const productApi = new ProductApi(frontasticContext, request.query.locale);

    const urlMatches = request.query.path.match(/\/search/);

    if (urlMatches) {
      const productQuery = ProductQueryFactory.queryFromParams({
        ...request,
        query: { ...request.query, query: request.query.query || request.query.q },
      });

      return productApi.query(productQuery);
    }

    return null;
  };
}
