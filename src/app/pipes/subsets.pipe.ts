import { Pipe, PipeTransform } from '@angular/core';
/*
 * Raise the value exponentially
 * Takes an exponent argument that defaults to 1.
 * Usage:
 *   value | exponentialStrength:exponent
 * Example:
 *   {{ 2 | exponentialStrength:10 }}
 *   formats to: 1024
*/
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