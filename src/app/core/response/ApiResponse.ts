export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
  meta?: any;  
  cached?: boolean;
}

export class ApiResponse {
  static success<T>(message: string, data?: T, meta?: any, cached?: boolean) {
    const response: IApiResponse<T> = { success: true, message };
    if (data) response.data = data;
    if (meta) response.meta = meta;
    if (cached !== undefined) response.cached = cached;
    return response;
  }

  static fail(message: string, errors?: any) {
    const response: IApiResponse = { success: false, message };
    if (errors) response.errors = errors;
    return response;
  }
}
