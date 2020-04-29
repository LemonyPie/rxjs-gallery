import { combineLatest, concat, fromEvent, merge, of } from 'rxjs';
import { map, mapTo, scan, startWith, switchMap, tap } from 'rxjs/operators';

const prevButton = document.querySelector<HTMLButtonElement>('#prev');
const nextButton = document.querySelector<HTMLButtonElement>('#next');
const categorySelector = document.querySelector<HTMLSelectElement>('#category');

const prev$ = fromEvent(prevButton, 'click').pipe(
  mapTo(-1)
);
const next$ = fromEvent(nextButton, 'click').pipe(
  mapTo(1)
);

const category$ = fromEvent<HTMLElementEventMap['change']>(categorySelector, 'change').pipe(
  map(({currentTarget}: Event ): string => {
    if((currentTarget as HTMLSelectElement).value){
      return (currentTarget as HTMLSelectElement).value;
    }

    return null;
  }),
  startWith(of(categorySelector.value))
);

const position$ = category$.pipe(
  switchMap((category: string) => merge(prev$, next$).pipe(
      scan(((acc, value: number) => {
        const sum = acc + value;
        return sum < 0 ? 0 : sum;
      }), 0),
      startWith(0)
    )
  ));
position$.subscribe(console.log)


