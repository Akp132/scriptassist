import { retry } from 'ts-retry-promise';

export function Retryable(attempts = 3, delayMs = 150) {
  return function (
    _target: any,
    _propKey: string,
    descriptor: PropertyDescriptor
  ) {
    const original = descriptor.value;
    descriptor.value = function (...args: any[]) {
      return retry(() => original.apply(this, args), {
        retries: attempts,
        delay: delayMs,
      });
    };
  };
}
