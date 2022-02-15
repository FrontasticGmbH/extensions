import { Request, Response } from '@frontastic/extension-types/src/ts/index';
import { ActionContext } from '@frontastic/extension-types';
import { CartApi } from '../CartApi';
import { CartFetcher } from '../../utils/CartFetcher';
import { Payment, PaymentStatuses } from '../../../types/cart/Payment';

type ActionHook = (request: Request, actionContext: ActionContext) => Promise<Response>;
