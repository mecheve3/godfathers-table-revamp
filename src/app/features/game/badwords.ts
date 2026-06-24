// Profanity filter for player name inputs — English + Spanish
const BLOCKED: string[] = [
  // English
  'fuck','fucker','fucking','fck','sh1t','shit','bitch','cunt','dick',
  'pussy','cock','nigger','nigga','nigg','faggot','fag','whore','slut',
  'motherfucker','motherfuck','prick','twat','wanker','asshole','douchebag',
  // Spanish
  'puta','putas','puto','putos','mierda','cono','pendejo','pendeja',
  'cabron','cabrona','pito','verga','culero','culera',
  'maricon','marica','zorra','zorras','perra','perras','culo',
  'joder','chingada','chingo','chinga','chingue','pinche','pinches',
  'guey','wey','malparido','hijueputa','gonorrea','mamahuevo',
  'concha','carajo','puneta','ojete','mamon','culiao','huevon',
]

function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')     // strip combining diacritics
    .replace(/(.)\1{2,}/g, '$1$1')       // collapse repeats: fuuuuck → fuuck
    .replace(/[0@]/g, 'o')
    .replace(/[1!]/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/[$5]/g, 's')
}

export function containsBadWord(name: string): boolean {
  const n = normalise(name)
  return BLOCKED.some((term) => n.includes(normalise(term)))
}
