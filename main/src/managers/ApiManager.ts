import NetInfo from "@react-native-community/netinfo";
import { Platform } from "react-native";

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    [key: string]: any;
}

export interface ApiConfig {
    endpoint: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    params?: Record<string, any>;
    token?: string;
    showError?: boolean;
    showSuccess?: boolean;
    isFormData?: boolean;
}

const BASE_URL = "https://gayatriorganicfarm.com";

export default class ApiManager {
    static async request<T = any>({
        endpoint,
        method = "GET",
        params = {},
        token = "",
        showError = true,
        showSuccess = false,
        isFormData = false,
    }: ApiConfig): Promise<ApiResponse<T>> {
        // ✅ Check internet
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
            throw new Error("No internet connection");
        }

        const url = `${BASE_URL}${endpoint}`;

        // 🔥 CRITICAL: For FormData, headers must be minimal
        // React Native will automatically set Content-Type with boundary
        const headers: Record<string, string> = {
            "platform": Platform.OS,
        };

        // Only add these headers for non-FormData requests
        if (!isFormData) {
            headers["Accept"] = "application/json";
            headers["Content-Type"] = "application/json";
        }

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const options: RequestInit = {
            method,
            headers,
        };

        // Handle request body for non-GET requests
        if (method !== "GET" && params) {
            options.body = isFormData ? (params as any) : JSON.stringify(params);
        }

        try {
            if (__DEV__) {
                console.log('[ApiManager] Request:', {
                    url,
                    method,
                    isFormData,
                    hasToken: !!token,
                });
            }

            const response = await fetch(url, options);

            let json;
            try {
                json = await response.json();
            } catch (parseError) {
                const errorMsg = 'Invalid response from server';
                console.error('[ApiManager] Failed to parse response:', parseError);
                throw new Error(errorMsg);
            }

            if (__DEV__) {
                console.log('[ApiManager] Response:', {
                    status: response.status,
                    ok: response.ok,
                    endpoint,
                });
            }

            if (!response.ok) {
                const errorMessage = json.message || json.error || "Request failed";

                if (showError) {
                    console.warn(`❌ ${errorMessage}`);
                }
                throw new Error(errorMessage);
            }

            if (showSuccess && json.message) {
                console.log(`✅ ${json.message}`);
            }

            return json as ApiResponse<T>;
        } catch (err: any) {
            // Handle network errors that don't have a message property
            if (showError) {
                const errorMessage = err.message || "Network error occurred";
                console.error('[ApiManager] Error:', errorMessage);
            }
            throw err;
        }
    }

    // 👉 Shortcut methods
    static get<T = any>({ endpoint, token }: { endpoint: string, token?: string }) {
        return this.request<T>({ endpoint, method: "GET", token });
    }

    static post<T = any>({ endpoint, params, token }: { endpoint: string, params?: any, token?: string }) {
        return this.request<T>({ endpoint, method: "POST", params, token });
    }

    static put<T = any>({ endpoint, params, token }: { endpoint: string, params?: any, token?: string }) {
        return this.request<T>({ endpoint, method: "PUT", params, token });
    }

    static delete<T = any>({ endpoint, token }: { endpoint: string, token?: string }) {
        return this.request<T>({ endpoint, method: "DELETE", token });
    }

    static upload<T = any>({ endpoint, formData, token }: { endpoint: string, formData: FormData, token?: string }) {
        return this.request<T>({ endpoint, method: "POST", params: formData, token, isFormData: true });
    }
}
