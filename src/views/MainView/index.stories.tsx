import { HttpResponse } from 'msw';

import preview, { http, view, ViewPreviewType } from '#.storybook/preview';

const meta = preview.type<ViewPreviewType>().meta({
  ...view,
  args: { auth: null },
});

export const ErrorAuthenticating = meta.story({
  beforeEach({ msw }) {
    msw.use(http.gkb.query(() => []));
    msw.use(http.gkb.post('/api/token', () => HttpResponse.json({ message: 'not a user.', name: 'AuthenticationError' }, { status: 401 })));
  },
});
