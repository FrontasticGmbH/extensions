import { BaseApi } from './BaseApi';
import { WishlistMapper } from './mappers/WishlistMapper';
import { Wishlist } from '../../types/wishlist/Wishlist';

const expandVariants = ['lineItems[*].variant'];

interface AddToWishlistRequest {
  sku: string;
  count: number;
}

export class WishlistApi extends BaseApi {
  getById = async (wishlistId: string) => {
    try {
      const locale = await this.getCommercetoolsLocal();
      const response = await this.getApiForProject()
        .shoppingLists()
        .withId({ ID: wishlistId })
        .get({
          queryArgs: {
            expand: expandVariants,
          },
        })
        .execute();

      return WishlistMapper.commercetoolsShoppingListToWishlist(response.body, locale);
    } catch (error) {
      throw new Error(`Get wishlist by ID failed: ${error}`);
    }
  };

  create = async (wishlist: Omit<Wishlist, 'wishlistId'>) => {
    try {
      const locale = await this.getCommercetoolsLocal();
      const body = WishlistMapper.wishlistToCommercetoolsShoppingListDraft(wishlist, locale);
      const response = await this.getApiForProject()
        .shoppingLists()
        .post({
          body: body,
          queryArgs: {
            expand: expandVariants,
          },
        })
        .execute();

      return WishlistMapper.commercetoolsShoppingListToWishlist(response.body, locale);
    } catch (error) {
      throw new Error(`Create wishlist failed: ${error}`);
    }
  };

  addToWishlist = async (wishlist: Wishlist, request: AddToWishlistRequest) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const response = await this.getApiForProject()
        .shoppingLists()
        .withId({ ID: wishlist.wishlistId })
        .post({
          body: {
            version: +wishlist.wishlistVersion,
            actions: [
              {
                action: 'addLineItem',
                sku: request.sku,
                quantity: request.count,
              },
            ],
          },
          queryArgs: {
            expand: expandVariants,
          },
        })
        .execute();

      return WishlistMapper.commercetoolsShoppingListToWishlist(response.body, locale);
    } catch (error) {
      throw new Error(`Add to wishlist failed: ${error}`);
    }
  };

  removeLineItem = async (wishlist: Wishlist, lineItemId: string) => {
    try {
      const locale = await this.getCommercetoolsLocal();

      const response = await this.getApiForProject()
        .shoppingLists()
        .withId({ ID: wishlist.wishlistId })
        .post({
          body: {
            version: +wishlist.wishlistVersion,
            actions: [
              {
                action: 'removeLineItem',
                lineItemId,
              },
            ],
          },
          queryArgs: {
            expand: expandVariants,
          },
        })
        .execute();

      return WishlistMapper.commercetoolsShoppingListToWishlist(response.body, locale);
    } catch (error) {
      throw new Error(`Add to wishlist failed: ${error}`);
    }
  };
}
