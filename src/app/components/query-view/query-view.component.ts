import { Component } from '@angular/core';
import { APIService } from '../../services/api.service';
import { Router } from '@angular/router';
import { KBParams } from '../../models';
import { FormControl } from '@angular/forms';
import 'rxjs/add/operator/debounceTime';
import * as jc from 'json-cycle';

/**
 * Component to handle all query preparations from the user.
 */
@Component({
  selector: 'query-view',
  templateUrl: './query-view.component.html',
  styleUrls: ['./query-view.component.scss'],
  providers: [APIService]
})
export class QueryViewComponent {
  private _adv: boolean = false;

  private params: KBParams = {
    name: '',
    source: '',
    sourceId: '',
    sourceVersion: '',
    longName: '',
    sourceIdVersion: '',
    limit: 1000,
    returnProperties: '',
    ancestors: '',
    descendants: '',
    fuzzyMatch: undefined,
    // neighbors: 2,
  };

  private properties = {
    'name': true,
    'description': true,
    'subsets': true,
    'history': true,
    'createdBy': true,
    'createdAt': true,
    'deletedBy': true,
    'deletedAt': true,
    'source': true,
    'sourceVersion': true,
    'sourceId': true,
    'sourceIdVersion': true,
    'sourceUri': true,
    'uuid': true,
    'longName': true,
  };

  private relatedNodes = {
    parents: false,
    children: false,
    aliases: false,
  }
  private _propKeys = Object.keys(this.properties);

  constructor(private api: APIService, private router: Router) {
  }

  /**
   * Toggles advanced view.
   */
  advanced() {
    this._adv = !this._adv;
  }

  /**
   * Prepares a query taking in name parameter from the user. Attaches 
   * the ancestor and descendants headers to return parents and children of the
   * results.
   */
  simpleQuery(name) { //neighbors: 2
    this.router.navigate(['/results'], {
      queryParams: {
        name: name,
        ancestors: 'subclassof',
        descendants: 'subclassof',
      }
    });
  }

  /**
   * Prepares a query taking in all user defined parameters
   */
  query() {
    //TODO: sanitize untouched form 
    /* Process returnProperties: */
    let reqDefault = true;
    let returnProperties = '';

    if (this.relatedNodes.children) this.params.ancestors += 'subclassof';
    if (this.relatedNodes.parents) this.params.descendants += 'subclassof';
    if (this.relatedNodes.aliases) {

      this.params.ancestors ? this.params.ancestors += ',aliasof' : this.params.ancestors += 'aliasof';
      this.params.descendants ? this.params.descendants += ',aliasof' : this.params.descendants += 'aliasof';
    }

    this._propKeys.forEach(key => {
      this.properties[key] ? returnProperties += key + ',' : reqDefault = false;
    });

    !reqDefault ? this.params.returnProperties = returnProperties.slice(0, returnProperties.length - 1) : this.params.returnProperties = '';

    /* Filter out empty parameters from api call */
    let filteredParams: KBParams = {};

    Object.keys(this.params).forEach(key => {
      if (this.params[key]) filteredParams[key] = this.params[key];
    });

    /* Add parameters to route to be called by the api in the data hub component */
    this.router.navigate(['/results'], { queryParams: filteredParams })
  }
}