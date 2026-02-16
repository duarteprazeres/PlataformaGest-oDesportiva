
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';


describe('RolesGuard', () => {
    let rolesGuard: RolesGuard;
    let reflector: Reflector;

    beforeEach(() => {
        reflector = new Reflector();
        rolesGuard = new RolesGuard(reflector);
    });

    it('should be defined', () => {
        expect(rolesGuard).toBeDefined();
    });

    it('should allow access if no roles are required', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
        const context = createMockContext({ role: 'PARENT' });
        expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('should allow access if user has required role', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['CLUB_ADMIN']);
        const context = createMockContext({ role: 'CLUB_ADMIN' });
        expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('should deny access if user does not have required role', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['CLUB_ADMIN']);
        const context = createMockContext({ role: 'PARENT' });
        expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny access if user has no role', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['CLUB_ADMIN']);
        const context = createMockContext({});
        expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });
});

function createMockContext(user: any): ExecutionContext {
    return {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
            getRequest: jest.fn().mockReturnValue({ user }),
        }),
    } as any;
}
