import { render, screen } from '@testing-library/react';
import GuidePage from './GuidePage';

jest.mock('../docs/huong-dan-su-dung.md', () => '/huong-dan-su-dung.md');

const guideMarkdown = `# Hướng dẫn hệ thống

## 1. Trạng thái phòng

### 1.1. Công tắc

| Trạng thái | Công tắc |
|---|---|
| **Trống** | Tắt |

- Xem trạng thái phòng.
`;

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(guideMarkdown),
  });
});

afterEach(() => {
  delete global.fetch;
});

test('loads the Markdown guide and presents its headings, contents, and table', async () => {
  render(<GuidePage />);

  expect(await screen.findByRole('heading', { name: 'Hướng dẫn hệ thống' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '1. Trạng thái phòng' })).toBeInTheDocument();
  expect(screen.getByRole('article')).toHaveClass('w-full');
  expect(screen.getByRole('article').firstChild).toHaveClass('text-base');
  expect(screen.getByRole('table')).toHaveTextContent('Trống');
  expect(screen.getByText('Trống')).toHaveClass('bg-green-100');
  expect(screen.getByText('Xem trạng thái phòng.')).toBeInTheDocument();
});
