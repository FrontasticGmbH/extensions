import { Cart } from '../../../types/cart/Cart';
import {
  Cart as commercetoolsCart,
  LineItem as CommercetoolsLineItem,
  BaseAddress as CommercetoolsAddress,
  Order as CommercetoolsOrder,
  PaymentInfo as CommercetoolsPaymentInfo,
  ShippingInfo as CommercetoolsShippingInfo,
  ShippingMethod as CommercetoolsShippingMethod,
  ZoneRate as CommercetoolsZoneRate,
} from '@commercetools/platform-sdk';
import { LineItem } from '../../../types/cart/LineItem';
import { Address } from '../../../types/account/Address';
import { Order } from '../../../types/cart/Order';
import { Locale } from '../Locale';
import { ShippingMethod } from '../../../types/cart/ShippingMethod';
import { ShippingRate } from '../../../types/cart/ShippingRate';
import { ShippingLocation } from '../../../types/cart/ShippingLocation';
import { ProductRouter } from '../../utils/ProductRouter';
import { ProductMapper } from './ProductMapper';
import { ShippingInfo } from '../../../types/cart/ShippingInfo';
import { Payment } from '../../../types/cart/Payment';

export class CartMapper {
  static commercetoolsCartToCart: (commercetoolsCart: commercetoolsCart, locale: Locale) => Cart = (
    commercetoolsCart: commercetoolsCart,
    locale: Locale,
  ) => {
    return {
      cartId: commercetoolsCart.id,
      cartVersion: commercetoolsCart.version.toString(),
      lineItems: CartMapper.commercetoolsLineItemsToLineItems(commercetoolsCart.lineItems, locale),
      email: commercetoolsCart?.customerEmail,
      sum: ProductMapper.commercetoolsMoneyToMoney(commercetoolsCart.totalPrice),
      shippingAddress: CartMapper.commercetoolsAddressToAddress(commercetoolsCart.shippingAddress),
      billingAddress: CartMapper.commercetoolsAddressToAddress(commercetoolsCart.billingAddress),
      shippingInfo: CartMapper.commercetoolsShippingInfoToShippingInfo(commercetoolsCart.shippingInfo, locale),
      payments: CartMapper.commercetoolsPaymentInfoToPayments(commercetoolsCart.paymentInfo, locale),
      // payments:
      // discountCodes:
      // taxed:
    };
  };

  static commercetoolsLineItemsToLineItems: (
    commercetoolsLineItems: CommercetoolsLineItem[],
    locale: Locale,
  ) => LineItem[] = (commercetoolsLineItems: CommercetoolsLineItem[], locale: Locale) => {
    const lineItems: LineItem[] = [];

    commercetoolsLineItems?.forEach((commercetoolsLineItem) => {
      const item: LineItem = {
        lineItemId: commercetoolsLineItem.id,
        name: commercetoolsLineItem?.name[locale.language] || '',
        type: 'variant',
        count: commercetoolsLineItem.quantity,
        price: ProductMapper.commercetoolsMoneyToMoney(commercetoolsLineItem.price?.value),
        discountedPrice: ProductMapper.commercetoolsMoneyToMoney(commercetoolsLineItem.price?.discounted?.value),
        // discountTexts:
        // discounts:
        totalPrice: ProductMapper.commercetoolsMoneyToMoney(commercetoolsLineItem.totalPrice),
        variant: ProductMapper.commercetoolsProductVariantToVariant(commercetoolsLineItem.variant, locale),
        isGift:
          commercetoolsLineItem?.lineItemMode !== undefined && commercetoolsLineItem.lineItemMode === 'GiftLineItem',
      };
      item._url = ProductRouter.generateUrlFor(item);
      lineItems.push(item);
    });

    return lineItems;
  };

  static commercetoolsAddressToAddress: (commercetoolsAddress: CommercetoolsAddress) => Address = (
    commercetoolsAddress: CommercetoolsAddress,
  ) => {
    return {
      addressId: commercetoolsAddress?.id,
      salutation: commercetoolsAddress?.salutation,
      firstName: commercetoolsAddress?.firstName,
      lastName: commercetoolsAddress?.lastName,
      streetName: commercetoolsAddress?.streetName,
      streetNumber: commercetoolsAddress?.streetNumber,
      additionalStreetInfo: commercetoolsAddress?.additionalStreetInfo,
      additionalAddressInfo: commercetoolsAddress?.additionalAddressInfo,
      postalCode: commercetoolsAddress?.postalCode,
      city: commercetoolsAddress?.city,
      country: commercetoolsAddress?.country,
      state: commercetoolsAddress?.state,
      phone: commercetoolsAddress?.phone,
    } as Address;
  };

  static addressToCommercetoolsAddress: (address: Address) => CommercetoolsAddress = (address: Address) => {
    return {
      id: address?.addressId,
      salutation: address?.salutation,
      firstName: address?.firstName,
      lastName: address?.lastName,
      streetName: address?.streetName,
      streetNumber: address?.streetNumber,
      additionalStreetInfo: address?.additionalStreetInfo,
      additionalAddressInfo: address?.additionalAddressInfo,
      postalCode: address?.postalCode,
      city: address?.city,
      country: address?.country,
      state: address?.state,
      phone: address?.phone,
    } as CommercetoolsAddress;
  };

