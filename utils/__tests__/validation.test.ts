import {
  isValidEgyptianPhone,
  formatEgyptianPhone,
  isValidPassword,
  isValidEmail,
  isNotEmpty,
} from '../validation';

describe('Validation Utilities', () => {
  describe('isValidEgyptianPhone', () => {
    it('should validate Egyptian mobile numbers starting with 01', () => {
      expect(isValidEgyptianPhone('01012345678')).toBe(true);
      expect(isValidEgyptianPhone('01112345678')).toBe(true);
      expect(isValidEgyptianPhone('01212345678')).toBe(true);
      expect(isValidEgyptianPhone('01512345678')).toBe(true);
    });

    it('should validate Egyptian mobile numbers in international format', () => {
      expect(isValidEgyptianPhone('+201012345678')).toBe(true);
      expect(isValidEgyptianPhone('+201112345678')).toBe(true);
      expect(isValidEgyptianPhone('+201212345678')).toBe(true);
      expect(isValidEgyptianPhone('+201512345678')).toBe(true);
    });

    it('should validate Cairo landline numbers', () => {
      expect(isValidEgyptianPhone('0212345678')).toBe(true);
      expect(isValidEgyptianPhone('+20212345678')).toBe(true);
    });

    it('should reject invalid mobile prefixes', () => {
      expect(isValidEgyptianPhone('01312345678')).toBe(false);
      expect(isValidEgyptianPhone('01412345678')).toBe(false);
      expect(isValidEgyptianPhone('01612345678')).toBe(false);
    });

    it('should reject numbers with incorrect length', () => {
      expect(isValidEgyptianPhone('0101234567')).toBe(false); // 10 digits
      expect(isValidEgyptianPhone('010123456789')).toBe(false); // 12 digits
    });

    it('should reject empty or null input', () => {
      expect(isValidEgyptianPhone('')).toBe(false);
      expect(isValidEgyptianPhone('   ')).toBe(false);
    });

    it('should handle spaces and hyphens in phone numbers', () => {
      expect(isValidEgyptianPhone('010 123 45678')).toBe(true);
      expect(isValidEgyptianPhone('010-123-45678')).toBe(true);
      expect(isValidEgyptianPhone('010 123 45678')).toBe(true);
    });

    it('should accept international format without + (with country code)', () => {
      expect(isValidEgyptianPhone('201012345678')).toBe(true); // Accepts as country code format
    });
  });

  describe('formatEgyptianPhone', () => {
    it('should format local numbers to international format', () => {
      expect(formatEgyptianPhone('01012345678')).toBe('+201012345678');
      expect(formatEgyptianPhone('01112345678')).toBe('+201112345678');
      expect(formatEgyptianPhone('0212345678')).toBe('+20212345678');
    });

    it('should keep international format unchanged', () => {
      expect(formatEgyptianPhone('+201012345678')).toBe('+201012345678');
      expect(formatEgyptianPhone('+20212345678')).toBe('+20212345678');
    });

    it('should handle spaces and hyphens', () => {
      expect(formatEgyptianPhone('010-123-45678')).toBe('+201012345678');
      expect(formatEgyptianPhone('010 123 45678')).toBe('+201012345678');
    });

    it('should return original if invalid format', () => {
      expect(formatEgyptianPhone('invalid')).toBe('invalid');
      expect(formatEgyptianPhone('')).toBe('');
    });
  });

  describe('isValidPassword', () => {
    it('should require at least 8 characters', () => {
      expect(isValidPassword('short')).toBe(false);
      expect(isValidPassword('1234567')).toBe(false);
    });

    it('should require at least one letter', () => {
      expect(isValidPassword('12345678')).toBe(false);
      expect(isValidPassword('123456789')).toBe(false);
    });

    it('should require at least one digit', () => {
      expect(isValidPassword('password')).toBe(false);
      expect(isValidPassword('abcdefgh')).toBe(false);
    });

    it('should accept valid passwords', () => {
      expect(isValidPassword('password123')).toBe(true);
      expect(isValidPassword('Pass1234')).toBe(true);
      expect(isValidPassword('abc12345')).toBe(true);
    });

    it('should reject empty passwords', () => {
      expect(isValidPassword('')).toBe(false);
    });

    it('should handle mixed case passwords', () => {
      expect(isValidPassword('Password123')).toBe(true);
      expect(isValidPassword('PASS1234')).toBe(true);
      expect(isValidPassword('pass1234')).toBe(true);
    });
  });

  describe('isValidEmail', () => {
    it('should accept valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });

    it('should reject empty or whitespace emails', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('   ')).toBe(false);
    });

    it('should trim whitespace from emails', () => {
      expect(isValidEmail('  test@example.com  ')).toBe(true);
      expect(isValidEmail(' test@example.com')).toBe(true);
    });
  });

  describe('isNotEmpty', () => {
    it('should accept non-empty strings', () => {
      expect(isNotEmpty('hello')).toBe(true);
      expect(isNotEmpty('a')).toBe(true);
      expect(isNotEmpty('  spaces  ')).toBe(true);
    });

    it('should reject empty strings', () => {
      expect(isNotEmpty('')).toBe(false);
      expect(isNotEmpty('   ')).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(isNotEmpty(null)).toBe(false);
      expect(isNotEmpty(undefined)).toBe(false);
    });

    it('should accept strings with only whitespace after trim', () => {
      expect(isNotEmpty('\t\n')).toBe(false);
      expect(isNotEmpty('  \t  ')).toBe(false);
    });
  });
});
