/**
 * Validation utilities for Sahibak app
 */

/**
 * Validates an Egyptian phone number
 * Accepts formats:
 * - 01XXXXXXXXX (11 digits, mobile - 010, 011, 012, 015)
 * - +20XXXXXXXXXX (12-13 digits, international mobile)
 * - 02XXXXXXXX (10 digits, Cairo landline)
 * - +202XXXXXXXX (11-12 digits, Cairo international)
 *
 * @param phone - The phone number to validate
 * @returns true if valid, false otherwise
 */
export function isValidEgyptianPhone(phone: string): boolean {
  if (!phone || phone.trim() === '') return false

  const cleaned = phone.replace(/\s/g, '').replace(/-/g, '').replace(/\+/g, '')

  // Local format: 01XXXXXXXXX (mobile) or 02XXXXXXXX (landline)
  if (cleaned.startsWith('0')) {
    // Mobile: 010, 011, 012, 015 followed by 8 digits (11 digits total)
    if (/^(01[0125])\d{8}$/.test(cleaned)) {
      return true
    }
    // Cairo landline: 02XXXXXXXX (10 digits)
    if (cleaned.startsWith('02') && cleaned.length === 10) {
      return /^\d{10}$/.test(cleaned)
    }
    return false
  }

  // International format: +20 followed by phone number
  if (cleaned.startsWith('20')) {
    const withoutCountry = cleaned.substring(2)

    // Mobile: 1XXXXXXXXX (10-11 digits after country code)
    if (/^(1[0125])\d{8}$/.test(withoutCountry)) {
      return true
    }

    // Cairo landline: 2XXXXXXXX (8-9 digits after country code)
    if (withoutCountry.startsWith('2') && withoutCountry.length >= 8 && withoutCountry.length <= 9) {
      return true
    }

    return false
  }

  return false
}

/**
 * Formats an Egyptian phone number to international format (+20)
 * @param phone - The phone number to format
 * @returns Formatted phone number or original if invalid
 */
export function formatEgyptianPhone(phone: string): string {
  if (!phone || phone.trim() === '') return phone

  const cleaned = phone.replace(/\s/g, '').replace(/-/g, '')

  // If already international format
  if (cleaned.startsWith('+20')) {
    return cleaned
  }

  // If local format starting with 0
  if (cleaned.startsWith('0')) {
    return '+20' + cleaned.substring(1)
  }

  return phone
}

// Keep old function name for backward compatibility (deprecated)
export function isValidIraqiPhone(phone: string): boolean {
  return isValidEgyptianPhone(phone)
}

export function formatIraqiPhone(phone: string): string {
  return formatEgyptianPhone(phone)
}

/**
 * Validates password strength
 * @param password - The password to validate
 * @returns true if meets requirements, false otherwise
 */
export function isValidPassword(password: string): boolean {
  if (!password || password.length < 8) return false
  
  // At least one letter
  const hasLetter = /[a-zA-Z]/.test(password)
  // At least one digit
  const hasDigit = /\d/.test(password)
  
  return hasLetter && hasDigit
}

/**
 * Validates an email address
 * @param email - The email to validate
 * @returns true if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.trim() === '') return false
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Validates that a text field is not empty
 * @param text - The text to validate
 * @returns true if not empty, false otherwise
 */
export function isNotEmpty(text: string): boolean {
  return text !== null && text !== undefined && text.trim().length > 0
}
