import { Http } from '@capacitor-community/http';
import { Preferences } from '@capacitor/preferences';

const API_BASE_URL_KEY = 'api_base_url';

export async function setApiBaseUrl(url) {
  await Preferences.set({ key: API_BASE_URL_KEY, value: url });
}

export async function getApiBaseUrl() {
  const { value } = await Preferences.get({ key: API_BASE_URL_KEY });
  return value || '';
}

let token = null;

export function setAccessToken(t) {
  token = t;
}

export function getAccessToken() {
  return token;
}

async function doRequest(method, path, body, retryCount = 0) {
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl.replace(/\/$/, '')}${path}`;
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
    url
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await Http.request(options);
  } catch (err) {
    if (err.status === 401 && retryCount === 0 && token) {
      const refreshed = await refreshToken();
      if (refreshed) {
        return doRequest(method, path, body, 1);
      }
    }
    throw new Error(`${err.status || 'Network error'} ${err.message || ''}`);
  }

  if (!res.status || res.status < 200 || res.status >= 300) {
    throw new Error(`${res.status} ${res.statusText || 'Request failed'}`);
  }

  return res.data;
}

async function refreshToken() {
  const { value: refreshToken } = await Preferences.get({ key: 'refresh_token' });
  const { value: tenantId } = await Preferences.get({ key: 'azure_tenant_id' });
  const { value: clientId } = await Preferences.get({ key: 'azure_client_id' });
  const { value: scope } = await Preferences.get({ key: 'azure_scope' });

  if (!refreshToken || !tenantId || !clientId) {
    return false;
  }

  try {
    const res = await Http.request({
      method: 'POST',
      url: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        scope: scope || ''
      })
    });

    if (res.data && res.data.access_token) {
      token = res.data.access_token;
      await Preferences.set({ key: 'access_token', value: token });
      if (res.data.refresh_token) {
        await Preferences.set({ key: 'refresh_token', value: res.data.refresh_token });
      }
      return true;
    }
  } catch (err) {
    console.error('Token refresh failed:', err);
  }
  return false;
}

export const ApiService = {
  getEmployee: (id) => doRequest('GET', `/api/Employees/${id}`),
  getEmployees: () => doRequest('GET', `/api/Employees`),
  getTimesheet: (empId, date, create) =>
    doRequest('GET', `/api/Timesheets?employeeId=${empId}&referenceDate=${encodeURIComponent(date)}&includeEntries=true&createTimesheet=${create}`),
  submitTimesheet: (id, val) => doRequest('PUT', `/api/Timesheets/${id}/submit`, val),
  addEntry: (entry) => doRequest('POST', `/api/Entries`, entry),
  updateEntry: (entry) => doRequest('PUT', `/api/Entries`, entry),
  deleteEntry: (id) => doRequest('DELETE', `/api/Entries/${id}`),
  getClients: () => doRequest('GET', `/api/Clients`),
  getProjects: () => doRequest('GET', `/api/Projects`),
  getItems: () => doRequest('GET', `/api/Items`),
  getEmployeeItems: (empId) => doRequest('GET', `/employee/${empId}`),
  getLocations: (empId) => doRequest('GET', `/api/Locations?employeeId=${empId}`),
  getFavourites: (empId) => doRequest('GET', `/api/Entries/favourite/${empId}`),
  addFavourite: (fav) => doRequest('POST', `/api/Entries/favourite`, fav),
  updateFavourite: (fav) => doRequest('PUT', `/api/Entries/favourite`, fav),
  deleteFavourite: (id) => doRequest('DELETE', `/api/Entries/favourite/${id}`),
  getLeaveTypes: () => doRequest('GET', `/api/Leaves`),
  getLeaves: (empId) => doRequest('GET', `/api/Leaves/${empId}`),
  addLeave: (empId, leave) => doRequest('POST', `/api/Leaves/${empId}`, leave),
  deleteLeave: (id) => doRequest('DELETE', `/api/Leaves/${id}`),
};

export function isCapacitor() {
  return window.Capacitor?.isNativePlatform?.() === true;
}
