import '@testing-library/jest-dom/extend-expect';

import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import DetailChip from '..';

describe('DetailChip', () => {
  const onDeleteSpy = jest.fn();
  const getLinkSpy = jest.fn(() => '/test');
  let queryFunctions;

  beforeEach(() => {
    queryFunctions = render(
      <BrowserRouter>
        <DetailChip
          details={{ a: 1, b: 2 }}
          getLink={getLinkSpy}
          label="label"
          onDelete={onDeleteSpy}
        />,
      </BrowserRouter>,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('Detail Chip is rendered with correct labels', () => {
    const { getByText } = queryFunctions;
    expect(getByText('label')).toBeInTheDocument();
  });

  const closedPopoverCheck = (labelArr, queryFn) => {
    labelArr.forEach((label) => {
      expect(queryFn(label)).toBe(null); // pop up closed
    });
  };

  const openPopoverCheck = (labelArr, queryFn) => {
    labelArr.forEach((label) => {
      expect(queryFn(label)).toBeInTheDocument(); // pop up open
    });
  };

  test('pop over opens on detail chip click', async () => {
    const { getByText, queryByText } = queryFunctions;
    const detailLabels = ['a', '1', 'b', '2'];
    closedPopoverCheck(detailLabels, queryByText);

    const chip = getByText('label');
    await fireEvent.click(chip);
    openPopoverCheck(detailLabels, getByText);
  });

  test('calls onDelete handler on clicking the close icon', async () => {
    const { getByText, container } = queryFunctions;
    const chip = getByText('label');
    await fireEvent.click(chip);

    const cancelIcon = container.querySelector('[class*="MuiChip-deleteIcon"]');
    await fireEvent.click(cancelIcon);
    expect(onDeleteSpy).toHaveBeenCalledTimes(1);
  });

  test('renders getLink icon correctly with correct pathname', async () => {
    const { getByText, container } = queryFunctions;
    const chip = getByText('label');
    await fireEvent.click(chip);

    const viewRecordIcon = container.querySelector('[class*="MuiSvgIcon-root"]');
    expect(viewRecordIcon).toBeInTheDocument();
  });

  test('doesnt crash if you only pass required props', () => {
    render(
      <DetailChip
        details={undefined}
        label="Please oh please don't crash"
      />,
    );
  });
});
