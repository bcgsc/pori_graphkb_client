import { expect, screen } from 'storybook/test';

import preview, {
  hasFinishedLoading,
  http, view, ViewPreviewType,
} from '#.storybook/preview';

const meta = preview.type<ViewPreviewType>().meta({ ...view });

export const AsNonAdmin = meta.story({
  args: {
    path: '/admin',
  },
  play: async ({ canvas, step }) => {
    await hasFinishedLoading({ canvas, step });
    await expect(canvas.findByText('Forbidden')).resolves.toBeInTheDocument();
  },
});

export const AsAdmin = meta.story({
  args: {
    path: '/admin',
    auth: {
      isAdmin: true,
    },
  },
  parameters: {
    msw: {
      handlers: [
        http.gkb.query((body) => {
          if (body.target === 'User') {
            return [{
              '@class': 'User',
              '@rid': '#1:1',
              name: 'lorelai',
              email: 'lorelai@sh.com',
              signedLicenseAt: new Date(2020, 0, 3).getTime(),
              createdAt: new Date(2020, 0, 1).getTime(),
            }];
          }
          if (body.target === 'UserGroup') {
            return [{
              '@class': 'UserGroup',
              '@rid': '#1:1',
              name: 'Super Cool Party People',
              createdAt: new Date(2020, 0, 1).getTime(),
            }];
          }
          return [];
        }),
      ],
    },
  },
  play: async ({ canvas, step }) => {
    await hasFinishedLoading({ canvas, step });
    await expect(canvas.findByText('Super Cool Party People')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('lorelai@sh.com')).resolves.toBeInTheDocument();
  },
});

export const AddNewUser = AsAdmin.extend({
  play: async ({ canvas, step, userEvent }) => {
    await hasFinishedLoading({ canvas, step });
    await userEvent.click(canvas.getByText(/add new user$/i, { exact: true }));
    await expect(screen.findByText('Add a new User')).resolves.toBeInTheDocument();
  },
});

export const AddNewGroup = AsAdmin.extend({
  play: async ({ canvas, step, userEvent }) => {
    await hasFinishedLoading({ canvas, step });
    await userEvent.click(canvas.getByText(/add new usergroup$/i, { exact: true }));
    await expect(screen.findByText('Add a new UserGroup')).resolves.toBeInTheDocument();
  },
});
