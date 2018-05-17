import { Component } from '@angular/core';
import { APIService } from '../../services/api.service';
import { Router } from '@angular/router';

export interface DiseaseParams {
  name?: string,
  source?: string,
  sourceId?: string,
  sourceVersion?: string,
  longName?: string,
  sourceIdVersion?: string,
  limit?: number,
  returnProperties?: string,
  ancestors?: string,
  descendants?: string,
  fuzzyMatch?: number
}

@Component({
  selector: 'query-view',
  templateUrl: './query-view.component.html',
  styleUrls: ['./query-view.component.scss'],
  providers: [APIService]
})
export class QueryViewComponent {
  private adv: boolean = false;
  private params: DiseaseParams = {
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
    fuzzyMatch: 0
  };
  private properties = [
    ['name', true],
    ['description', true],
    ['subsets', true],
    ['history', true],
    // ['parents', true],
    // ['children', true],
    // ['aliases', true],
    ['createdBy', true],
    ['createdAt', true],
    ['deletedBy', true],
    ['deletedAt', true],
    ['source', true],
    ['sourceVersion', true],
    ['sourceId', true],
    ['sourceIdVersion', true],
    ['sourceUri', true],
    ['uuid', true],
    ['longName', true],
  ];

  constructor(private api: APIService, private router: Router) {
  }

  advanced() {
    this.adv = !this.adv;
  }

  simpleQuery() {
    if (this.params.name) this.router.navigate(['/table'], { queryParams: {name: this.params.name} })    
  }

  query() {
    
    let reqDefault = true;
    let returnProperties = ''

    this.properties.forEach(obj => {
      let term = obj[0];
      if (term == 'parents') term = 'out_SubClassOf'
      if (term == 'children') term = 'in_SubClassOf'
      if (term == 'aliases') {
        term = 'out_AliasOf,in_AliasOf';
      }

      if (!obj[1]) reqDefault = false;
      else returnProperties += term + ','
    });
    !reqDefault ? this.params.returnProperties = returnProperties.slice(0, returnProperties.length - 1) : this.params.returnProperties = '';


    let filteredParams: DiseaseParams = {};

    Object.keys(this.params).forEach(key => {
      if (this.params[key]) filteredParams[key] = this.params[key];
    });

    this.router.navigate(['/table'], { queryParams: filteredParams })
  }
}