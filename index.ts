import { concat, fromEvent, of } from 'rxjs';
import { map, mapTo } from 'rxjs/operators';

const prevButton = document.querySelector<HTMLButtonElement>('#prev');
const nextButton = document.querySelector<HTMLButtonElement>('#next');
const categorySelector = document.querySelector<HTMLSelectElement>('#category');

const prev$ = fromEvent(prevButton, 'click').pipe(
  mapTo(1)
);
const next$ = fromEvent(nextButton, 'click').pipe(
  mapTo(-1)
);

const category$ = fromEvent<HTMLElementEventMap['change']>(categorySelector, 'change').pipe(
  map(({currentTarget}: Event ): string => {
    if((currentTarget as HTMLSelectElement).value){
      return (currentTarget as HTMLSelectElement).value;
    }

    return null;
  })
);

const categorySelect$ = concat(of(categorySelector.value), category$);

prev$.subscribe(console.log)
next$.subscribe(console.log)
categorySelect$.subscribe(console.log)

