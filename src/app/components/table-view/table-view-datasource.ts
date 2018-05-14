import { DataSource } from '@angular/cdk/collections';
import { MatPaginator, MatSort } from '@angular/material';
import { map } from 'rxjs/operators';
import { Observable, of as observableOf, merge } from 'rxjs';

// TODO: Replace this with your own data model type
export interface TableViewItem {
    class: string,
    sourceId: string,
    createdBy: string,
    name: string,
    description: string,
    source: string,
    rid: string,
    version: number,
}

// TODO: replace this with real data from your application
// const EXAMPLE_DATA: TableViewItem[] = [
//   {id: 1, name: 'Hydrogen', desc: 'hy'},
//   {id: 2, name: 'Helium', desc: 'hy'},
//   {id: 3, name: 'Lithium', desc: 'hy'},
//   {id: 4, name: 'Beryllium', desc: 'hy'},
//   {id: 5, name: 'Boron', desc: 'hy'},
//   {id: 6, name: 'Carbon', desc: 'hy'},
//   {id: 7, name: 'Nitrogen', desc: 'hy'},
//   {id: 8, name: 'Oxygen', desc: undefined},
//   {id: 9, name: 'Fluorine', desc: 'hy'},
//   {id: 10, name: 'Neon', desc: 'hy'},
//   {id: 11, name: 'Sodium', desc: 'hy'},
//   {id: 12, name: 'Magnesium', desc: 'hy'},
//   {id: 13, name: 'Aluminum', desc: 'hy'},
//   {id: 14, name: 'Silicon', desc: 'hy'},
//   {id: 15, name: 'Phosphorus', desc: 'hy'},
//   {id: 16, name: 'Sulfur', desc: 'hy'},
//   {id: 17, name: 'Chlorine', desc: 'hy'},
//   {id: 18, name: 'Argon', desc: 'hy'},
//   {id: 19, name: 'Potassium', desc: 'hy'},
//   {id: 20, name: 'Calcium', desc: 'hy'},
// ];

/**
 * Data source for the TableView view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class TableViewDataSource extends DataSource<TableViewItem> {
  data: TableViewItem[];

  constructor(private paginator: MatPaginator, private sort: MatSort, private inData: TableViewItem[]) {
    super();
    this.data = inData;
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */
  connect(): Observable<TableViewItem[]> {
    // Combine everything that affects the rendered data into one update
    // stream for the data-table to consume.
    const dataMutations = [
      observableOf(this.data),
      this.paginator.page,
      this.sort.sortChange
    ];

    // Set the paginators length
    this.paginator.length = this.data.length;

    return merge(...dataMutations).pipe(map(() => {
      return this.getPagedData(this.getSortedData([...this.data]));
    }));
  }

  /**
   *  Called when the table is being destroyed. Use this function, to clean up
   * any open connections or free any held resources that were set up during connect.
   */
  disconnect() {}

  /**
   * Paginate the data (client-side). If you're using server-side pagination,
   * this would be replaced by requesting the appropriate data from the server.
   */
  private getPagedData(data: TableViewItem[]) {
    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    return data.splice(startIndex, this.paginator.pageSize);
  }

  /**
   * Sort the data (client-side). If you're using server-side sorting,
   * this would be replaced by requesting the appropriate data from the server.
   */
  private getSortedData(data: TableViewItem[]) {
    if (!this.sort.active || this.sort.direction === '') {
      return data;
    }

    return data.sort((a, b) => {
      const isAsc = this.sort.direction === 'asc';
      switch (this.sort.active) {
        case 'class': return compare(a.class, b.class, isAsc);
        case 'sourceId': return compare(a.sourceId, b.sourceId, isAsc);
        case 'createdBy': return compare(a.createdBy, b.createdBy, isAsc);
        case 'name': return compare(a.name, b.name, isAsc);
        case 'rid-version': return compare(a.rid.split(':')[1], b.rid.split(':')[1], isAsc)
        
        default: return 0;
      }
    });
  }
}

/** Simple sort comparator for example ID/Name columns (for client-side sorting). */
function compare(a, b, isAsc) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
