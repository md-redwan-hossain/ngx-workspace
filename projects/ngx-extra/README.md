# ngx-extra

Utility functions for Angular applications.

## Installation

```bash
npm install ngx-extra
```

## API

### `abstractControlSignal()`

Convert Angular form controls to reactive signals. Tracks value, status, validation errors, touched/pristine states with automatic cleanup.

### `reactiveQueryParam()`

Synchronize Angular signals with URL query parameters. Supports compression, serialization, and reactive updates.

### `createSignalChangeNotifier()`

Create a signal-based notification system with `notify()` and `listen` methods.

### `debouncedSignal()`

Debounce signal updates by a specified time interval.

### `duringDestroy()`

Execute a callback when the injection context is destroyed.

### `rxSubscriber()`

Subscribe to observables with automatic cleanup on component destruction.

### `throwResourceError()`

Throw errors from `HttpResourceRef` when the status is error.

### `SlimComponentState`

Class for managing component state using signals. Supports manipulation modes, selection states, and network operation tracking with fluent API.
