import { validate } from 'class-validator';
import { CreatePassportDto } from './create-passport.dto';
import { TerminateLinkDto } from './terminate-link.dto';

describe('DTO Validation', () => {
    describe('CreatePassportDto', () => {
        it('should fail if required fields are missing', async () => {
            const dto = new CreatePassportDto();
            // Missing firstName, lastName, birthDate
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.map(e => e.property)).toContain('firstName');
            expect(errors.map(e => e.property)).toContain('lastName');
            expect(errors.map(e => e.property)).toContain('birthDate');
        });

        it('should pass with valid data', async () => {
            const dto = new CreatePassportDto();
            dto.firstName = 'John';
            dto.lastName = 'Doe';
            dto.birthDate = '2010-01-01';
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('TerminateLinkDto', () => {
        it('should fail if reason is missing', async () => {
            const dto = new TerminateLinkDto();
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('reason');
        });

        it('should fail if email is invalid', async () => {
            const dto = new TerminateLinkDto();
            dto.reason = 'Leaving';
            dto.destinationClubEmail = 'invalid-email';
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('destinationClubEmail');
        });

        it('should pass with valid data', async () => {
            const dto = new TerminateLinkDto();
            dto.reason = 'Moving city';
            dto.destinationClubEmail = 'club@example.com';
            dto.sendEmail = true;
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });
});
