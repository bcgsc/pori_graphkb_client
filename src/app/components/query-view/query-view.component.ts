import { Component } from '@angular/core';
import { APIService } from '../../services/api.service';
import { Router } from '@angular/router';
import { DiseaseParams } from '../../models';
import { FormControl } from '@angular/forms';
import 'rxjs/add/operator/debounceTime';
import * as jc from 'json-cycle';

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
  private propKeys = Object.keys(this.properties);

  searchTerm: FormControl = new FormControl();
  searchResult = [];

  constructor(private api: APIService, private router: Router) {

    this.searchTerm.valueChanges
      .debounceTime(400)
      .subscribe(dat => {
        if (!dat) return;
        this.api.query({
          name: dat,
          fuzzyMatch: 1,
          limit: 10,
        }).subscribe(data => {
          data = jc.retrocycle(data);
          let temp = [];

          data.forEach(json => {
            temp.push(json.name);
          });
          this.searchResult = temp;
        })
      })

  }

  advanced() {
    this.adv = !this.adv;
  }

  simpleQuery() { //neighbors: 2
    if (this.searchTerm.value) this.router.navigate(['/table'], {
      queryParams: {
        name: this.searchTerm.value,
        ancestors: 'subclassof',
        descendants: 'subclassof',
      }
    });
  }

  query() {
    //TODO: sanitize untouched form 
    /* Process returnProperties: */
    let reqDefault = true;
    let returnProperties = '';

    if (this.relatedNodes.parents) this.params.ancestors += 'subclassof';
    if (this.relatedNodes.children) this.params.descendants += 'subclassof';
    if (this.relatedNodes.aliases) {

      this.params.ancestors ? this.params.ancestors += ',aliasof' : this.params.ancestors += 'aliasof';
      this.params.descendants ? this.params.descendants += ',aliasof': this.params.descendants +='aliasof';
    }

    this.propKeys.forEach(key => {
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