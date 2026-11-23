import { omit } from 'lodash';
import { LoaderFunctionArgs, redirect } from 'react-router';

import { authContext } from '@/components/Auth';
import { FORM_VARIANT, tuple } from '@/components/util';
import api from '@/services/api';
import { AuthorizationError, NotFoundError } from '@/services/errors';
import schema from '@/services/schema';

export const createRecordLoader = (variant: FORM_VARIANT.NEW | FORM_VARIANT.VIEW | FORM_VARIANT.EDIT) => async ({ params, context }: LoaderFunctionArgs) => {
  const auth = context.get(authContext);
  const queryClient = context.get(api.routerQueryContext);
  // where modelName/rid may be undefined but not both and only missing rid if new

  // TODO better errors for those hopefully unreachable cases
  if (variant === FORM_VARIANT.NEW && !params.modelName) {
    // not possible to figure out model unless we at least have a record to go from
    throw new NotFoundError('A model name is required');
  }
  const model = schema.get(params.modelName ?? 'V', false);

  if (!model) {
    throw new NotFoundError(`'${params.modelName}' is not a valid model`);
  }

  if (variant !== FORM_VARIANT.NEW && !params.rid) {
    throw new NotFoundError('A record ID is required');
  }

  if (variant !== FORM_VARIANT.VIEW && ['Source', 'User', 'UserGroup'].includes(model.name) && !auth.isAdmin) {
    throw new AuthorizationError('You do not have sufficient permissions to see this page.');
  }

  if (params.rid) {
    const data = await queryClient.fetchQuery({
      queryKey: tuple(`${model.routeName}/${params.rid}?neighbors=1`, { forceListReturn: true, variant }),
      queryFn: async ({ queryKey: [route, options] }) => {
        const result = await api.get(route, options);
        return { ...result[0] };
      },
      staleTime: 0,
    });

    if (variant === FORM_VARIANT.NEW) {
      // drop certain fields when copying a record to create a new one
      return {
        data: omit(data, ['@rid', '@class', 'deletedAt', 'createdAt', 'updatedAt', 'deletedBy', 'createdBy', 'updatedBy', 'uuid', 'reviews']),
        modelName: model.name,
        variant,
      };
    }
    if (data['@class'] !== model.name) {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw redirect(`/${variant}/${data['@class']}/${params.rid}`);
    }
    return {
      variant, data, modelName: model.name, rid: params.rid,
    };
  }

  return {
    variant,
    data: undefined,
    modelName: model.name,
    rid: undefined,
  };
};
