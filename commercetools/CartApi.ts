import { Cart } from '../../types/cart/Cart';
import {
  CartDraft,
  CartSetBillingAddressAction,
  CartSetShippingAddressAction,
  CartSetShippingMethodAction,
} from '@commercetools/platform-sdk';
import { CartMapper } from './mappers/CartMapper';
import { LineItem } from '../../types/cart/LineItem';
import { Cart as commercetoolsCart } from '@commercetools/platform-sdk';
import {
  CartAddLineItemAction,
  CartChangeLineItemQuantityAction,
  CartRemoveLineItemAction,
  CartSetCustomerEmailAction,
  CartUpdate,
} from '@commercetools/platform-sdk/dist/declarations/src/generated/models/cart';
import { Address } from '../../types/account/Address';
import { Order } from '../../types/cart/Order';
import { OrderFromCartDraft } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/order';
import { Guid } from '../utils/Guid';
import { BaseApi } from './BaseApi';
import { ShippingMethod } from '../../types/cart/ShippingMethod';
import { Locale } from './Locale';

export class CartApi extends BaseApi {
  protected buildCartWithAvailableShippingMethods: (
    commercetoolsCart: commercetoolsCart,
    locale: Locale,
  ) => Promise<Cart> = async (commercetoolsCart: commercetoolsCart, locale: Locale) => {
    const cart = CartMapper.commercetoolsCartToCart(commercetoolsCart, locale);

    try {
      // It would not be possible to get available shipping method
      // if the shipping address has not been set.
      if (cart.shippingAddress !== undefined && cart.shippingAddress.country !== undefined) {
        cart.availableShippingMethods = await this.getAvailableShippingMethods(cart);
      }
    } catch (error) {
      throw new Error(`buildCartWithAvailableShippingMethods failed. ${error}`);
    }

    return cart;
  };

  getAnonymous: ($anonymousId: string) => Promise<Cart> = async (anonymousId: string) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const response = await this.getApiForProject()
        .carts()
        .get({
          queryArgs: {
            limit: 1,
            expand: [
              'lineItems[*].discountedPrice.includedDiscounts[*].discount',
              'discountCodes[*].discountCode',
              'paymentInfo.payments[*]',
            ],
            where: `anonymousId="${anonymousId}"`,
          },
        })
        .execute();

      if (response.body.count >= 1) {
        return this.buildCartWithAvailableShippingMethods(response.body.results[0], locale);
      }

      const cartDraft: CartDraft = {
        currency: locale.currency,
        country: locale.country,
        locale: locale.language,
        anonymousId: anonymousId,
      };

      const commercetoolsCart = await this.getApiForProject()
        .carts()
        .post({
          queryArgs: {
            expand: [
              'lineItems[*].discountedPrice.includedDiscounts[*].discount',
              'discountCodes[*].discountCode',
              'paymentInfo.payments[*]',
            ],
          },
          body: cartDraft,
        })
        .execute();

