import { Http } from '@capacitor-community/http';
import { Preferences } from '@capacitor/preferences';

function isCapacitor() {
  return window.Capacitor?.isNativePlatform?.() === true;
}

async function doFetch(url, options = {}) {
  if (isCapacitor()) {
    const res = await Http.request({
      method: options.method || 'GET',
      url,
      headers: options.headers,
      body: options.body
    });
    
    const response = {
      ok: res.status >= 200 && res.status < 300,
      status: res.status,
      json: async () => res.data,
      text: async () => typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
    };
    return response;
  } else {
    return fetch(url, options);
  }
}

export const requestDeviceCode = async (tenantId, clientId, scope) => {
  if (isCapacitor()) {
    const response = await doFetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/devicecode`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          scope: scope
        }).toString()
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || 'Failed to initiate device code flow');
    }

    return response.json();
  } else {
    const response = await fetch(
      `/oauth/devicecode/${tenantId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          scope: scope
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || 'Failed to initiate device code flow');
    }

    return response.json();
  }
};

export const pollForToken = async (tenantId, clientId, deviceCode) => {
  const makeRequest = async () => {
    if (isCapacitor()) {
      return doFetch(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            device_code: deviceCode,
            client_id: clientId
          }).toString()
        }
      );
    } else {
      return fetch(
        `/oauth/token/${tenantId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            device_code: deviceCode,
            client_id: clientId
          })
        }
      );
    }
  };

  const response = await makeRequest();
  const data = await response.json();

  if (!response.ok) {
    if (data.error === 'authorization_pending') {
      return null;
    }
    if (data.error === 'expired_token') {
      throw new Error('Device code expired. Please try again.');
    }
    if (data.error === 'slow_down') {
      throw new Error('Slow down. Please wait and try again.');
    }
    throw new Error(data.error_description || data.error || 'Token request failed');
  }

  return data;
};

export const refreshAccessToken = async (refreshToken, tenantId, clientId, scope) => {
  const makeRequest = async () => {
    if (isCapacitor()) {
      return doFetch(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            scope: scope
          }).toString()
        }
      );
    } else {
      return fetch(
        `/oauth/token/${tenantId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            scope: scope
          })
        }
      );
    }
  };

  const response = await makeRequest();

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error_description || 'Token refresh failed');
  }

  return response.json();
};

export async function saveAuthTokens(accessToken, refreshToken, tenantId, clientId, scope) {
  await Preferences.set({ key: 'access_token', value: accessToken });
  if (refreshToken) {
    await Preferences.set({ key: 'refresh_token', value: refreshToken });
  }
  await Preferences.set({ key: 'azure_tenant_id', value: tenantId });
  await Preferences.set({ key: 'azure_client_id', value: clientId });
  await Preferences.set({ key: 'azure_scope', value: scope });
}

export async function loadAuthTokens() {
  const { value: accessToken } = await Preferences.get({ key: 'access_token' });
  const { value: refreshToken } = await Preferences.get({ key: 'refresh_token' });
  return { accessToken, refreshToken };
}

export async function clearAuthTokens() {
  await Preferences.remove({ key: 'access_token' });
  await Preferences.remove({ key: 'refresh_token' });
  await Preferences.remove({ key: 'azure_tenant_id' });
  await Preferences.remove({ key: 'azure_client_id' });
  await Preferences.remove({ key: 'azure_scope' });
  await Preferences.remove({ key: 'api_base_url' });
}
