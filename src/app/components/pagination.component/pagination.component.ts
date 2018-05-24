import { Component, Input, EventEmitter, Output } from '@angular/core';
@Component({
    selector:'my-pagination',
    templateUrl: './pagination.component.html',
    styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent {
    @Input() page: number; 
    @Input() count: number;
    @Input() perPage: number;
    @Input() pagesToShow: number; 

    @Output() goPrev = new EventEmitter<boolean>();
    @Output() goNext = new EventEmitter<boolean>();
    @Output() goPage = new EventEmitter<number>();

    constructor() { }

    getMin(): number {
        return (this.perPage * (this.page - 1)) + 1;
    }

    getMax(): number {
        let max = this.perPage * this.page;
        if (max > this.count) {
            max = this.count;
        }
        return max;
    }

    onPage(n: number): void {
        this.goPage.emit(n);
    }

    onPrev(): void {
        this.goPrev.emit(true);
    }

    onNext(): void {
        this.goNext.emit(true);
    }

    onFirst():void{
        this.goPage.emit(1);
    }
    onLast(): void{
        this.goPage.emit(this.totalPages())
    }

    totalPages(): number {
        return Math.ceil(this.count / this.perPage) || 0;
    }

    lastPage(): boolean {
        return this.perPage * this.page >= this.count;
    }

    getPages(): number[] {
        let pages: number[] = [];
        
        // push selected page
        pages.push(this.page);

        // push adjacent pages on both sides of current page
        for (let i = 0; i < this.pagesToShow-1; i++) {
            if (pages.length < this.pagesToShow) {
                if (Math.min.apply(null, pages) > 1) {
                    pages.push(Math.min.apply(null, pages) - 1);
                }
            }
            if (pages.length < this.pagesToShow) {
                if (Math.max.apply(null, pages) < this.totalPages()) {
                    pages.push(Math.max.apply(null, pages) + 1);
                }
            }
        }

        pages.sort((a, b) => a - b);
        return pages;
    }

}