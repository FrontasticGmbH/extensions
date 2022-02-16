import {
  CategoryReference,
  ProductProjection,
  TypedMoney,
  ProductVariant,
  Attribute as CommercetoolsAttribute,
  AttributeDefinition as CommercetoolsAttributeDefinition,
  Money as CommercetoolsMoney,
  ProductType as CommercetoolsProductType,
} from '@commercetools/platform-sdk';
import { Product } from '../../../types/product/Product';
import { Variant } from '../../../types/product/Variant';
import { Attributes } from '../../../types/product/Attributes';
import { Category } from '../../../types/product/Category';
import { ProductRouter } from '../../utils/ProductRouter';
import { Locale } from '../Locale';
import { Money } from '../../../types/product/Money';
import { FilterField, FilterFieldTypes, FilterFieldValue } from '../../../types/product/FilterField';
import {
  AttributeEnumType,
  AttributeLocalizedEnumType,
  AttributeSetType,
  AttributeType,
} from '@commercetools/platform-sdk/dist/declarations/src/generated/models/product-type';

const TypeMap = new Map<string, string>([
  ['lenum', FilterFieldTypes.LOCALIZED_ENUM],
  ['ltext', FilterFieldTypes.LOCALIZED_TEXT],
]);

export class ProductMapper {
  static commercetoolsProductProjectionToProduct: (commercetoolsProduct: ProductProjection, locale: Locale) => Product =
    (commercetoolsProduct: ProductProjection, locale: Locale) => {
      const product: Product = {
        productId: commercetoolsProduct.id,
        version: commercetoolsProduct.version.toString(),
        name: commercetoolsProduct.name[locale.language],
        slug: commercetoolsProduct.slug[locale.language],
        categories: ProductMapper.commercetoolsCategoriesToCategories(commercetoolsProduct.categories),
        variants: ProductMapper.commercetoolsProductProjectionToVariants(commercetoolsProduct, locale),
      };

      product._url = ProductRouter.generateUrlFor(product);

      return product;
    };

  static commercetoolsProductProjectionToVariants: (
    commercetoolsProduct: ProductProjection,
    locale: Locale,
  ) => Variant[] = (commercetoolsProduct: ProductProjection, locale: Locale) => {
    const variants: Variant[] = [];

    if (commercetoolsProduct?.masterVariant) {
      variants.push(ProductMapper.commercetoolsProductVariantToVariant(commercetoolsProduct.masterVariant, locale));
    }

    for (let i = 0; i < commercetoolsProduct.variants.length; i++) {
      variants.push(ProductMapper.commercetoolsProductVariantToVariant(commercetoolsProduct.variants[i], locale));
    }

    return variants;
  };

  static commercetoolsProductVariantToVariant: (commercetoolsVariant: ProductVariant, locale: Locale) => Variant = (
    commercetoolsVariant: ProductVariant,
    locale: Locale,
  ) => {
    const attributes = ProductMapper.commercetoolsAttributesToAttributes(commercetoolsVariant.attributes, locale);
    const { price, discountedPrice } = ProductMapper.extractPriceAndDiscountedPrice(commercetoolsVariant);

    return {
      id: commercetoolsVariant.id.toString(),
      sku: commercetoolsVariant.sku.toString(),
      // TODO: should we also include attribute assets as images
      images: commercetoolsVariant.images.map((image) => image.url),
      groupId: attributes?.baseId || undefined,
      attributes: attributes,
      price: price,
      discountedPrice: discountedPrice,
      // discounts?: string[]; // TODO: implement discounts mapping
    } as Variant;
  };

  static commercetoolsAttributesToAttributes: (
    commercetoolsAttributes: CommercetoolsAttribute[],
    locale: Locale,
  ) => Attributes = (commercetoolsAttributes: CommercetoolsAttribute[], locale: Locale) => {
    const attributes: Attributes = {};

    commercetoolsAttributes?.forEach((commercetoolsAttribute) => {
      attributes[commercetoolsAttribute.name] = ProductMapper.extractAttributeValue(
        commercetoolsAttribute.value,
        locale,
      );
    });

    return attributes;
  };

  static commercetoolsCategoriesToCategories: (commercetoolsCategories: CategoryReference[]) => Category[] = (
    commercetoolsCategories: CategoryReference[],
  ) => {
    const categories: Category[] = [];

    commercetoolsCategories.forEach((commercetoolsCategory) => {
      categories.push({
        categoryId: commercetoolsCategory.id,
      } as Category);
    });

    return categories;
  };

