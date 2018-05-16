import { Component } from '@angular/core';
import { APIService } from '../../services/api.service';

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
  private params: DiseaseParams;

  constructor(private api: APIService) {
    this.params = {
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
    }
  }
  
  advanced() {
    this.adv = !this.adv;
  }

  query() {
    let filteredParams = {};

    Object.keys(this.params).forEach(key => {
      if(this.params[key]) filteredParams[key] = this.params[key];
    });

    this.api.query(filteredParams);
  }
}