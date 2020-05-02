# RxJS Image Gallery

Represent image gallery as a stream of data. See [demo](https://artemeesenin.github.io/rxjs-gallery/)

## Architecture

Image category and image index are taken from category selector and clicks from `prev` and `next` buttons.

Then `loadAndCacheImages` operator checks it's local cache (presented as `Map` of categories with map of images for each category). If particular image is not present in cache new `Observable` is returned.

In this Observable new image object is created and if user clicks further before image load last request is cancelled by that Observable's teardown logic.

If network is inaccessible or request failed the stream is continues it's flow and this errors are handled by `retryWhen` which tries to load images if `online` window event was fired or one time after `RETRY_DELAY`. Or when user continues clicing.
