import { Result } from '../../types/product/Result';
import { ProductMapper } from './mappers/ProductMapper';
import { ProductQuery } from '../../types/query/ProductQuery';
import { Product } from '../../types/product/Product';
import { BaseApi } from './BaseApi';
import { FilterField, FilterFieldTypes } from '../../types/product/FilterField';
import { FilterTypes } from '../../types/query/Filter';
import { TermFilter } from '../../types/query/TermFilter';
import { RangeFilter } from '../../types/query/RangeFilter';

// TODO: get projectKey form config

export class ProductApi extends BaseApi {
  query: (productQuery: ProductQuery) => Promise<Result> = async (productQuery: ProductQuery) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      // TODO: get default from constant
      const limit = +productQuery.limit || 25;

      // TODO: cache projectSettings
      // const projectSettings = await apiRoot.withProjectKey({ projectKey }).get().execute();
      const filterQuery = [];

      if (productQuery.productIds !== undefined && productQuery.productIds.length !== 0) {
        filterQuery.push(`id:"${productQuery.productIds.join('","')}"`);
      }

      if (productQuery.skus !== undefined && productQuery.skus.length !== 0) {
        filterQuery.push(`variants.sku:"${productQuery.skus.join('","')}"`);
      }

      if (productQuery.filters !== undefined) {
        productQuery.filters.forEach((filter) => {
          switch (filter.type) {
            case FilterTypes.TERM:
              filterQuery.push(`${filter.identifier}.key:"${(filter as TermFilter).terms.join('","')}"`);
              break;
            case FilterTypes.BOOLEAN:
              filterQuery.push(
                `${filter.identifier}:${(filter as TermFilter).terms[0].toString().toLowerCase() === 'true'}`,
              );
              break;
            case FilterTypes.RANGE:
              if (filter.identifier === 'price') {
                filterQuery.push(
                  `variants.${filter.identifier}.centAmount:range (${(filter as RangeFilter).min ?? '*'} to ${
                    (filter as RangeFilter).max ?? '*'
                  })`,
                );
              }
              break;
          }
        });
      }

      // TODO: build methodArgs with type so we could infer the fields
      const methodArgs = {
        queryArgs: {
          limit: limit,
          priceCurrency: locale.currency,
          priceCountry: locale.country,
          'filter.query': filterQuery?.length !== 0 ? filterQuery : undefined,
          [`text.${locale.language}`]: productQuery.query,
        },
      };

      return await this.getApiForProject()
        .productProjections()
        .search()
        .get(methodArgs)
        .execute()
        .then((response) => {
          const items = response.body.results.map((product) =>
            ProductMapper.commercetoolsProductProjectionToProduct(product, locale),
          );

          const result: Result = {
            total: response.body.total,
            items: items,
            count: response.body.count,
            // facets: facets,
            // previousCursor: previousCursor,
            // nextCursor: nextCursor,
            query: productQuery,
          };

          return result;
        })
        .catch((error) => {
          console.log('error:: ', error);
          throw error;
        });
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`query failed. ${error}`);
    }
  };

  getProduct: (productQuery: ProductQuery) => Promise<Product> = async (productQuery: ProductQuery) => {
    try {
      const result = await this.query(productQuery);

      return result.items.shift();
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`getProduct failed. ${error}`);
    }
  };

  getSearchableAttributes: () => Promise<FilterField[]> = async () => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const response = await this.getApiForProject().productTypes().get().execute();

      const filterFields = ProductMapper.commercetoolsProductTypesToFilterFields(response.body.results, locale);

      // Manually add Price filter field since is not included as attributes in CT
      filterFields.push({
        field: 'variants.price',
        type: FilterFieldTypes.NUMBER,
      });

      filterFields.push({
        field: 'variants.scopedPrice.value',
        type: FilterFieldTypes.NUMBER,
      });

      // TODO: verify if we need a new CATEGORY_ID type
      // filterFields.push({
      //   field: 'categories.id',
      //   type: FilterFieldTypes.CATEGORY_ID,
      // });

      return filterFields;
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`getSearchableAttributes failed. ${error}`);
    }
  };
}
