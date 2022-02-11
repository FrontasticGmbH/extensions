import { ActionContext, Request, Response } from '@frontastic/extension-types';
import { WishlistApi } from '../WishlistApi';
import { Guid } from '../../utils/Guid';

type ActionHook = (request: Request, actionContext: ActionContext) => Promise<Response>;

function getWishlistApi(request: Request, actionContext: ActionContext) {
  return new WishlistApi(actionContext.frontasticContext, request.query.locale);
}

async function fetchWishlist(request: Request, wishlistApi: WishlistApi) {
  if (request.sessionData?.wishlistId !== undefined) {
    return await wishlistApi.getById(request.sessionData?.wishlistId);
  }

  return await wishlistApi.create({ anonymousId: Guid.newGuid(), name: 'Wishlist' });
}

export const getWishlist: ActionHook = async (request, actionContext) => {
  const wishlistApi = getWishlistApi(request, actionContext);
  const wishlist = await fetchWishlist(request, wishlistApi);

  return {
    statusCode: 200,
    body: JSON.stringify(wishlist),
    sessionData: {
      ...request.sessionData,
      wishlistId: wishlist.wishlistId,
    },
  };
};

export const addToWishlist: ActionHook = async (request, actionContext) => {
  const wishlistApi = getWishlistApi(request, actionContext);
  const wishlist = await fetchWishlist(request, wishlistApi);

  const body: {
    variant?: { sku?: string };
    count?: number;
  } = JSON.parse(request.body);

  const updatedWishlist = await wishlistApi.addToWishlist(wishlist, {
    sku: body?.variant?.sku || undefined,
    count: body.count || 1,
  });

  return {
    statusCode: 200,
    body: JSON.stringify(updatedWishlist),
    sessionData: {
      ...request.sessionData,
      wishlistId: updatedWishlist.wishlistId,
    },
  };
};

export const removeLineItem: ActionHook = async (request, actionContext) => {
  const wishlistApi = getWishlistApi(request, actionContext);
  const wishlist = await fetchWishlist(request, wishlistApi);

  const body: {
    lineItem?: { id?: string };
  } = JSON.parse(request.body);

  const updatedWishlist = await wishlistApi.removeLineItem(wishlist, body.lineItem?.id ?? undefined);

  return {
    statusCode: 200,
    body: JSON.stringify(updatedWishlist),
    sessionData: {
      ...request.sessionData,
      wishlistId: updatedWishlist.wishlistId,
    },
  };
};
