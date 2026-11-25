import { fireEvent, render, screen } from '@testing-library/react';
import RoomCard from './RoomCard';

test('disables main relay control for non-admin users', () => {
  const onToggleMain = jest.fn();
  render(
    <RoomCard
      room="201"
      stateName="Trống"
      mainStatus={false}
      subStatus={false}
      canControlMain={false}
      onToggleMain={onToggleMain}
      onToggleSub={jest.fn()}
    />
  );

  const mainButton = screen.getByRole('button', { name: 'A' });
  expect(mainButton).toBeDisabled();
  expect(mainButton).toHaveAttribute('title', 'Chỉ quản trị viên được điều khiển relay chính');
  fireEvent.click(mainButton);
  expect(onToggleMain).not.toHaveBeenCalled();
});

test('shows the main relay status at full brightness for non-admin users', () => {
  render(
    <RoomCard
      room="201"
      stateName="Trống"
      mainStatus={true}
      subStatus={false}
      canControlMain={false}
      onToggleMain={jest.fn()}
      onToggleSub={jest.fn()}
    />
  );

  const mainButton = screen.getByRole('button', { name: 'A' });
  expect(mainButton).toHaveClass('bg-white/60', 'shadow-white/70');
  expect(mainButton.querySelector('svg')).toHaveClass('animate-pulse');
  expect(mainButton).not.toHaveClass('opacity-70');
});
