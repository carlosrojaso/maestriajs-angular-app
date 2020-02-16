import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-form-dialog',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss']
})
export class FormDialogComponent implements OnInit {

  newTask: any = {};
  isEditing = false;
  actionTag = 'Add';

  constructor(
    public dialogRef: MatDialogRef<FormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
    if (this.data) {
      console.log(this.data);
      this.isEditing = true;
      this.actionTag = 'Edit';
      this.newTask = this.data;
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  saveTask() {
    this.dialogRef.close(this.newTask);
  }

  editTask() {
    this.dialogRef.close(this.newTask);
  }
}
