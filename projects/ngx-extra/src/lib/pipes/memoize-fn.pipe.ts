import { Pipe, type PipeTransform } from "@angular/core";

@Pipe({
  name: "ngxMemoizeFn"
})
export class MemoizeFnPipe implements PipeTransform {
  public transform<T, R>(value: T, handler: (value: T) => R, context?: unknown): R {
    if (context) {
      return handler.call(context, value);
    }

    return handler(value);
  }
}
