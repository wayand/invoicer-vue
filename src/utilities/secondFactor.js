const strip = code => String(code).replace(/[\s-]/g, '')

// 6-digit code from the email or the authenticator app
export const isAuthenticatorCode = code => /^\d{6}$/.test(String(code).trim())

// Backup codes look like ABCDE-FGHIJ; the hyphen and spaces are optional
export const isBackupCode = code => /^[A-Za-z0-9]{10}$/.test(strip(code))

export const isSecondFactorCode = code => isAuthenticatorCode(code) || isBackupCode(code)
