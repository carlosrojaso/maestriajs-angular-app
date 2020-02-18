import { Component, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  @Input() titleFooter: string;
  @Input() connectionStatus: string;
  @Output() openDialog = new EventEmitter();

  onSave() {
    this.openDialog.emit('true');
  }
}
