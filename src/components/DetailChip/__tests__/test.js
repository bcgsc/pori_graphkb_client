import {
  Chip, Popover,
  TableRow,
} from '@material-ui/core';
import { Cancel } from '@material-ui/icons';
import { mount } from 'enzyme';
import React from 'react';

import DetailChip from '..';


describe('DetailChip', () => {
  const handlePopoverOpen = jest.spyOn(DetailChip.prototype, 'handlePopoverOpen');
  const handlePopoverClose = jest.spyOn(DetailChip.prototype, 'handlePopoverClose');
  const onDelete = jest.fn();

  test('popper renders details on click', () => {
    const wrapper = mount((
      <DetailChip
        details={{ a: 1, b: 2 }}
        label="label"
        onDelete={onDelete}
      />
    ));
    const chip = wrapper.find(Chip);
    chip.prop('onClick')({ currentTarget: chip.getDOMNode() });
    wrapper.update();
    // check that the popover opened
    expect(handlePopoverOpen).toHaveBeenCalled();
    // check that pop over was not closed
    expect(handlePopoverClose).not.toHaveBeenCalled();
    // check the the popover content was rendered
    const popoverRows = wrapper.find(TableRow);
    expect(popoverRows).toHaveLength(2);
  });

  test('closes details popper on subsequent click', () => {
    const wrapper = mount((
      <DetailChip
        details={{ a: 1, b: 2 }}
        label="label"
        onDelete={onDelete}
      />
    ));
    const chip = wrapper.find(Chip);
    chip.prop('onClick')({ currentTarget: chip.getDOMNode() });
    wrapper.update();
    // check that the popover opened
    expect(handlePopoverOpen).toHaveBeenCalled();
    // click to close the popover
    wrapper.find(Popover).prop('onClose')();
    wrapper.update();
    // check that pop over was not closed
    expect(handlePopoverClose).toHaveBeenCalled();
    // check the the popover content was rendered
    const popoverRows = wrapper.find(TableRow);
    expect(popoverRows).toHaveLength(0);
  });

  test('calls onDelete handler on clicking the close icon', () => {
    const wrapper = mount((
      <DetailChip
        details={{ a: 1, b: 2 }}
        label="label"
        onDelete={onDelete}
      />
    ));
    wrapper.find(Chip).prop('onDelete')();
    wrapper.update();
    expect(onDelete).toHaveBeenCalled();
  });

  test('does not provide a close icon when onDelete handler is null', () => {
    const wrapper = mount((
      <DetailChip
        details={{ a: 1, b: 2 }}
        label="label"
        onDelete={null}
      />
    ));
    expect(wrapper.find(Cancel)).toHaveLength(0);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
});