      return this.buildCartWithAvailableShippingMethods(commercetoolsCart.body, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`getAnonymous failed. ${error}`);
    }
  };

  getById: (cartId: string) => Promise<Cart> = async (cartId: string) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const response = await this.getApiForProject()
        .carts()
        .withId({
          ID: cartId,
        })
        .get({
          queryArgs: {
            limit: 1,
            expand: [
              'lineItems[*].discountedPrice.includedDiscounts[*].discount',
              'discountCodes[*].discountCode',
              'paymentInfo.payments[*]',
            ],
          },
        })
        .execute();

      return this.buildCartWithAvailableShippingMethods(response.body, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`getById failed. ${error}`);
    }
  };

  addToCart: (cart: Cart, lineItem: LineItem) => Promise<Cart> = async (cart: Cart, lineItem: LineItem) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'addLineItem',
            sku: lineItem.variant.sku,
            quantity: +lineItem.count,
          } as CartAddLineItemAction,
        ],
      };

      const response = await this.getApiForProject()
        .carts()
        .withId({
          ID: cart.cartId,
        })
        .post({
          queryArgs: {
            expand: [
              'lineItems[*].discountedPrice.includedDiscounts[*].discount',
              'discountCodes[*].discountCode',
              'paymentInfo.payments[*]',
            ],
          },
          body: cartUpdate,
        })
        .execute();
      return this.buildCartWithAvailableShippingMethods(response.body, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`addToCart failed. ${error}`);
    }
  };

  updateLineItem: (cart: Cart, lineItem: LineItem) => Promise<Cart> = async (cart: Cart, lineItem: LineItem) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'changeLineItemQuantity',
            lineItemId: lineItem.lineItemId,
            quantity: +lineItem.count,
          } as CartChangeLineItemQuantityAction,
        ],
      };

      const response = await this.getApiForProject()
        .carts()
        .withId({
          ID: cart.cartId,
        })
        .post({
          queryArgs: {
            expand: [
              'lineItems[*].discountedPrice.includedDiscounts[*].discount',
              'discountCodes[*].discountCode',
              'paymentInfo.payments[*]',
            ],
          },
          body: cartUpdate,
        })
        .execute();
      return this.buildCartWithAvailableShippingMethods(response.body, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`updateLineItem failed. ${error}`);
    }
  };

  removeLineItem: (cart: Cart, lineItem: LineItem) => Promise<Cart> = async (cart: Cart, lineItem: LineItem) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'removeLineItem',
            lineItemId: lineItem.lineItemId,
          } as CartRemoveLineItemAction,
        ],
      };

      const response = await this.getApiForProject()
        .carts()
        .withId({
          ID: cart.cartId,
        })
        .post({
          queryArgs: {
            expand: [
              'lineItems[*].discountedPrice.includedDiscounts[*].discount',
              'discountCodes[*].discountCode',
              'paymentInfo.payments[*]',
            ],
          },
          body: cartUpdate,
        })
        .execute();
      return this.buildCartWithAvailableShippingMethods(response.body, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`removeLineItem failed. ${error}`);
    }
  };

  setEmail: (cart: Cart, email: string) => Promise<Cart> = async (cart: Cart, email: string) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'setCustomerEmail',
            email: email,
          } as CartSetCustomerEmailAction,
        ],
      };

      const response = await this.getApiForProject()
        .carts()
        .withId({
          ID: cart.cartId,
        })
        .post({
          queryArgs: {
            expand: [
              'lineItems[*].discountedPrice.includedDiscounts[*].discount',
              'discountCodes[*].discountCode',
              'paymentInfo.payments[*]',
            ],
          },
          body: cartUpdate,
        })
        .execute();
      return this.buildCartWithAvailableShippingMethods(response.body, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`setEmail failed. ${error}`);
    }
  };

  setShippingAddress: (cart: Cart, address: Address) => Promise<Cart> = async (cart: Cart, address: Address) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'setShippingAddress',
            address: CartMapper.addressToCommercetoolsAddress(address),
          } as CartSetShippingAddressAction,
        ],
      };

      const response = await this.getApiForProject()
        .carts()
        .withId({
          ID: cart.cartId,
        })
        .post({
          queryArgs: {
            expand: [
              'lineItems[*].discountedPrice.includedDiscounts[*].discount',
              'discountCodes[*].discountCode',
              'paymentInfo.payments[*]',
            ],
          },
          body: cartUpdate,
        })
        .execute();
      return this.buildCartWithAvailableShippingMethods(response.body, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`setShippingAddress failed. ${error}`);
    }
  };

  setBillingAddress: (cart: Cart, address: Address) => Promise<Cart> = async (cart: Cart, address: Address) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'setBillingAddress',
            address: CartMapper.addressToCommercetoolsAddress(address),
          } as CartSetBillingAddressAction,
        ],
      };

      const response = await this.getApiForProject()
        .carts()
        .withId({
          ID: cart.cartId,
        })
        .post({
          queryArgs: {
            expand: [
              'lineItems[*].discountedPrice.includedDiscounts[*].discount',
              'discountCodes[*].discountCode',
              'paymentInfo.payments[*]',
            ],
          },
          body: cartUpdate,
        })
        .execute();
      return this.buildCartWithAvailableShippingMethods(response.body, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`setBillingAddress failed. ${error}`);
    }
  };

  setShippingMethod: (cart: Cart, shippingMethod: ShippingMethod) => Promise<Cart> = async (
    cart: Cart,
    shippingMethod: ShippingMethod,
  ) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const cartUpdate: CartUpdate = {
        version: +cart.cartVersion,
        actions: [
          {
            action: 'setShippingMethod',
            shippingMethod: {
              typeId: 'shipping-method',
              id: shippingMethod.shippingMethodId,
            },
          } as CartSetShippingMethodAction,
        ],
      };

      const response = await this.getApiForProject()
        .carts()
        .withId({
          ID: cart.cartId,
        })
        .post({
          queryArgs: {
            expand: [
              'lineItems[*].discountedPrice.includedDiscounts[*].discount',
              'discountCodes[*].discountCode',
              'paymentInfo.payments[*]',
            ],
          },
          body: cartUpdate,
        })
        .execute();
      return this.buildCartWithAvailableShippingMethods(response.body, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`setShippingMethod failed. ${error}`);
    }
  };

  order: (cart: Cart) => Promise<Order> = async (cart: Cart) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const orderFromCartDraft: OrderFromCartDraft = {
        id: cart.cartId,
        version: +cart.cartVersion,
        orderNumber: Guid.newGuid(),
      };

      // TODO: validate if cart is ready for checkout.
      const response = await this.getApiForProject()
        .orders()
        .post({
          queryArgs: {
            expand: [
              'lineItems[*].discountedPrice.includedDiscounts[*].discount',
              'discountCodes[*].discountCode',
              'paymentInfo.payments[*]',
            ],
          },
          body: orderFromCartDraft,
        })
        .execute();

      return CartMapper.commercetoolsOrderToOrder(response.body, locale);
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`order failed. ${error}`);
    }
  };

  getShippingMethods: (onlyMatching: boolean) => Promise<ShippingMethod[]> = async (onlyMatching: boolean) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const methodArgs = {
        queryArgs: {
          expand: ['zoneRates[*].zone'],
          country: undefined as string | any,
        },
      };

      let requestBuilder = this.getApiForProject().shippingMethods().get(methodArgs);

      if (onlyMatching) {
        methodArgs.queryArgs.country = locale.country;
        requestBuilder = this.getApiForProject().shippingMethods().matchingLocation().get(methodArgs);
      }

      const response = await requestBuilder.execute();

      return response.body.results.map((shippingMethod) =>
        CartMapper.commercetoolsShippingMethodToShippingMethod(shippingMethod, locale),
      );
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`getShippingMethods failed. ${error}`);
    }
  };

  getAvailableShippingMethods: (cart: Cart) => Promise<ShippingMethod[]> = async (cart: Cart) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const response = await this.getApiForProject()
        .shippingMethods()
        .matchingCart()
        .get({
          queryArgs: {
            expand: ['zoneRates[*].zone'],
            cartId: cart.cartId,
          },
        })
        .execute();

      return response.body.results.map((shippingMethod) =>
        CartMapper.commercetoolsShippingMethodToShippingMethod(shippingMethod, locale),
      );
    } catch (error) {
      //TODO: better error, get status code etc...
      throw new Error(`getAvailableShippingMethods failed. ${error}`);
    }
  };
}
