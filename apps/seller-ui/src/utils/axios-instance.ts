import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URI,
  withCredentials: true
})

let isRefreshing = false
let refreshSubscribers: (()=> void)[] = []

// Handle logout and prevent infinite loops
const handleLogout = () => {
  if(window.location.pathname !== '/login'){
    window.location.href = '/login'
  }
}

// Handle adding the new request token the queued requests
const subscribeTokenRefresh = (callback: () => void) => {
  refreshSubscribers.push(callback)
}

// Execute queued requests after refresh
const onRefreshSuccess = () => {
  refreshSubscribers.forEach((callback) => callback())
  refreshSubscribers = []
}

// Handle API requests
axiosInstance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

// Handle expired token and refresh logic
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {

      // If refresh already running → queue request
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh(() => resolve(axiosInstance(originalRequest)));
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_SERVER_URI}/api/refresh-token`,
          {},
          { withCredentials: true }
        );

        isRefreshing = false;
        onRefreshSuccess();

        return axiosInstance(originalRequest);

      } catch (err) {
        isRefreshing = false;
        refreshSubscribers = [];
        handleLogout();
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance