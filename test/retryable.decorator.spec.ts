import { Retryable } from '../src/common/decorators/retryable.decorator';

describe('Retryable Decorator', () => {
  it('should retry the method on failure', async () => {
    let callCount = 0;
    class TestClass {
      @Retryable(3, 10)
      async unstableMethod() {
        callCount++;
        if (callCount < 3) throw new Error('fail');
        return 'success';
      }
    }
    const instance = new TestClass();
    const result = await instance.unstableMethod();
    expect(result).toBe('success');
    expect(callCount).toBe(3);
  });

  it('should throw if all retries fail', async () => {
    class TestClass {
      @Retryable(2, 10)
      async alwaysFail() {
        throw new Error('fail');
      }
    }
    const instance = new TestClass();
    await expect(instance.alwaysFail()).rejects.toThrow('fail');
  });
});
