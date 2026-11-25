import api from './api';

describe('verifyToken', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    api.clearAccessToken();
  });

  test('refreshes the cookie session after the access token expires', async () => {
    jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        status: 401,
        headers: { get: jest.fn().mockReturnValue('application/json') },
      })
      .mockResolvedValueOnce({ status: 401 });

    await expect(api.verifyToken()).resolves.toEqual({ authenticated: false });
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/auth/me'),
      expect.objectContaining({ credentials: 'include' })
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/auth/refresh'),
      expect.objectContaining({
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Protection': '1',
        },
      })
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

  test('refreshes the access token before it expires', async () => {
    api.setAccessToken('expiring-access-token');
    jest.spyOn(api, 'getAccessTokenExpirationTime').mockReturnValue(Date.now() + 60_000);
    jest.spyOn(api, 'refreshSession').mockImplementation(async () => {
      api.setAccessToken('renewed-access-token');
      return {
        accessToken: 'renewed-access-token',
        user: { username: 'admin', role: 'admin' },
      };
    });
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

    expect(api.refreshSession).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/me'),
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer renewed-access-token',
        },
        credentials: 'include',
      })
    );
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

  test('sends date bounds, state, page and page size to the backend', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ data: [], pagination: {} }),
    });

    await api.getStateHistory({
      startDate: '2026-11-01',
      endDate: '2026-11-05',
      state: 'Có khách',
      page: 2,
      limit: 50,
    });

    const requestUrl = new URL(fetch.mock.calls[0][0]);
    expect(requestUrl.searchParams.get('startDate')).toBe('2026-11-01');
    expect(requestUrl.searchParams.get('endDate')).toBe('2026-11-05');
    expect(requestUrl.searchParams.get('state')).toBe('Có khách');
    expect(requestUrl.searchParams.get('page')).toBe('2');
    expect(requestUrl.searchParams.get('limit')).toBe('50');
  });
});

describe('changePassword', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    api.clearAccessToken();
  });

  test('sends the CSRF header and refresh cookie with the password change request', async () => {
    api.setAccessToken('access-token');
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: jest.fn().mockReturnValue('application/json') },
      json: jest.fn().mockResolvedValue({ success: true }),
    });

    await expect(api.changePassword({
      currentPassword: 'old-password',
      newPassword: 'new-password',
    })).resolves.toEqual({ success: true });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/change-password'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer access-token',
          'X-CSRF-Protection': '1',
        },
        body: JSON.stringify({
          currentPassword: 'old-password',
          newPassword: 'new-password',
        }),
      })
    );
  });
});

describe('recordActivity', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    api.clearAccessToken();
  });

  test('returns false when the refresh session has expired', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ status: 401 });

    await expect(api.recordActivity()).resolves.toBe(false);
  });

  test('rotates the refresh cookie and saves the renewed access token', async () => {
    api.setAccessToken('old-access-token');
    jest.spyOn(global, 'fetch').mockResolvedValue({
      status: 200,
      ok: true,
      json: jest.fn().mockResolvedValue({
        accessToken: 'renewed-access-token',
        user: { username: 'admin', role: 'admin' },
      }),
    });

    await expect(api.recordActivity()).resolves.toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/refresh'),
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Protection': '1',
        },
        credentials: 'include',
      })
    );
    expect(api.getAccessToken()).toBe('renewed-access-token');
  });
});
