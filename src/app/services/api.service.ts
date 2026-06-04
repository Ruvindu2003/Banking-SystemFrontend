import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {}

  getTodo(): Observable<any> {
    // Return a mock object for compatibility with current code
    return of({ id: 1, title: 'Mock Todo from ApiService' });
  }
}
