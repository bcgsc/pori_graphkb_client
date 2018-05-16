import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'camelCase'})
export class CamelCasePipe implements PipeTransform {
  transform(value: string):string {
      value = value.charAt(0).toUpperCase() + value.slice(1);
    return value.replace(/[A-Z]/g, match => {
        return ' ' + match;
      });
  }
}