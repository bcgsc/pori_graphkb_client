import React from 'react';
import { mount } from 'enzyme';
import { BrowserRouter } from 'react-router-dom';


import ReviewDialog from '../ReviewDialog';
import { KBContext } from '../../KBContext';
import Schema from '../../../services/schema';
import FormField from '../FormField';
import ActionButton from '../../ActionButton';


describe('ReviewDialog', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const cloneReviews = (reviewArr) => {
    const clonedReviews = reviewArr.map(obj => ({ ...obj }));
    return clonedReviews;
  };

  const deepClone = (content) => {
    const newContent = Object.assign({}, content);
    const clonedReviews = cloneReviews(content.reviews);
    newContent.reviews = clonedReviews;
    return newContent;
  };

  const mockContent = {
    '@class': 'Statement',
    createdAt: 1565911966860,
    appliesTo: '#67:3423',
    relevance: '#78:24',
    supportedBy: [
      '#66:61',
    ],
    impliedBy: [
      '#71:18940',
      '#84:93',
    ],
    source: '#24:8',
    sourceId: 'a6e7baa1-497f-403a-af83-31cfe292b787',
    createdBy: '#20:0',
    uuid: '65baf0ff-db23-404f-9513-00a635f91996',
    displayNameTemplate: 'Given {impliedBy} {relevance} applies to {appliesTo} ({supportedBy})',
    reviewStatus: 'passed',
    reviews: [
      {
        '@class': 'StatementReview',
        createdBy: '#19:0',
        status: 'initial',
        createdAt: 1565376648434,
        comment: 'test run2',
      },
    ],
    history: '#82:35648',
    '@rid': '#81:12291',
    '@version': 2,
  };

  it('Mounts view variant successfully', () => {
    const wrapper = mount((
      <BrowserRouter>
        <KBContext.Provider value={{ schema: new Schema() }}>
          <ReviewDialog
            isOpen
            onClose={jest.fn()}
            content={mockContent}
            reviewIndex={0}
            snackbar={{
              add: jest.fn(),
            }}
            handleEdit={jest.fn()}
            formVariant="view"
          />
        </KBContext.Provider>
      </BrowserRouter>
    ));
    wrapper.update();

    expect(wrapper.find(ReviewDialog)).toBeDefined();
    expect(wrapper.find(ActionButton)).toHaveLength(1);
    expect(wrapper.find(FormField)).toHaveLength(4);
  });

  it('Mounts edit variant successfully', () => {
    const wrapper = mount((
      <BrowserRouter>
        <KBContext.Provider value={{ schema: new Schema() }}>
          <ReviewDialog
            isOpen
            onClose={jest.fn()}
            content={mockContent}
            reviewIndex={0}
            snackbar={{
              add: jest.fn(),
            }}
            handleEdit={jest.fn()}
            formVariant="edit"
          />
        </KBContext.Provider>
      </BrowserRouter>
    ));
    wrapper.update();

    expect(wrapper.find(ReviewDialog)).toBeDefined();
    expect(wrapper.find(ActionButton)).toHaveLength(3);
    expect(wrapper.find(FormField)).toHaveLength(4);
  });

  it('Mounts new variant successfully', () => {
    const wrapper = mount((
      <BrowserRouter>
        <KBContext.Provider value={{ schema: new Schema() }}>
          <ReviewDialog
            isOpen
            onClose={jest.fn()}
            content={mockContent}
            reviewIndex={0}
            snackbar={{
              add: jest.fn(),
            }}
            handleEdit={jest.fn()}
            formVariant="new"
          />
        </KBContext.Provider>
      </BrowserRouter>
    ));
    wrapper.update();

    expect(wrapper.find(ReviewDialog)).toBeDefined();
    expect(wrapper.find(ActionButton)).toHaveLength(1);
    expect(wrapper.find(FormField)).toHaveLength(1);
  });

  it('adds Review Correctly', () => {
    // need to mock date or test will fail everytime because new review is created with a timestamp
    const dateSpy = jest.spyOn(global.Date.prototype, 'valueOf').mockImplementation(() => (1000));
    const mockReview = {
      status: 'initial',
      comment: 'This is a mock review of this statement',
    };
    const handleEditSpy = jest.fn();
    const fakeAuth = {
      user: {
        '@rid': '#20:0',
      },
    };
    const wrapper = mount((
      <BrowserRouter>
        <KBContext.Provider value={{ schema: new Schema() }}>
          <ReviewDialog
            isOpen
            onClose={jest.fn()}
            content={mockContent}
            reviewIndex={0}
            snackbar={{
              add: jest.fn(),
            }}
            handleEdit={handleEditSpy}
            formVariant="new"
            auth={fakeAuth}
          />
        </KBContext.Provider>
      </BrowserRouter>
    ));
    wrapper.update();
    expect(wrapper.find(ReviewDialog)).toBeDefined();

    const reviewDialogInstance = wrapper.find(ReviewDialog).instance();
    reviewDialogInstance.setState({ newReview: mockReview });
    wrapper.update();

    expect(wrapper.find(ActionButton)).toHaveLength(1);
    const submitBtn = wrapper.find(ActionButton).at(0);
    expect(submitBtn.text()).toEqual('SUBMIT');
    submitBtn.prop('onClick')();
    wrapper.update();

    expect(handleEditSpy).toHaveBeenCalledTimes(1);
    expect(dateSpy).toHaveBeenCalledTimes(1);

    const newReview = {
      '@class': 'StatementReview',
      ...mockReview,
      createdAt: 1000, // fake timestamp
      createdBy: '20:0',
    };

    const expectedMockContent = deepClone(mockContent);
    expectedMockContent.reviews.push(newReview);

    expect(handleEditSpy).toBeCalledWith({ content: expectedMockContent });
    expect(wrapper.find(FormField)).toHaveLength(1);
  });

  it('detects errors on form and does not submit review', () => {
    const reviewWithError = {
      status: 'initial',
      // missing comment prop/value should raise error
    };
    const handleEditSpy = jest.fn();
    const snackbarErrorSpy = jest.fn();
    const fakeAuth = {
      user: {
        '@rid': '#20:0',
      },
    };
    const wrapper = mount((
      <BrowserRouter>
        <KBContext.Provider value={{ schema: new Schema() }}>
          <ReviewDialog
            isOpen
            onClose={jest.fn()}
            content={mockContent}
            reviewIndex={0}
            snackbar={{
              add: snackbarErrorSpy,
            }}
            handleEdit={handleEditSpy}
            formVariant="new"
            auth={fakeAuth}
          />
        </KBContext.Provider>
      </BrowserRouter>
    ));
    wrapper.update();
    expect(wrapper.find(ReviewDialog)).toBeDefined();

    const reviewDialogInstance = wrapper.find(ReviewDialog).instance();
    reviewDialogInstance.setState({ newReview: reviewWithError });
    wrapper.update();

    expect(wrapper.find(ActionButton)).toHaveLength(1);
    const submitBtn = wrapper.find(ActionButton).at(0);
    expect(submitBtn.text()).toEqual('SUBMIT');
    submitBtn.prop('onClick')();
    wrapper.update();

    expect(handleEditSpy).toHaveBeenCalledTimes(0);
    expect(snackbarErrorSpy).toHaveBeenCalledTimes(1);
  });

  it('handles review deletion correctly', () => {
    const handleEditSpy = jest.fn();
    const onCloseSpy = jest.fn();
    const wrapper = mount((
      <BrowserRouter>
        <KBContext.Provider value={{ schema: new Schema() }}>
          <ReviewDialog
            isOpen
            onClose={onCloseSpy}
            content={mockContent}
            reviewIndex={0}
            snackbar={{
              add: jest.fn(),
            }}
            handleEdit={handleEditSpy}
            formVariant="edit"
            auth={jest.fn()}
          />
        </KBContext.Provider>
      </BrowserRouter>
    ));
    wrapper.update();
    expect(wrapper.find(ReviewDialog)).toBeDefined();

    expect(wrapper.find(ActionButton)).toHaveLength(3);
    const delBtn = wrapper.find(ActionButton).at(1);
    expect(delBtn.text()).toEqual('DELETE');
    delBtn.prop('onClick')();
    wrapper.update();

    const expectedMockContent = Object.assign({}, mockContent);
    expectedMockContent.reviews = [];

    expect(handleEditSpy).toBeCalledWith({ content: expectedMockContent });
    expect(handleEditSpy).toHaveBeenCalledTimes(1);
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
  });

  it('edits a review correctly', () => {
    const handleEditSpy = jest.fn();
    const onCloseSpy = jest.fn();
    const snackbarSpy = jest.fn();
    const wrapper = mount((
      <BrowserRouter>
        <KBContext.Provider value={{ schema: new Schema() }}>
          <ReviewDialog
            isOpen
            onClose={onCloseSpy}
            content={mockContent}
            reviewIndex={0}
            snackbar={{
              add: snackbarSpy,
            }}
            handleEdit={handleEditSpy}
            formVariant="edit"
            auth={jest.fn()}
          />
        </KBContext.Provider>
      </BrowserRouter>
    ));
    wrapper.update();
    expect(wrapper.find(ReviewDialog)).toBeDefined();

    const editedReview = {
      '@class': 'StatementReview',
      createdBy: '#19:0',
      status: 'initial',
      createdAt: 1565376648434,
      comment: 'this has been edited',
    };

    const editedContent = Object.assign({}, mockContent);
    editedContent.reviews = [];
    editedContent.reviews.push(editedReview);

    const reviewDialogInstance = wrapper.find(ReviewDialog).instance();
    reviewDialogInstance.setState({ currContent: editedContent });
    wrapper.update();

    expect(wrapper.find(ActionButton)).toHaveLength(3);
    const delBtn = wrapper.find(ActionButton).at(2);
    expect(delBtn.text()).toEqual('SUBMIT CHANGES');
    delBtn.prop('onClick')();
    wrapper.update();

    const expectedContent = Object.assign({}, mockContent);
    expectedContent.reviews = [];
    expectedContent.reviews.push(editedReview);

    expect(handleEditSpy).toBeCalledWith({ content: editedContent });
    expect(handleEditSpy).toHaveBeenCalledTimes(1);
  });
});
