import {
  CategoryReference,
  ProductProjection,
  TypedMoney,
  Money as CommercetoolsMoney,
} from '@commercetools/platform-sdk';
import { Product } from '../../../types/product/Product';
import { Variant } from '../../../types/product/Variant';
import { Attributes } from '../../../types/product/Attributes';
import { Category } from '../../../types/product/Category';

import {
  ProductVariant,
  Attribute as CommercetoolsAttribute,
} from '@commercetools/platform-sdk/dist/declarations/src/generated/models/product';
import { ProductRouter } from '../../utils/ProductRouter';
import { Locale } from '../Locale';
import { Money } from '../../../types/product/Money';

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
}
