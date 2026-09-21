export const clubFixture = {
  name: 'Club Test',
  fullName: 'Club Test de Karaté',
  address: '1 rue du Test, 00000 Test',
  email: 'test@example.com',
  phone: '0102030405',
  phone2: '0607080910',
  facebook: 'https://facebook.com/test',
  instagram: 'https://instagram.com/test',
  president: 'Président Test',
  treasurer: 'Trésorier Test',
  secretary: 'Secrétaire Test',
  footerDescription: 'Description du club de test.',
};

export const clubAboutFixture = {
  about: {
    titlePrefix: 'Notre',
    titleHighlight: 'club',
    body: 'Présentation du club de test.',
    quote: 'Une citation de test.',
  },
  features: [{ icon: 'star', title: 'Valeur test', desc: 'Description test' }],
};

export const clubTeachersFixture = {
  teachers: [{ name: 'Professeur Test', grade: 'CN 4e Dan', description: 'Description test', photo: '/test.jpg' }],
};

export const clubScheduleFixture = {
  schedule: [{ day: 'Lundi' as const, time: '18h00 - 19h00', audience: 'Adultes' }],
};

export const clubPricesFixture = {
  prices: [{ category: 'Adulte', price: 100, description: 'Tarif test' }],
  membership: { price: 50, description: 'Licence test' },
};

export const eventsFixture = {
  header: {
    eyebrow: 'Événements test',
    titlePrefix: 'Les rendez-vous',
    titleHighlight: 'test',
    subtitle: 'Description des événements de test.',
  },
  events: [
    {
      category: 'competition' as const,
      title: 'Compétition test',
      categories: 'Kata',
      date: '2026-10-03',
      time: '9h à 12h',
      location: 'Salle test',
      address: '2 rue du Test, 00000 Test',
      icon: 'lucide:trophy',
    },
    {
      category: 'stage' as const,
      title: 'Stage test',
      date: '2026-10-10',
      time: '9h à 12h',
      location: 'Dojo test',
      address: '3 rue du Test, 00000 Test',
      audience: 'Tous niveaux',
      price: 'Gratuit',
      icon: 'lucide:users',
    },
    {
      category: 'grade' as const,
      title: 'Grade test',
      date: '2027-01-17',
      icon: 'lucide:badge-check',
    },
  ],
  blocks: [{ title: 'Bloc test', text: 'Texte test', detail: 'Détail test', icon: 'lucide:info' }],
};

export const karateFixture = {
  hero: { eyebrow: 'Karaté test', titlePrefix: 'Le', titleHighlight: 'karaté', subtitle: 'Introduction test.' },
  history: { titlePrefix: 'Notre', titleHighlight: 'histoire', body: 'Histoire test.' },
  cards: [{ icon: 'star', headerClass: 'header-test', iconClass: 'icon-test', title: 'Carte test', body: 'Texte test.' }],
  senseiKase: { titlePrefix: 'Sensei', titleHighlight: 'Test', body: 'Biographie test.', quote: 'Citation test.', quoteAuthor: 'Auteur test' },
  katas: { titlePrefix: 'Les', titleHighlight: 'katas', body: 'Présentation test.', points: [{ icon: 'star', text: 'Point test' }] },
  vocabulary: {
    titlePrefix: 'Vocabulaire',
    titleHighlight: 'test',
    intro: 'Introduction test.',
    categories: [{ title: 'Catégorie test', icon: 'book', items: [{ term: 'Test', def: 'Définition test' }] }],
  },
  counting: { title: 'Compter', icon: 'hash', numbers: [{ jp: 'Ichi', fr: 'Un' }] },
  dojoWords: { title: 'Mots du dojo', icon: 'book', words: [{ term: 'Dojo', def: 'Définition test' }] },
  ritual: { titlePrefix: 'Le', titleHighlight: 'rituel', intro: 'Introduction test.', steps: [{ step: 'Étape test' }] },
  cta: {
    title: 'CTA test',
    text: 'Texte test.',
    primaryLabel: 'Action test',
    primaryHref: '/test',
    secondaryLabel: 'Secondaire test',
    secondaryHref: '/test-2',
  },
};

export const karateSeniorsFixture = {
  hero: { eyebrow: 'Karaté Santé', titlePrefix: 'Santé', titleHighlight: 'Seniors', subtitle: 'Description test.' },
  benefits: [{ icon: 'heart', title: 'Bien-être', text: 'Bénéfice test' }],
  details: { day: 'Mardi', time: '10h00 - 11h00', trial: 'Séance test', location: 'Dojo test', address: '4 rue du Test, 00000 Test' },
  teacher: { name: 'Enseignant Test', grade: 'CN 3e Dan' },
  cta: { title: 'Contact test', text: 'Texte test.', primaryLabel: 'Contact', primaryHref: '/contact', secondaryLabel: 'Retour', secondaryHref: '/' },
};
