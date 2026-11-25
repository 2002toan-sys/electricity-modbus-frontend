const runtimeEnvironment = typeof window === 'undefined' ? {} : window._env_ || {};

function getRequiredEnvironmentValue(name) {
  const value = runtimeEnvironment[name] ?? process.env[name];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} must be configured`);
  }
  return value;
}

export const apiBase = getRequiredEnvironmentValue('REACT_APP_API_BASE');
export const socketUrl = getRequiredEnvironmentValue('REACT_APP_SOCKET_URL');
