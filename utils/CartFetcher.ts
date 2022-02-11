import { ActionContext, Request } from '@frontastic/extension-types';
import { Cart } from '../../types/cart/Cart';
import { CartApi } from '../commercetools/CartApi';
import { Guid } from './Guid';

export class CartFetcher {
  static async fetchCart(request: Request, actionContext: ActionContext): Promise<Cart> {
    const cartApi = new CartApi(actionContext.frontasticContext, request.query.locale);

    if (request.sessionData?.cartId !== undefined) {
      return await cartApi.getById(request.sessionData.cartId);
    }

    // TODO: get cart for user
    // return await cartApi.getForUser(account);

    // Get cart for anonymous user
    // TODO: asses if we need to get the anonymousId from the session
    return await cartApi.getAnonymous(Guid.newGuid());
  }
}
