# RxJS Image Gallery

Represent image gallery as a stream of data. See [demo](https://artemeesenin.github.io/rxjs-gallery/)

## Architecture

Image category and image index are taken from category selector and clicks from `prev` and `next` buttons.

Then `loadAndCacheImages` operator checks it's local cache (presented as `Map` of categories with map of images for each category). If particular image is not present in cache new `Observable` is returned.

In this Observable new image object is created and if user clicks further before image load last request is cancelled by that Observable's teardown logic.

If network is inaccessible or request failed the stream is continues it's flow and this errors are handled by `retryWhen` which tries to load images if `online` window event was fired or one time after `RETRY_DELAY`. Or when user continues clicking.

Also this gallery prefetches one image forwards (using `concat` operator to avoid concurrency with the priority current image) and puts it in cache. Prefetch number can be customized (number `0` is considered as "turn prefetch off"). Prefetch fails silently due to mapping to `EMPTY` on success and on error as it is needed only for filling cache

## Known issues

* Loaded images cache needs to be cleaned after at least category change or in better case to store closest 2 images on left and right from current image
* Images can be prefetched backwards
