import { Request, Response } from '@frontastic/extension-types/src/ts/index';
import { ProductApi } from '../../commercetools/ProductApi';
import { ActionContext } from '@frontastic/extension-types';
import { ProductQueryFactory } from '../../utils/ProductQueryFactory';
import { ProductQuery } from '../../../types/query/ProductQuery';

type ActionHook = (request: Request, actionContext: ActionContext) => Promise<Response>;

export const getProduct: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const productApi = new ProductApi(actionContext.frontasticContext, request.query.locale);

  let productQuery: ProductQuery = {};

  if ('id' in request.query) {
    productQuery = {
      productIds: [request.query['id']],
    };
  }

  if ('sku' in request.query) {
    productQuery = {
      skus: [request.query['sku']],
    };
  }

  const product = await productApi.getProduct(productQuery);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(product),
    sessionData: request.sessionData,
  };

  return response;
};

export const query: ActionHook = async (request: Request, actionContext: ActionContext) => {
  const productApi = new ProductApi(actionContext.frontasticContext, request.query.locale);

  const productQuery = ProductQueryFactory.queryFromParams(request);

  const queryResult = await productApi.query(productQuery);

  const response: Response = {
    statusCode: 200,
    body: JSON.stringify(queryResult),
    sessionData: request.sessionData,
  };

  return response;
};
