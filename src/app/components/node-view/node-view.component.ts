import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { TableViewItem } from '../table-view/table-view-datasource';
import { MatSnackBar} from '@angular/material';
import { Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
@Component({  
  selector: 'node-view',
  templateUrl:'./node-view.component.html',
  styleUrls: ['./node-view.component.css'],
  providers: [MatSnackBar],
})
export class NodeViewComponent {
  @Input('node') node: TableViewItem;
  @Output() changed = new EventEmitter<TableViewItem>();
  @Output() editing = new EventEmitter<boolean>();
  private _editing = false;
  private _temp: TableViewItem;

  constructor(public snackBar:MatSnackBar){}

  addChild(){
    this.snackBar.open('Child added!');
  }
  editSelected(){
    this.enterEdit();
    this._editing = true;
    this.editing.emit(true);
  }
  deleteSelected(){
    this.snackBar.open('Goodbye!');        
  }
  doneEdit(){
    this.recall();    
    console.log(this.node.description);
    this.node.version++;
    this.changed.emit(this.node);
    this._editing = false;
    this.editing.emit(false);
  }
  cancelEdit(){
    this._editing = false;
    this.editing.emit(false);
  }

  enterEdit(){
    this._temp = {
      class: this.node.class,
      sourceId: this.node.sourceId,
      createdBy: this.node.createdBy,
      name: this.node.name,
      description: this.node.description,
      source: this.node.source,
      rid: this.node.rid,
      version: this.node.version,
    }
  }
  
  recall(){
    this.node = this._temp;
  }

}