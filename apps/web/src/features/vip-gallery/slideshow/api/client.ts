import axios from "axios";

const PUBLIC_API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

export const slideshowApi = axios.create({
    baseURL: PUBLIC_API_BASE_URL,
    timeout: 30000,
    headers: {
        Accept: "application/json",
    },
});

export default slideshowApi;
