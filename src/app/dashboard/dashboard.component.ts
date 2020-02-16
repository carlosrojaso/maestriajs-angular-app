import { Component, OnInit } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { FormDialogComponent } from '../form-dialog/form-dialog.component';

import Amplify from 'aws-amplify';
import { DataStore } from '@aws-amplify/datastore';
import { Todo } from '../../models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  title = 'angular-app';
  tasks: any;

  constructor(
    public dialog: MatDialog
  ) {}

  async ngOnInit() {
    this.tasks = await this.getTasks();
    console.log(this.tasks);

    const subscription: any = DataStore.observe<Todo>(Todo).subscribe(msg => {
      console.log(msg.model, msg.opType, msg.element);
    });
  }

  getTask(id) {
    return this.tasks.find(item => item.id === id);
  }

  async getTasks() {
    const todos: any = await DataStore.query<Todo>(Todo);
    return todos;
  }

  delete(id) {
    const taskToDelete = this.tasks.findIndex((item) => (item.id === id));

    this.tasks.splice(taskToDelete, 1);

  }

  edit(id) {
    const taskToEdit = this.getTask(id);
    const dialogRef = this.dialog.open(FormDialogComponent, { data: taskToEdit });
    dialogRef.afterClosed().subscribe(
      (result) => {
        this.tasks[taskToEdit] = result;
    });
  }

  save() {
    const dialogRef = this.dialog.open(FormDialogComponent);
    dialogRef.afterClosed().subscribe(
      (result) => {
        const newIndex = this.tasks.length + 1;
        result.id = newIndex;
        this.tasks.push(result);
    });
  }
}
