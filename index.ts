import { combineLatest, concat, fromEvent, merge, Observable, of } from 'rxjs';
import { flatMap, map, mapTo, scan, startWith, switchMap, tap } from 'rxjs/operators';

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
  startWith(categorySelector.value)
);

const position$ = merge(prev$, next$).pipe(
    scan(((acc, value: number) => {
      const sum = acc + value;
      return sum < 0 ? 0 : sum;
    }), 0),
    startWith(0)
  );

const imageSelect$ = category$.pipe(
  switchMap((category) => position$.pipe(
    map((index: number) => ({category, index}))
  ))
);

imageSelect$.subscribe(console.log)


