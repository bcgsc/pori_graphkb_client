import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'subsetsPipe' })
export class SubsetsPipe implements PipeTransform {
  transform(value: string[]): string {
    let concat: string = ''

    if (value) value.forEach(subset => {
      let subName: string = subset.split('#').slice(1).toString() || subset;
      let s = subName.split('_') || [subName];

      s.forEach(word => {
        concat += word[0].toUpperCase() + word.slice(1).toLowerCase() + ' ';
      });

      concat = concat.substr(0, concat.length - 1) + ', ';
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