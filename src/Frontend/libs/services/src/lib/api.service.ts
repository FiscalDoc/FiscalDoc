import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../apps/web/src/environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly _http = inject(HttpClient);
  private readonly _base = environment.apiUrl;

  get<T>(path: string, params?: Record<string, unknown>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v != null) httpParams = httpParams.set(k, String(v));
      });
    }
    return this._http.get<T>(`${this._base}${path}`, { params: httpParams });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this._http.post<T>(`${this._base}${path}`, body);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this._http.put<T>(`${this._base}${path}`, body);
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this._http.patch<T>(`${this._base}${path}`, body);
  }

  delete<T>(path: string): Observable<T> {
    return this._http.delete<T>(`${this._base}${path}`);
  }

  postForm<T>(path: string, form: FormData): Observable<T> {
    return this._http.post<T>(`${this._base}${path}`, form);
  }

  getBlob(path: string, params?: Record<string, unknown>): Observable<Blob> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v != null) httpParams = httpParams.set(k, String(v));
      });
    }
    return this._http.get(`${this._base}${path}`, { params: httpParams, responseType: 'blob' });
  }
}
