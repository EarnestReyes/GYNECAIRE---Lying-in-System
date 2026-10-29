export const resources = [
  { id: 'maternal', title: 'Understanding maternal health', description: 'Explore the World Health Organization’s overview of health during pregnancy, childbirth, and the postnatal period.', categories: ['Preconception','Pregnancy','Postpartum','Women’s Health'], url: 'https://www.who.int/health-topics/maternal-health', icon: 'heart' },
  { id: 'family-planning', title: 'Family planning and contraception', description: 'Read WHO’s introduction to family planning and contraception methods.', categories: ['Family Planning','Women’s Health'], url: 'https://www.who.int/news-room/fact-sheets/detail/family-planning-contraception', icon: 'clinic' },
  { id: 'nutrition', title: 'Explore nutrition and well-being', description: 'Find WHO information and resources about nutrition.', categories: ['Nutrition','General Wellness'], url: 'https://www.who.int/health-topics/nutrition', icon: 'learn' },
  { id: 'mental-health', title: 'Make space for mental well-being', description: 'Explore WHO information and resources about mental health.', categories: ['Mental Health','General Wellness'], url: 'https://www.who.int/health-topics/mental-health', icon: 'heart' },
] as const;
export type Resource = typeof resources[number];
export const categories = ['Pregnancy','Postpartum','Family Planning','Women’s Health','Nutrition','Mental Health'];
export function filterResources(query: string, category = 'All') {
  const term = query.trim().toLocaleLowerCase();
  return resources.filter(item => (category === 'All' || item.categories.some(value => value === category)) && `${item.title} ${item.description} ${item.categories.join(' ')}`.toLocaleLowerCase().includes(term));
}
export function parseSavedResources(value: string | null) {
  try { const parsed: unknown = JSON.parse(value || '[]'); return Array.isArray(parsed) ? [...new Set(parsed.filter((id): id is string => typeof id === 'string' && resources.some(item => item.id === id)))] : []; } catch { return []; }
}
