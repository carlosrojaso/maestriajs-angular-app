import { Component, OnInit } from '@angular/core';
import { TaskDataService } from '../task-data.service';

import { MatDialog } from '@angular/material/dialog';
import { FormDialogComponent } from '../form-dialog/form-dialog.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  title = 'angular-app';
  tasks: any;

  constructor(
    private taskDataService: TaskDataService,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.getTasks();
  }

  getTask(id) {
    return this.tasks.find(item => item.id === id);
  }

  getTasks() {
    this.taskDataService.getTasks(1).subscribe(
      (response: Array<any>) => {
        this.tasks = response.map((item) => ({id: item.id, name: item.title, description: item.body}));
      }
    );
  }

  delete(id) {
    const taskToDelete = this.tasks.findIndex((item) => (item.id === id));
    this.taskDataService.deleteTask(id).subscribe(
      () => {
        this.tasks.splice(taskToDelete, 1);
      }
    );
  }

  edit(id) {
    const taskToEdit = this.getTask(id);
    const dialogRef = this.dialog.open(FormDialogComponent, { data: taskToEdit });
    dialogRef.afterClosed().subscribe(
      (result) => {
        this.taskDataService.putTask(result).subscribe(
          () => {
            this.tasks[taskToEdit] = result;
          }
        );
    });
  }

  save() {
    const dialogRef = this.dialog.open(FormDialogComponent);
    dialogRef.afterClosed().subscribe(
      (result) => {
        const newIndex = this.tasks.length + 1;
        result.id = newIndex;

        this.taskDataService.createTask(result).subscribe(
          () => {
            this.tasks.push(result);
          }
        );
    });
  }
}
