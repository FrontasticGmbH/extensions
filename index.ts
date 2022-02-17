import {
  ActionContext,
  DataSourceConfiguration,
  DataSourceContext,
  DataSourceResult,
  DynamicPageContext,
  DynamicPageRedirectResult,
  DynamicPageSuccessResult,
  Request,
  Response,
} from '@frontastic/extension-types';

// **************************
// Commercetools integration
// **************************
import { ProductApi } from './commercetools/ProductApi';
import * as AccountActions from './commercetools/actionControllers/AccountController';
import * as ProductActions from './commercetools/actionControllers/ProductController';
import * as CartActions from './commercetools/actionControllers/CartController';
import * as WishlistActions from './commercetools/actionControllers/WishlistController';
import { ProductQueryFactory } from './utils/ProductQueryFactory';

// **************************
// Docs examples
// **************************
import axios from 'axios';
import { loadMovieData, MovieData } from './doc-code/movieData';
import { ProductRouter } from './utils/ProductRouter';
import { Result } from '../types/product/Result';
import { SearchRouter } from './utils/SearchRouter';
import { Product } from '../types/product/Product';

export default {
  'dynamic-page-handler': async (
    request: Request,
    context: DynamicPageContext,
  ): Promise<DynamicPageSuccessResult | DynamicPageRedirectResult | null> => {
    // **************************
    // Commercetools integration
    // **************************

    // Identify Product
    if (ProductRouter.identifyFrom(request)) {
      console.log('Identify Product');
      return ProductRouter.loadFor(request, context.frontasticContext).then((product: Product) => {
        if (product) {
          return {
            dynamicPageType: 'frontastic/product-detail-page',
            dataSourcePayload: {
              product: product,
            },
            pageMatchingPayload: {
              product: product,
            },
          };
        }

        // FIXME: Return proper error result
        return null;
      });
    }

    // Identify Search
    if (SearchRouter.identifyFrom(request)) {
      return SearchRouter.loadFor(request, context.frontasticContext).then((result: Result) => {
        if (result) {
          return {
            dynamicPageType: 'frontastic/search',
            dataSourcePayload: result,
            pageMatchingPayload: {
              query: result.query,
            },
          };
        }

        // FIXME: Return proper error result
        return null;
      });
    }

    const cartUrlMatches = request.query.path.match(/^\/cart/);
    if (cartUrlMatches) {
      console.log('Matched cart page');
      return {
        dynamicPageType: 'frontastic-test/cart',
        dataSourcePayload: {
          cart: {
            sum: 12340,
          },
        },
        pageMatchingPayload: {
          cart: {
            sum: 12340,
          },
        },
      };
    }

    const categoryUrlMatches = request.query.path.match(/^\/category\/([^\/]+)/);
    if (categoryUrlMatches) {
      console.log('Matched category page');
      return {
        dynamicPageType: 'frontastic-test/category',
        dataSourcePayload: {
          items: [
            {
              some: 'thing',
            },
          ],
        },
        pageMatchingPayload: {
          categoryName: 'Foo Bar',
        },
      };
    }

    // **************************
    // Docs examples
    // **************************
    const starWarsUrlMatches = request.query.path.match(new RegExp('/movie/([^ /]+)/([^ /]+)'));
    if (starWarsUrlMatches) {
      return await loadMovieData(starWarsUrlMatches[2]).then((result: MovieData | null):
        | DynamicPageSuccessResult
        | DynamicPageRedirectResult
        | null => {
        if (result === null) {
          return null;
        }

        if (request.query.path !== result._url) {
          console.log(request.query.path, result._url, request.query.path !== result._url);
          return {
            statusCode: 301,
            redirectLocation: result._url,
          } as DynamicPageRedirectResult;
        }

        return {
          dynamicPageType: 'example/star-wars-movie-page',
          dataSourcePayload: result,
          pageMatchingPayload: result,
        } as DynamicPageSuccessResult;
      });
    }

    return null;
  },
  'data-sources': {
    // **************************
    // Commercetools integration
    // **************************
    'frontastic/product-list': async (config: DataSourceConfiguration, context: DataSourceContext) => {
      const productApi = new ProductApi(context.frontasticContext, context?.request.query.locale);

      const productQuery = ProductQueryFactory.queryFromParams(context?.request, config);

      return await productApi.query(productQuery).then((queryResult) => {
        return {
          dataSourcePayload: queryResult,
        };
      });
    },

    // **************************
    // Docs examples
    // **************************
    'example/star-wars-movie': async (
      config: DataSourceConfiguration,
      context: DataSourceContext,
    ): Promise<DataSourceResult> => {
      return await axios
        .post<DataSourceResult>('https://swapi-graphql.netlify.app/.netlify/functions/index', {
          query: '{film(id:"' + config.configuration.movieId + '") {id, title, episodeID, openingCrawl, releaseDate}}',
        })
        .then(
          (response): DataSourceResult => {
            return {
              dataSourcePayload: response.data,
            } as DataSourceResult;
          },
        )
        .catch((reason) => {
          return {
            dataSourcePayload: {
              ok: false,
              error: reason.toString(),
            },
          } as DataSourceResult;
        });
    },
    'example/star-wars-character': (config: DataSourceConfiguration, context: DataSourceContext): DataSourceResult => {
      console.log(config.configuration);
      return {
        dataSourcePayload: config.configuration,
      };
    },
  },
  actions: {
    // **************************
    // Commercetools integration
    // **************************
    account: AccountActions,
    cart: CartActions,
    product: ProductActions,
    wishlist: WishlistActions,

    // **************************
    // Docs examples
    // **************************
    'star-wars': {
      character: async (request: Request, actionContext: ActionContext): Promise<Response> => {
        if (!request.query.search) {
          return {
            body: JSON.stringify([]),
            statusCode: 200,
          };
        }

        return await axios
          .get<Response>('https://swapi.dev/api/people/?search=' + request.query.search)
          .then((response) => {
            return {
              body: JSON.stringify(response.data),
              statusCode: 200,
            };
          })
          .catch((reason) => {
            return {
              body: reason.body,
              statusCode: 500,
            };
          });
      },
      filters: (request: Request, actionContext: ActionContext): Response => {
        return {
          statusCode: 200,
          body: JSON.stringify([
            {
              field: 'textSearch',
              label: 'Text search',
              type: 'text',
              translatable: false,
            },
            {
              field: 'lightSideOnly',
              label: 'Only light side?',
              type: 'boolean',
            },
          ]),
        };
      },
    },
  },
};
