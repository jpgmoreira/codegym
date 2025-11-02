import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/vue';
import BusyButton from '@renderer/components/UI/BusyButton.vue';

describe('BusyButton', () => {
  it('renders default slot when not busy', () => {
    const { getByText } = render(BusyButton, {
      props: { busy: false, callback: () => {} },
      slots: { default: 'Click Me', busy: 'Loading...' },
    });
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('renders busy slot when busy', async () => {
    const { getByText } = render(BusyButton, {
      props: { busy: true, callback: () => {}, debounce: 0 },
      slots: { default: 'Click Me', busy: 'Loading...' },
    });
    // Wait for debounce to apply
    await new Promise((r) => setTimeout(r, 10));
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('calls callback when clicked if not busy or disabled', async () => {
    const callback = vi.fn();
    const { getByText } = render(BusyButton, {
      props: { busy: false, callback },
      slots: { default: 'Click Me' },
    });
    const button = getByText('Click Me');
    await fireEvent.click(button);
    expect(callback).toHaveBeenCalled();
  });

  it('does not call callback when busy', async () => {
    const callback = vi.fn();
    const { getByText } = render(BusyButton, {
      props: { busy: true, callback, debounce: 0 },
      slots: { default: 'Click Me', busy: 'Loading...' },
    });
    // Wait for debounce to apply
    await new Promise((r) => setTimeout(r, 10));
    const button = getByText('Loading...');
    await fireEvent.click(button);
    expect(callback).not.toHaveBeenCalled();
  });

  it('does not call callback when disabled', async () => {
    const callback = vi.fn();
    const { getByText } = render(BusyButton, {
      props: { busy: false, callback, disabled: true },
      slots: { default: 'Click Me' },
    });
    const button = getByText('Click Me');
    await fireEvent.click(button);
    expect(callback).not.toHaveBeenCalled();
  });
});
