import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TaskDataService {
  apiUrl = 'https://jsonplaceholder.typicode.com';

  constructor(private http: HttpClient) {}

  createTask(task) {
    return this.http.post(`${this.apiUrl}/posts/`, task);
  }

  deleteTask(id) {
    return this.http.delete(`${this.apiUrl}/posts/${id}`);
  }

  getTasks(id) {
    return this.http.get(`${this.apiUrl}/users/${id}/posts`);
  }

  putTask(task) {
    const taskToEdit = {
      id: task.id,
      title: task.name,
      body: task.description,
      userId: 1
    };
    return this.http.put(`${this.apiUrl}/posts/${task.id}`, taskToEdit, {
      headers: new HttpHeaders().set('Content-type', 'application/json; charset=UTF-8')
    });
  }
}
