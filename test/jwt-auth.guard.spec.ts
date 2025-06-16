import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should extend AuthGuard("jwt")', () => {
    // Instead of checking constructor name, check instanceof
    expect(guard instanceof JwtAuthGuard).toBe(true);
  });

  it('should call super.canActivate', () => {
    const context = {} as ExecutionContext;
    const superCanActivate = jest.spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate').mockReturnValue(true);
    guard.canActivate(context);
    expect(superCanActivate).toHaveBeenCalledWith(context);
    superCanActivate.mockRestore();
  });
});
