import { Component, OnInit } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { FormDialogComponent } from '../form-dialog/form-dialog.component';

import { DataStore } from '@aws-amplify/datastore';
import { Todo } from '../../models';
import uuid from 'uuid/v4';

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
  }

  getTask(id) {
    return this.tasks.find(item => item.id === id);
  }

  async getTasks() {
    const todos: any = await DataStore.query<any>(Todo);
    return todos.map((elem: any) => ({...elem}));
  }

  async delete(id) {
    const todelete = await DataStore.query<any>(Todo, id);
    DataStore.delete(todelete).then(
      () => {
        const taskToDelete = this.tasks.findIndex((item) => (item.id === id));
        this.tasks.splice(taskToDelete, 1);
      }
    );
  }

  edit(id) {
    const taskToEdit = this.getTask(id);
    const dialogRef = this.dialog.open(FormDialogComponent, { data: taskToEdit });
    dialogRef.afterClosed().subscribe(
      async (result) => {

        const original = await DataStore.query<any>(Todo, id);

        console.log('original', original);

        await DataStore.save(
          Todo.copyOf(original, updated => {
            updated.name = result.name;
            updated.description = result.description;
          })
        ).then(
          () => {
            this.tasks[taskToEdit] = result;
          }
        );
    });
  }

  save() {
    const dialogRef = this.dialog.open(FormDialogComponent);
    dialogRef.afterClosed().subscribe(
      async (result) => {
        const newIndex = uuid();
        result.id = newIndex;

        await DataStore.save(new Todo(
          result
        )).then(
          () => {
            this.tasks.push(result);
          }
        );
    });
  }
}
