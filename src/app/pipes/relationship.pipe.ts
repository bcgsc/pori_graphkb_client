import { Pipe, PipeTransform } from '@angular/core';
import { Edge } from '../components/add-node-view/add-node-view.component';

@Pipe({ name: 'relationshipPipe' })
export class RelationshipPipe implements PipeTransform {
    transform(edge: Edge): string {
        let str;
        if (edge.type == 'subclassof') {
            edge.in ? str = 'Parent: ' + edge.in : str = 'Child: ' + edge.out;
        } else {
            str = 'Alias: ';
            edge.in ? str += edge.in : str += edge.out;
        }
        return str;

    }
}
