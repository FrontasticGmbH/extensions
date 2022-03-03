import { ActionContext, Request } from '@frontastic/extension-types';
import { Cart } from '../../types/cart/Cart';
import { CartApi } from '../commercetools/CartApi';
import { Guid } from './Guid';

export class CartFetcher {
  static async fetchCart(request: Request, actionContext: ActionContext): Promise<Cart> {
    const cartApi = new CartApi(actionContext.frontasticContext, request.query.locale);

    if (request.sessionData?.account !== undefined) {
      return await cartApi.getForUser(request.sessionData.account);
    }

    if (request.sessionData?.cartId !== undefined) {
      return await cartApi.getById(request.sessionData.cartId);
    }

    return await cartApi.getAnonymous(Guid.newGuid());
  }
}
