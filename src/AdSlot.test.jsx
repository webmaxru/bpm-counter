import React from 'react';
import { render } from '@testing-library/react';
import AdSlot from './AdSlot';

describe('AdSlot', () => {
  it('renders nothing while no slot id is configured', () => {
    const { container } = render(<AdSlot name="inArticle" />);

    expect(container).toBeEmptyDOMElement();
  });
});
