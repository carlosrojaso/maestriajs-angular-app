import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortener'
})
export class ShortenerPipe implements PipeTransform {

  transform(value: any, ...args: any[]): any {
    return value.substr(1, 50) + '...';
  }

}
