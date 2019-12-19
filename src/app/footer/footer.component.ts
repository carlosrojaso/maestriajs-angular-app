import { Component, OnInit } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

import { FormDialogComponent } from '../form-dialog/form-dialog.component';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  modalDialog: any;

  constructor(public dialog: MatDialog) { }

  ngOnInit() {
  }

  openDialog() {
    this.modalDialog = this.dialog.open(FormDialogComponent, {
      height: '400px',
      width: '600px',
    });
  }

}
