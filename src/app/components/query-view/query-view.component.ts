import { Component } from '@angular/core';
import { APIService } from '../../services/api.service';
import { Router } from '@angular/router';
import { DiseaseParams} from '../../models/models';

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
    fuzzyMatch: 1,
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
  private propKeys = Object.keys(this.properties);

  constructor(private api: APIService, private router: Router) {
  }

  advanced() {
    this.adv = !this.adv;
  }

  simpleQuery() { //neighbors: 2
    if (this.params.name) this.router.navigate(['/table'], { 
      queryParams: { 
        name: this.params.name, 
        fuzzyMatch: 1 
      } 
    });
  }

  query() {
    //TODO: sanitize untouched form 
    /* Process returnProperties: */
    let reqDefault = true;
    let returnProperties = ''

    Object.keys(this.properties).forEach(key => {
      this.properties[key] ? returnProperties += key + ',' : reqDefault = false;
    });

    !reqDefault ? this.params.returnProperties = returnProperties.slice(0, returnProperties.length - 1) : this.params.returnProperties = '';
    
    /* Filter out empty parameters from api call */
    let filteredParams: DiseaseParams = {};

    Object.keys(this.params).forEach(key => {
      if (this.params[key]) filteredParams[key] = this.params[key];
    });

    /* Add parameters to route to be called by the api in the data hub component */
    this.router.navigate(['/table'], { queryParams: filteredParams })
  }
}