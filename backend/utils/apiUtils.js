// utils/apiUtils.js
// Universal API utility for frontend (browser) use in Next.js

function buildQueryString(params) {
  if (!params) return '';
  const esc = encodeURIComponent;
  return (
    '?' +
    Object.keys(params)
      .map((k) => esc(k) + '=' + esc(params[k]))
      .join('&')
  );
}

async function handleResponse(res, responseType) {
  if (!res.ok) {
    let errorText = await res.text();
    throw new Error(errorText || res.statusText);
  }
  if (responseType === 'blob') return await res.blob();
  if (responseType === 'text') return await res.text();
  return await res.json();
}

const apiUtils = {
  async get(url, params = {}, options = {}) {
    let responseType = options.responseType || 'json';
    let query = params && Object.keys(params).length ? buildQueryString(params) : '';
    const res = await fetch(url + query, {
      method: 'GET',
      headers: options.headers || {},
    });
    return handleResponse(res, responseType);
  },

  async post(url, data = {}, options = {}) {
    let responseType = options.responseType || 'json';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res, responseType);
  },

  async put(url, data = {}, options = {}) {
    let responseType = options.responseType || 'json';
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res, responseType);
  },
};

export default apiUtils;
