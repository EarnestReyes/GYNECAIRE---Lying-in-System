export function patientNavigation(accountType: string | undefined) { return accountType === 'patient'; }
export function tabNames(accountType: string | undefined) {
  return patientNavigation(accountType) ? ['dashboard','records','appointments','learn','profile'] : ['dashboard','learn','clinic','community','profile'];
}
