export function validEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }
export function validBirthDate(value: string, today = new Date().toISOString().slice(0,10)) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01' || value > today) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10) === value;
}
export function validPhone(value: string) { return /^[+\d ()-]{7,25}$/.test(value.trim()) && value.replace(/\D/g,'').length >= 7; }
export function passwordErrors(password: string, confirm: string) {
  return { password: password.length < 10 ? 'Use at least 10 characters.' : '', confirm: password !== confirm || !confirm ? 'Enter the same password again.' : '' };
}
