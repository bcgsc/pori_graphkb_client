import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'subsetsPipe' })
export class SubsetsPipe implements PipeTransform {
  transform(value: string[]): string {


    let concat: string = ''

    if (value) value.forEach(subset => {
      let subName = subset.split('#')[1] || subset;

      concat += subName + ", "
    });
    return concat.substr(0, concat.length - 2);
  }
}

@Pipe({ name: 'subsetPipe' })
export class SubsetPipe implements PipeTransform {
  transform(value: string): string {

      let subName = value.split('#')[1] || value;

    return subName;
  }
}