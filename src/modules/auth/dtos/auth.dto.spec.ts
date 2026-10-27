import { LoginSchema } from './auth.dto.js';

describe('Auth DTO schemas', () => {
  it('normalizes emails before authentication', () => {
    expect(LoginSchema.parse({ email: ' Ana@Example.com ', password: 'password' })).toEqual({
      email: 'ana@example.com',
      password: 'password',
    });
  });
});
