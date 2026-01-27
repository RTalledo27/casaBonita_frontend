import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

type SearchSelectError = 'forbidden' | 'error' | null;

@Component({
  selector: 'app-search-select',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './search-select.component.html',
})
export class SearchSelectComponent implements OnInit, OnDestroy {
  @Input({ required: true }) searchFn!: (query: string) => Observable<any[]>;
  @Input() placeholderKey = '';
  @Input() minChars = 2;
  @Input() debounceMs = 250;
  @Input() disabled = false;
  @Input() noResultsKey = 'common.noData';
  @Input() noPermissionKey = 'common.noPermission';
  @Input() errorKey = 'common.errorLoad';

  @Input() getLabel: (item: any) => string = (item) => String(item?.label ?? item?.name ?? item?.id ?? '');
  @Input() getSubLabel: (item: any) => string = (item) => String(item?.subLabel ?? item?.email ?? '');
  @Input() getId: (item: any) => string | number = (item) => item?.id ?? this.getLabel(item);

  @Input() set value(item: any | null) {
    this._value = item;
    this.query = item ? (this.getLabel(item) ?? '').trim() : '';
  }
  get value(): any | null {
    return this._value;
  }
  private _value: any | null = null;

  @Output() valueChange = new EventEmitter<any | null>();

  query = '';
  open = false;
  loading = false;
  error: SearchSelectError = null;
  options: any[] = [];
  highlightedIndex = -1;

  private query$ = new Subject<string>();
  private subs = new Subscription();
  private cache = new Map<string, any[]>();

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    this.subs.add(
      this.query$
        .pipe(
          debounceTime(this.debounceMs),
          distinctUntilChanged(),
          switchMap((q) => {
            const query = (q ?? '').trim();
            this.error = null;
            this.highlightedIndex = -1;

            if (query.length < this.minChars) {
              this.loading = false;
              this.options = [];
              return of([]);
            }

            if (this.cache.has(query)) {
              this.loading = false;
              return of(this.cache.get(query) ?? []);
            }

            this.loading = true;
            return this.searchFn(query).pipe(
              catchError((err) => {
                this.loading = false;
                const status = err?.status;
                if (status === 403) this.error = 'forbidden';
                else this.error = 'error';
                return of([]);
              })
            );
          })
        )
        .subscribe((results) => {
          const q = (this.query ?? '').trim();
          if (q.length >= this.minChars && !this.cache.has(q) && results.length > 0) {
            this.cache.set(q, results);
          }
          this.options = results ?? [];
          this.loading = false;
          this.open = this.shouldOpenDropdown();
        })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onQueryChange(value: string): void {
    const v = value ?? '';
    const trimmed = v.trim();
    this.query = v;
    this._value = null;
    this.valueChange.emit(null);
    if (!trimmed) {
      this.loading = false;
      this.options = [];
      this.error = null;
      this.open = false;
      return;
    }
    this.open = true;
    this.query$.next(v);
  }

  onFocus(): void {
    if (this.disabled) return;
    this.open = this.shouldOpenDropdown();
    if (this.query?.trim()?.length >= this.minChars) {
      this.query$.next(this.query);
    }
  }

  onBlur(): void {
    setTimeout(() => {
      this.open = false;
    }, 150);
  }

  select(item: any): void {
    this._value = item;
    this.query = (this.getLabel(item) ?? '').trim();
    this.options = [];
    this.open = false;
    this.highlightedIndex = -1;
    this.valueChange.emit(item);
  }

  clear(): void {
    this.query = '';
    this._value = null;
    this.options = [];
    this.open = false;
    this.highlightedIndex = -1;
    this.error = null;
    this.valueChange.emit(null);
  }

  trackById = (_: number, item: any) => this.getId(item);

  onKeyDown(event: KeyboardEvent): void {
    if (!this.open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      this.open = this.shouldOpenDropdown();
    }

    if (!this.open) return;

    if (event.key === 'Escape') {
      this.open = false;
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const max = this.options.length - 1;
      if (max < 0) return;
      this.highlightedIndex = Math.min(max, this.highlightedIndex + 1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const max = this.options.length - 1;
      if (max < 0) return;
      this.highlightedIndex = Math.max(0, this.highlightedIndex - 1);
      return;
    }

    if (event.key === 'Enter') {
      if (this.highlightedIndex >= 0 && this.highlightedIndex < this.options.length) {
        event.preventDefault();
        this.select(this.options[this.highlightedIndex]);
      }
    }
  }

  private shouldOpenDropdown(): boolean {
    const q = (this.query ?? '').trim();
    if (q.length < this.minChars) return false;
    if (this.loading) return true;
    if (this.error) return true;
    return this.options.length > 0;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open) return;
    const target = event.target as Node;
    if (!this.el.nativeElement.contains(target)) {
      this.open = false;
    }
  }
}