  static commercetoolsOrderToOrder: (commercetoolsOrder: CommercetoolsOrder, locale: Locale) => Order = (
    commercetoolsOrder: CommercetoolsOrder,
    locale: Locale,
  ) => {
    return {
      cartId: commercetoolsOrder.id,
      orderState: commercetoolsOrder.orderState,
      orderId: commercetoolsOrder.orderNumber,
      orderVersion: commercetoolsOrder.version.toString(),
      // createdAt:
      lineItems: CartMapper.commercetoolsLineItemsToLineItems(commercetoolsOrder.lineItems, locale),
      email: commercetoolsOrder?.customerEmail,
      shippingAddress: CartMapper.commercetoolsAddressToAddress(commercetoolsOrder.shippingAddress),
      billingAddress: CartMapper.commercetoolsAddressToAddress(commercetoolsOrder.billingAddress),
      sum: commercetoolsOrder.totalPrice.centAmount,
      // payments:
      // discountCodes:
      // taxed:
    } as Order;
  };

  static commercetoolsShippingInfoToShippingInfo: (
    commercetoolsShippingInfo: CommercetoolsShippingInfo | undefined,
    locale: Locale,
  ) => ShippingInfo | undefined = (commercetoolsShippingInfo: CommercetoolsShippingInfo, locale: Locale) => {
    if (commercetoolsShippingInfo === undefined) {
      return undefined;
    }

    let shippingMethod: ShippingMethod = {
      shippingMethodId: commercetoolsShippingInfo?.shippingMethod?.id,
    };

    if (commercetoolsShippingInfo.shippingMethod.obj) {
      shippingMethod = {
        ...CartMapper.commercetoolsShippingMethodToShippingMethod(commercetoolsShippingInfo.shippingMethod.obj, locale),
      };
    }

    return {
      ...shippingMethod,
      price: ProductMapper.commercetoolsMoneyToMoney(commercetoolsShippingInfo.price),
    };
  };

  static commercetoolsShippingMethodToShippingMethod: (
    commercetoolsShippingMethod: CommercetoolsShippingMethod,
    locale: Locale,
  ) => ShippingMethod = (commercetoolsShippingMethod: CommercetoolsShippingMethod, locale: Locale) => {
    return {
      shippingMethodId: commercetoolsShippingMethod?.id || undefined,
      name:
        commercetoolsShippingMethod?.localizedName?.[locale.language] || commercetoolsShippingMethod?.name || undefined,
      description:
        commercetoolsShippingMethod?.localizedDescription?.[locale.language] ||
        commercetoolsShippingMethod?.description ||
        undefined,
      rates: CartMapper.commercetoolsZoneRatesToRates(commercetoolsShippingMethod?.zoneRates, locale),
    } as ShippingMethod;
  };

  static commercetoolsZoneRatesToRates: (
    commercetoolsZoneRates: CommercetoolsZoneRate[] | undefined,
    locale: Locale,
  ) => ShippingRate[] | undefined = (commercetoolsZoneRates: CommercetoolsZoneRate[] | undefined, locale: Locale) => {
    if (commercetoolsZoneRates === undefined) {
      return undefined;
    }

    const shippingRates: ShippingRate[] = [];

    commercetoolsZoneRates.forEach((commercetoolsZoneRate) => {
      const shippingRateId = commercetoolsZoneRate.zone.id;
      const name = commercetoolsZoneRate.zone?.obj?.name || undefined;
      const locations = commercetoolsZoneRate.zone?.obj?.locations?.map((location) => {
        return {
          country: location.country,
          state: location.state,
        } as ShippingLocation;
      });

      // When we tried to get only matching shipping methods, `isMatching` value will be returned.
      // In those cases, we'll only map the ones with value `true`.
      const matchingShippingRates = commercetoolsZoneRate.shippingRates.filter(function (shippingRate) {
        if (shippingRate.isMatching !== undefined && shippingRate.isMatching !== true) {
          return false; // skip
        }
        return true;
      });

      matchingShippingRates.forEach((matchingShippingRates) => {
        shippingRates.push({
          shippingRateId: shippingRateId,
          name: name,
          locations: locations,
          price: ProductMapper.commercetoolsMoneyToMoney(matchingShippingRates.price),
        } as ShippingRate);
      });
    });

    return shippingRates;
  };

  static commercetoolsPaymentInfoToPayments: (
    commercetoolsPaymentInfo: CommercetoolsPaymentInfo | undefined,
    locale: Locale,
  ) => Payment[] = (commercetoolsPaymentInfo: CommercetoolsPaymentInfo | undefined, locale: Locale) => {
    const payments: Payment[] = [];

    commercetoolsPaymentInfo?.payments?.forEach((commercetoolsPayment) => {
      const payment: Payment = {
        id: commercetoolsPayment?.obj?.key ?? null,
        paymentId: commercetoolsPayment?.obj?.interfaceId ?? null,
        paymentProvider: commercetoolsPayment?.obj?.paymentMethodInfo.paymentInterface ?? null,
        paymentMethod: commercetoolsPayment?.obj?.paymentMethodInfo.method ?? null,
        amountPlanned: {
          centAmount: commercetoolsPayment?.obj?.amountPlanned.centAmount ?? null,
          currencyCode: commercetoolsPayment?.obj?.amountPlanned.currencyCode ?? null,
        },
        debug: JSON.stringify(commercetoolsPayment),
        paymentStatus: commercetoolsPayment?.obj?.paymentStatus.interfaceCode ?? null,
        version: commercetoolsPayment?.obj?.version ?? 0,
      };
      payments.push(payment);
    });

    return payments;
  };
}
