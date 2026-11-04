import api from './api';

describe('verifyToken', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    sessionStorage.clear();
  });

  test('returns unauthenticated when the JWT is expired', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      status: 401,
      headers: { get: jest.fn().mockReturnValue('application/json') },
    });

    await expect(api.verifyToken()).resolves.toEqual({ authenticated: false });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/verify'),
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } })
    );
  });

  test('returns the verified user for a valid JWT', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      status: 200,
      ok: true,
      headers: { get: jest.fn().mockReturnValue('application/json') },
      json: jest.fn().mockResolvedValue({
        success: true,
        user: { username: 'admin', role: 'admin' },
      }),
    });

    await expect(api.verifyToken()).resolves.toEqual({
      authenticated: true,
      user: { username: 'admin', role: 'admin' },
    });
  });

  describe('getStateHistory', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('sends the history search term to the backend', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: [], pagination: {} }),
      });

      await api.getStateHistory({ search: 'phòng 201' });

      const requestUrl = new URL(fetch.mock.calls[0][0]);
      expect(requestUrl.searchParams.get('search')).toBe('phòng 201');
    });
  });

  describe('recordActivity', () => {
    afterEach(() => {
      jest.restoreAllMocks();
      sessionStorage.clear();
    });

    test('returns false when the idle token has expired', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({ status: 401 });

      await expect(api.recordActivity()).resolves.toBe(false);
    });

    test('records activity and saves the renewed access token', async () => {
      sessionStorage.setItem('accessToken', 'old-access-token');
      jest.spyOn(global, 'fetch').mockResolvedValue({
        status: 200,
        ok: true,
        json: jest.fn().mockResolvedValue({ accessToken: 'renewed-access-token' }),
      });

      await expect(api.recordActivity()).resolves.toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/activity'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer old-access-token',
          },
        })
      );
      expect(sessionStorage.getItem('accessToken')).toBe('renewed-access-token');
    });
  });
});
