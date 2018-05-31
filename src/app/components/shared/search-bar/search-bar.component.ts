import { Component, Input, Output, EventEmitter } from '@angular/core';
import { APIService } from '../../../services/api.service';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import 'rxjs/add/operator/debounceTime';
import * as jc from 'json-cycle';

/**
 * Component to handle all query preparations from the user.
 */
@Component({
    selector: 'search-bar',
    templateUrl: './search-bar.component.html',
    styleUrls: ['./search-bar.component.scss'],
    providers: [APIService]
})
export class SearchBarComponent {
    @Input() placeholder: string;
    @Input() icon: string;
    @Input() color: string;
    @Input() buttonText: string;
    @Input() matInput: boolean;

    @Output() query = new EventEmitter<any>();

    searchTerm: FormControl = new FormControl();
    searchResult = [];

    constructor(private api: APIService, private router: Router) {
        /**
         * Initializes autocorrect functionality for edge adding form.
         */
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
                });
            });
    }

    onSearch() {
        if (this.searchTerm.value) this.query.emit(this.searchTerm.value);
        this.searchTerm.setValue('');
    }
}