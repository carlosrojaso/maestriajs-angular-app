import { Component } from '@angular/core';
import { DummyData } from './dummy-tasks';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'maestriajs-angular-app';
  tasks: any = DummyData;

  edit(id) {}
  delete(id) {}
}
