import {
  concat,
  EMPTY,
  fromEvent, identity,
  merge,
  Observable,
  of,
  OperatorFunction, timer
} from 'rxjs';
import {
  catchError, flatMap,
  map,
  mapTo, retryWhen,
  scan,
  startWith,
  switchMap,
  tap, withLatestFrom,
} from 'rxjs/operators';
import { URL } from './const';

interface ISelectedImage {
  category: string;
  index: number;
}

const RETRY_DELAY = 2000;

const prevButton = document.querySelector<HTMLButtonElement>('#prev');
const nextButton = document.querySelector<HTMLButtonElement>('#next');
const categorySelector = document.querySelector<HTMLSelectElement>('#category');
const loadingEl = document.querySelector<HTMLDivElement>('#loading');
const contentEl = document.querySelector<HTMLDivElement>('#content');

const setLoading = (status: boolean): void => {
  status ? loadingEl.style.display = 'block' : loadingEl.style.display = 'none';
}

const setContent = (content: HTMLElement): void => {
  contentEl.prepend(content);
}

const clearContent = (): void => {
  contentEl.innerHTML = '';
}

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
    map((index: number): ISelectedImage => ({category, index}))
  ))
);

const loadImage = (selectedImage: ISelectedImage): Observable<HTMLImageElement> => new Observable((subscriber) => {
  const image = new Image()

  image.onload = () => {
    subscriber.next(image)
    subscriber.complete();
  };

  image.onerror = (error) => {
    subscriber.error( {
      message: 'Failed to load image',
      error
    })
  };

  image.src = `${URL}/${selectedImage.category}?index=${selectedImage.index}/`;

  return () => {
    if(!image.complete) { image.src = ''; }
    image.onload = undefined;
    image.onerror = undefined;
  }
})

const online$ = fromEvent(window, 'online');

const prefetchMap = (innerObservable, project) => {
  return (source) => source.pipe(
    withLatestFrom(innerObservable),
    switchMap(project)
  )
}

const loadAndCacheImages = (prefetch?: number): OperatorFunction<HTMLImageElement> => {
  const cache: Map<string, Map<number, HTMLImageElement>> = new Map();
  return (source: Observable<ISelectedImage>): Observable<HTMLImageElement> => source.pipe(
    switchMap((selectedImage: ISelectedImage): Observable<HTMLImageElement> => {
      let cacheCategory = cache.get(selectedImage.category);
      if (cacheCategory) {
        if ( cacheCategory.has( selectedImage.index ) ) {
          return of( cacheCategory.get( selectedImage.index ) );
        }
      } else {
        cache.set(selectedImage.category, new Map())
        cacheCategory = cache.get(selectedImage.category);
      }

      return loadImage(selectedImage).pipe(
        tap((image: HTMLImageElement) => {
          cacheCategory.set(selectedImage.index, image);
        }),
        retryWhen(() => merge(online$, timer(RETRY_DELAY))),
        catchError( () => {
          return EMPTY;
        }),
      );
    }),
    prefetch
      ? prefetchMap(source, ([image, selectedImage]: [HTMLImageElement, ISelectedImage]) => {
        const cacheCategory = cache.get(selectedImage.category);
        const prefetchIndex = selectedImage.index + prefetch;
        if(!cacheCategory.has(prefetchIndex)) {
          return concat(of(image), loadImage({...selectedImage, index: prefetchIndex}).pipe(
            tap((image: HTMLImageElement) => {
              cacheCategory.set(prefetchIndex, image)
            }),
            flatMap(() => EMPTY),
            catchError(() => EMPTY)
          ));
        }

        return of(image);
      })
      : identity
  );
}

imageSelect$.pipe(
  tap(() => clearContent()),
  tap(() => setLoading(true)),
  loadAndCacheImages(1),
  tap(() => setLoading(false))
).subscribe({
  next: (image: HTMLImageElement) => setContent( image ),
  error: err => console.error('error', err),
  complete: () => console.log('complete')
})


