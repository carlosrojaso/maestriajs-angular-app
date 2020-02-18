import { Component, OnInit } from '@angular/core';
import { AppsyncService } from '../appsync.service';

import { MatDialog } from '@angular/material/dialog';
import { FormDialogComponent } from '../form-dialog/form-dialog.component';

import uuidv4 from 'uuid/v4';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  title = 'angular-app';
  tasks: any;

  constructor(
    private taskDataService: AppsyncService,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.getTasks();
  }

  getTask(id) {
    return this.tasks.find(item => item.id === id);
  }

  getTasks() {
    // this.tasks = response.map((item) => ({id: item.id, name: item.title, description: item.body}));
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
        const newIndex = uuidv4();
        result.id = newIndex;

        this.tasks.push(result);
    });
  }
}
