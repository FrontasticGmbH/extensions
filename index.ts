import {
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
import { CategoryRouter } from './utils/CategoryRouter';
import { Result } from '../types/product/Result';
import { SearchRouter } from './utils/SearchRouter';
import { Product } from '../types/product/Product';
import { getPath, getLocale } from './utils/Request';

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

    const staticPageMatch = getPath(request)?.match(/^\/(cart|checkout|wishlist|account|login|register|thank-you)/);
    if (staticPageMatch) {

      return {
        dynamicPageType: `frontastic${staticPageMatch[0]}`,
        dataSourcePayload: {
          cart: {
            sum: 12340,
          }
        },
        pageMatchingPayload: {
          cart: {
            sum: 12340,
          }
        },
      };
    }    

    if (CategoryRouter.identifyFrom(request)) {
      return CategoryRouter.loadFor(request, context.frontasticContext).then((result: Result) => {
        if (result) {
          return {
            dynamicPageType: 'frontastic/category',
            dataSourcePayload: {
              products: result.items,
              previousCursor: result.previousCursor,
              nextCursor: result.nextCursor,
              category: getPath(request),
            },
            pageMatchingPayload: {
              products: result.items,
              previousCursor: result.previousCursor,
              nextCursor: result.nextCursor,
              category: getPath(request),
            },
          };
        }

        // FIXME: Return proper error result
        return null;
      });
    }

    // **************************
    // Docs examples
    // **************************
    const starWarsUrlMatches = getPath(request)?.match(new RegExp('/movie/([^ /]+)/([^ /]+)'));
    if (starWarsUrlMatches) {
      return await loadMovieData(starWarsUrlMatches[2]).then(
        (result: MovieData | null): DynamicPageSuccessResult | DynamicPageRedirectResult | null => {
          if (result === null) {
            return null;
          }

          if (getPath(request) !== result._url) {
            console.log(getPath(request), result._url, getPath(request) !== result._url);
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
        },
      );
    }

    return null;
  },
  'data-sources': {
    // **************************
    // Commercetools integration
    // **************************
    'frontastic/product-list': async (config: DataSourceConfiguration, context: DataSourceContext) => {
      const productApi = new ProductApi(context.frontasticContext, context.request ? getLocale(context.request) : null);

      const productQuery = ProductQueryFactory.queryFromParams(context?.request, config);

      return await productApi.query(productQuery).then((queryResult) => {
        return {
          dataSourcePayload: queryResult,
        };
      });
    },

    // **************************
    // Commercetools integration
    // **************************
    'frontastic/product': async (config: DataSourceConfiguration, context: DataSourceContext) => {
      const productApi = new ProductApi(context.frontasticContext, context.request ? getLocale(context.request) : null);
      
      const productQuery = ProductQueryFactory.queryFromParams(context?.request, config);

      return await productApi.getProduct(productQuery).then((queryResult) => {
        return {
          dataSourcePayload: queryResult,
        };
      });
    },

    'frontastic/empty': () => {
      return {
        dataSourcePayload: {}
      }
    },

    // **************************
    // Docs examples
    // **************************
    'example/star-wars/movie': async (config: DataSourceConfiguration): Promise<DataSourceResult> => {
      return await axios
        .post<DataSourceResult>('https://frontastic-swapi-graphql.netlify.app', {
          query: '{film(id:"' + config.configuration.movieId + '") {id, title, episodeID, openingCrawl, releaseDate}}',
        })
        .then((response): DataSourceResult => {
          return {
            dataSourcePayload: response.data,
          } as DataSourceResult;
        })
        .catch((reason) => {
          return {
            dataSourcePayload: {
              ok: false,
              error: reason?.toString(),
            },
          } as DataSourceResult;
        });
    },
    'example/star-wars/character-search': (config: DataSourceConfiguration): DataSourceResult => {
      console.log(config.configuration);
      return {
        dataSourcePayload: config.configuration,
      };
    },
    'example/star-wars/character-filter': async (
      config: DataSourceConfiguration,
      context: DataSourceContext,
    ): Promise<DataSourceResult> => {
      const pageSize = context.request.query.pageSize || 10;
      const after = context.request.query.cursor || null;
      const { characterFilters } = config.configuration;
      const filters = characterFilters.filters.map((filter: any) => {
        let value = characterFilters.values[filter.field];
        if (typeof value !== 'number') {
          value = `"${value}"`;
        }
        return `${filter.field}: ${value}`;
      });
      return await axios
        .post('https://frontastic-swapi-graphql.netlify.app/', {
          query: `{
            allPeople(first: ${pageSize}, after: ${JSON.stringify(after)}, ${filters}) {
              totalCount
              pageInfo {
                hasNextPage
                endCursor
              }
              people {
                id
                name
                height
                hairColor
                eyeColor
                gender
                species {
                  name
                }
              }
            }
          }`,
        })
        .then((response): DataSourceResult => {
          return {
            dataSourcePayload: response.data?.data?.allPeople || {},
          } as DataSourceResult;
        })
        .catch((reason) => {
          return {
            dataSourcePayload: {
              ok: false,
              error: reason?.toString(),
            },
          } as DataSourceResult;
        });
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
      character: async (request: Request): Promise<Response> => {
        if (!request.query.search) {
          return {
            body: 'Missing search query',
            statusCode: 400,
          };
        }
        return await axios
          .post('https://frontastic-swapi-graphql.netlify.app/', {
            query: `{
            allPeople(name: "${request.query.search}") {
              totalCount
              pageInfo {
                hasNextPage
                endCursor
              }
              people {
                id
                name
                height
                mass
                hairColor
                skinColor
                eyeColor
                birthYear
                gender
                species {
                  name
                }
              }
            }
          }`,
          })
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
      filters: async (): Promise<Response> => {
        return await axios
          .post('https://frontastic-swapi-graphql.netlify.app/', {
            query: `{
            getAllPossiblePeopleFilters {
              filter {
                name
                type
                values
              }
          }}`,
          })
          .then((response) => {
            const { filter } = response.data?.data?.getAllPossiblePeopleFilters;
            const responseData = filter.map((filter: any) => {
              return {
                field: filter.name,
                label: filter.name,
                type: filter.type,
                translatable: false,
                values: filter.values?.map((val: string) => {
                  return { name: val, value: val };
                }),
              };
            });
            return {
              body: JSON.stringify(responseData),
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
    },
  },
};
