export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getVerificationCodeExpiry(): Date {
  const expiryDate = new Date();
  expiryDate.setMinutes(expiryDate.getMinutes() + 10); // Code expires in 10 minutes
  return expiryDate;
}