  // TODO: fix param type so we can remove ts-ignore tag
  static extractAttributeValue(commercetoolsAttributeValue: unknown, locale: Locale): unknown {
    if (commercetoolsAttributeValue['key'] !== undefined && commercetoolsAttributeValue['label'] !== undefined) {
      return {
        key: commercetoolsAttributeValue['key'],
        label: ProductMapper.extractAttributeValue(commercetoolsAttributeValue['label'], locale),
      };
    }

    if (commercetoolsAttributeValue instanceof Array) {
      return commercetoolsAttributeValue.map((value) => ProductMapper.extractAttributeValue(value, locale));
    }

    return commercetoolsAttributeValue[locale.language] || commercetoolsAttributeValue;
  }

  static extractPriceAndDiscountedPrice(commercetoolsVariant: ProductVariant) {
    let price: Money = undefined;
    let discountedPrice: Money = undefined;

    if (commercetoolsVariant?.scopedPrice) {
      price = ProductMapper.commercetoolsMoneyToMoney(commercetoolsVariant.scopedPrice?.value);
      discountedPrice = ProductMapper.commercetoolsMoneyToMoney(commercetoolsVariant.scopedPrice?.discounted?.value);

      return { price, discountedPrice };
    }

    if (commercetoolsVariant?.price) {
      price = ProductMapper.commercetoolsMoneyToMoney(commercetoolsVariant.price?.value);
      discountedPrice = ProductMapper.commercetoolsMoneyToMoney(commercetoolsVariant.price?.discounted?.value);

      return { price, discountedPrice };
    }

    return { price, discountedPrice };
  }

  static commercetoolsMoneyToMoney(commercetoolsMoney: CommercetoolsMoney | TypedMoney): Money {
    return {
      fractionDigits:
        commercetoolsMoney.hasOwnProperty('fractionDigits') &&
        (commercetoolsMoney as TypedMoney).fractionDigits !== undefined
          ? (commercetoolsMoney as TypedMoney).fractionDigits
          : 2,
      centAmount: commercetoolsMoney.centAmount,
      currencyCode: commercetoolsMoney.currencyCode,
    };
  }

  static commercetoolsProductTypesToFilterFields(
    commercetoolsProductTypes: CommercetoolsProductType[],
    locale: Locale,
  ): FilterField[] {
    const filterFields: FilterField[] = [];

    commercetoolsProductTypes?.forEach((productType) => {
      productType.attributes?.forEach((attribute) => {
        if (!attribute.isSearchable) {
          return;
        }

        filterFields.push(ProductMapper.commercetoolsAttributeDefinitionToFilterField(attribute, locale));
      });
    });

    return filterFields;
  }

  static commercetoolsAttributeDefinitionToFilterField(
    commercetoolsAttributeDefinition: CommercetoolsAttributeDefinition,
    locale: Locale,
  ): FilterField {
    let commercetoolsAttributeType = commercetoolsAttributeDefinition.type.name;

    let commercetoolsAttributeValues = commercetoolsAttributeDefinition.type.hasOwnProperty('values')
      ? (commercetoolsAttributeDefinition.type as AttributeEnumType | AttributeLocalizedEnumType).values
      : [];

    if (commercetoolsAttributeType === 'set' && commercetoolsAttributeDefinition.type.hasOwnProperty('elementType')) {
      const elementType: AttributeType = (commercetoolsAttributeDefinition.type as AttributeSetType).elementType;

      commercetoolsAttributeType = elementType.name;
      commercetoolsAttributeValues = elementType.hasOwnProperty('values')
        ? (elementType as AttributeEnumType | AttributeLocalizedEnumType).values
        : [];
    }

    const filterFieldValues: FilterFieldValue[] = [];

    for (const value of commercetoolsAttributeValues) {
      filterFieldValues.push({
        value: value.key,
        name: value.label?.[locale.language] ?? value.label,
      });
    }

    return {
      field: `variants.attributes.${commercetoolsAttributeDefinition.name}`,
      type: TypeMap.has(commercetoolsAttributeType)
        ? TypeMap.get(commercetoolsAttributeType)
        : commercetoolsAttributeType,
      label: commercetoolsAttributeDefinition.label?.[locale.language],
      values: filterFieldValues.length > 0 ? filterFieldValues : undefined,
    };
  }
}
