// Shared by the browser and the server (plain ES module, no DOM access).

export const CIRCLES = {
  love: {
    id: 'love',
    title: 'What you LOVE',
    pre: 'What you',
    key: 'LOVE',
    kanji: '好',
    jp: '好きなこと',
    color: '#FCE98A',
    glow: '#FFD84D',
    intro: 'Let’s start with what makes you happy.',
  },
  good: {
    id: 'good',
    title: 'What you’re GOOD AT',
    pre: 'What you are',
    key: 'GOOD AT',
    kanji: '得',
    jp: '得意なこと',
    color: '#DCF7A3',
    glow: '#A6E85A',
    intro: 'Now, what comes easily to you?',
  },
  needs: {
    id: 'needs',
    title: 'What the world NEEDS',
    pre: 'What the world',
    key: 'NEEDS',
    kanji: '世',
    jp: '世界が必要とすること',
    color: '#FFBDB4',
    glow: '#FF7F6E',
    intro: 'What would you like to make better in the world?',
  },
  paid: {
    id: 'paid',
    title: 'What you can be PAID FOR',
    pre: 'What you can be',
    key: 'PAID FOR',
    kanji: '稼',
    jp: '稼げること',
    color: '#B6F6E4',
    glow: '#4FE0BF',
    intro: 'Finally, how could you earn a living from this?',
  },
};

export const CIRCLE_ORDER = ['love', 'good', 'needs', 'paid'];

export const OVERLAPS = {
  passion: { id: 'passion', label: 'Passion', circles: ['love', 'good'], meaning: 'What you love × what you’re good at' },
  mission: { id: 'mission', label: 'Mission', circles: ['love', 'needs'], meaning: 'What you love × what the world needs' },
  profession: { id: 'profession', label: 'Profession', circles: ['good', 'paid'], meaning: 'What you’re good at × what you can be paid for' },
  vocation: { id: 'vocation', label: 'Vocation', circles: ['needs', 'paid'], meaning: 'What the world needs × what you can be paid for' },
};

// Twelve life themes. Every answer feeds one or more of them, per circle.
export const THEMES = {
  create: {
    label: 'Creativity & Design', short: 'Creating', emoji: '🎨', noun: 'Creator', adj: 'Creative',
    doing: 'creating and designing', gift: 'imagination', need: 'more beauty and meaning',
    paid: 'design and creative work', focus: 'design & creativity', through: 'creativity and design',
    verb: 'Bringing beautiful new ideas to life',
    roles: ['Brand or product designer', 'Illustrator or visual artist', 'Creative director'],
    keywords: ['design', 'draw', 'paint', 'art\\b', 'artist', 'artwork', 'sketch', 'photo', 'creat', 'illustrat', 'fashion', 'decor', 'colou?r', 'aesthetic'],
  },
  tech: {
    label: 'Technology', short: 'Technology', emoji: '💻', noun: 'Builder', adj: 'Inventive',
    doing: 'building with technology', gift: 'technical problem-solving', need: 'better tools',
    paid: 'building software and digital tools', focus: 'technology', through: 'technology',
    verb: 'Building tools that make life easier',
    roles: ['Software or product developer', 'Automation / no-code specialist', 'Tech founder'],
    keywords: ['cod(e|ing)', 'program', 'software', 'tech', 'computer', 'apps?\\b', 'web', 'debug', 'ai\\b', 'robot', 'electronic', 'gadget', 'automat', 'developer'],
  },
  teach: {
    label: 'Teaching & Mentoring', short: 'Teaching', emoji: '📚', noun: 'Guide', adj: 'Guiding',
    doing: 'helping others learn', gift: 'explaining things clearly', need: 'access to learning',
    paid: 'teaching, coaching and courses', focus: 'learning & education', through: 'teaching',
    verb: 'Helping people grow into who they could be',
    roles: ['Teacher or trainer', 'Online course creator', 'Coach or mentor'],
    keywords: ['teach', 'mentor', 'tutor', 'explain', 'coach', 'train', 'educat', 'lesson', 'course', 'learn'],
  },
  care: {
    label: 'Health & Wellbeing', short: 'Healing', emoji: '🌿', noun: 'Healer', adj: 'Caring',
    doing: 'caring for people', gift: 'understanding how people feel', need: 'healing and wellbeing',
    paid: 'health and wellbeing services', focus: 'health & wellbeing', through: 'care and empathy',
    verb: 'Helping people heal and thrive',
    roles: ['Counsellor or therapist', 'Wellness or health coach', 'Healthcare professional'],
    keywords: ['heal', 'health', 'therap', 'car(e|ing)\\b', 'listen', 'mental', 'wellness', 'wellbeing', 'yoga', 'medic', 'nurs', 'fitness', 'meditat', 'support', 'empath'],
  },
  words: {
    label: 'Writing & Storytelling', short: 'Storytelling', emoji: '✍️', noun: 'Storyteller', adj: 'Storytelling',
    doing: 'reading, writing and telling stories', gift: 'words and storytelling', need: 'honest stories',
    paid: 'writing and content', focus: 'storytelling', through: 'storytelling',
    verb: 'Telling stories that move people',
    roles: ['Writer or author', 'Content creator', 'Journalist or editor'],
    keywords: ['writ', 'story', 'stories', 'blog', 'read', 'book', 'poem', 'poetry', 'journal', 'content', 'edit', 'language', 'copy'],
  },
  nature: {
    label: 'Nature & Sustainability', short: 'Nature', emoji: '🌍', noun: 'Guardian', adj: 'Earth-minded',
    doing: 'being close to nature', gift: 'nurturing living things', need: 'a healthier planet',
    paid: 'sustainability and outdoor work', focus: 'the planet', through: 'a love of the living world',
    verb: 'Protecting the living world',
    roles: ['Sustainability consultant', 'Environmental scientist', 'Eco-conscious founder'],
    keywords: ['nature', 'garden', 'plant', 'animal', 'hik', 'outdoor', 'climate', 'environment', 'ocean', 'forest', 'sustainab', 'farm', 'pets?\\b', 'trek'],
  },
  lead: {
    label: 'Leadership & Business', short: 'Leading', emoji: '🧭', noun: 'Pathfinder', adj: 'Visionary',
    doing: 'leading and starting things', gift: 'organising people toward a goal', need: 'better leadership and opportunity',
    paid: 'leadership and consulting', focus: 'business & startups', through: 'leadership',
    verb: 'Leading people toward a better future',
    roles: ['Founder or entrepreneur', 'Team lead or manager', 'Strategy consultant'],
    keywords: ['lead', 'manag', 'business', 'startup', 'entrepreneur', 'strateg', 'sell', 'sales', 'market', 'negotiat', 'organi[sz]', 'plan'],
  },
  analyze: {
    label: 'Research & Analysis', short: 'Analysis', emoji: '🔭', noun: 'Seeker', adj: 'Curious',
    doing: 'exploring ideas and solving puzzles', gift: 'analytical thinking', need: 'clearer answers',
    paid: 'research and analysis', focus: 'research & insight', through: 'insight and research',
    verb: 'Uncovering truth in complexity',
    roles: ['Researcher', 'Data analyst', 'Market or investment analyst'],
    keywords: ['research', 'analy', 'data', 'math', 'science', 'puzzle', 'number', 'invest', 'financ', 'excel', 'logic', 'problem', 'stat'],
  },
  connect: {
    label: 'People & Community', short: 'Community', emoji: '🤝', noun: 'Connector', adj: 'Connecting',
    doing: 'surrounded by people', gift: 'bringing people together', need: 'deeper connection',
    paid: 'community and events', focus: 'community', through: 'community',
    verb: 'Bringing people together',
    roles: ['Community builder', 'Event producer', 'People & culture partner'],
    keywords: ['people', 'friend', 'communit', 'host', 'event', 'network', 'social', 'family', 'team', 'party', 'parties'],
  },
  perform: {
    label: 'Performing & Speaking', short: 'Expression', emoji: '🎤', noun: 'Voice', adj: 'Expressive',
    doing: 'expressing yourself on a stage', gift: 'presence and persuasion', need: 'inspiration',
    paid: 'speaking, performing and media', focus: 'stage & screen', through: 'your voice',
    verb: 'Inspiring people to feel something',
    roles: ['Speaker or host', 'Performer or musician', 'Video or podcast creator'],
    keywords: ['music', 'sing', 'danc', 'acting', 'actor', 'speak', 'stage', 'perform', 'film', 'video', 'podcast', 'present', 'comedy', 'guitar', 'piano'],
  },
  craft: {
    label: 'Hands-on Making', short: 'Making', emoji: '🛠️', noun: 'Maker', adj: 'Hands-on',
    doing: 'making things with your hands', gift: 'practical, hands-on skill', need: 'things built to last',
    paid: 'handmade products and skilled trades', focus: 'craft & making', through: 'your hands',
    verb: 'Making real things that last',
    roles: ['Artisan or maker', 'Chef or food entrepreneur', 'Builder or restorer'],
    keywords: ['cook', 'bak', 'build', 'wood', 'craft', 'repair', 'fix', 'knit', 'sew', 'diy', 'mak(e|ing)\\b', 'carpent', 'pottery', 'food'],
  },
  justice: {
    label: 'Justice & Advocacy', short: 'Advocacy', emoji: '⚖️', noun: 'Champion', adj: 'Fearless',
    doing: 'fighting for a cause', gift: 'a strong sense of fairness', need: 'fairness and dignity',
    paid: 'advocacy and impact work', focus: 'social justice', through: 'advocacy',
    verb: 'Fighting for what’s fair',
    roles: ['Advocate or campaigner', 'Social entrepreneur', 'Policy or nonprofit leader'],
    keywords: ['justice', 'rights', 'equal', 'poverty', 'volunteer', 'activis', 'advoca', 'fair', 'charit', 'inequal', 'policy', 'ngo', 'nonprofit'],
  },
};

export const THEME_IDS = Object.keys(THEMES);

// Finer-grained material the adaptive engine uses to build follow-up questions
// when the AI engine is unavailable.
export const THEME_DETAILS = {
  create: {
    facets: ['Visual design & aesthetics', 'Inventing original ideas', 'Making spaces & experiences beautiful', 'Photography, film or illustration'],
    audiences: ['Brands that need a soul', 'Young creatives finding their voice', 'Communities starved of art'],
    offers: ['Design for brands & products', 'Creative workshops', 'Commissioned art or visuals'],
  },
  tech: {
    facets: ['Building apps & tools', 'Automating boring work', 'AI & what comes next', 'Taking systems apart to understand them'],
    audiences: ['Small businesses buried in admin', 'People left behind by technology', 'Teams with broken workflows'],
    offers: ['Building websites & apps', 'Automation & AI setups', 'Tech support & training'],
  },
  teach: {
    facets: ['Explaining hard ideas simply', 'Seeing someone finally “get it”', 'Designing lessons & courses', 'Mentoring one-on-one'],
    audiences: ['Kids & teenagers', 'Career changers', 'First-generation learners'],
    offers: ['Online courses & cohorts', 'Tutoring or coaching', 'Training & workshops for teams'],
  },
  care: {
    facets: ['Listening deeply', 'Helping people through hard times', 'Physical health & the body', 'Mind & emotional health'],
    audiences: ['People who feel unseen', 'Burnt-out professionals', 'People living with illness'],
    offers: ['Coaching or counselling', 'Wellness programmes', 'Care & support services'],
  },
  words: {
    facets: ['Writing that moves people', 'Reading & big ideas', 'Telling true stories', 'Editing & sharpening words'],
    audiences: ['Voices nobody is hearing', 'Brands that can’t explain themselves', 'Readers who need hope'],
    offers: ['Writing & copywriting', 'Newsletters, books or blogs', 'Ghostwriting & editing'],
  },
  nature: {
    facets: ['Being outdoors', 'Growing & gardening', 'Animals & wildlife', 'Protecting the climate'],
    audiences: ['Future generations', 'Animals & ecosystems', 'Cities that need more green'],
    offers: ['Sustainability consulting', 'Eco-friendly products', 'Outdoor experiences & guiding'],
  },
  lead: {
    facets: ['Starting new things', 'Leading a team to a goal', 'Strategy & big decisions', 'Selling & persuading'],
    audiences: ['Founders & small businesses', 'Teams without direction', 'Communities needing opportunity'],
    offers: ['Consulting & strategy', 'Running your own venture', 'Leading teams or projects'],
  },
  analyze: {
    facets: ['Solving puzzles', 'Research & discovery', 'Numbers & data', 'Understanding why things happen'],
    audiences: ['Decision-makers drowning in data', 'Scientists & researchers', 'People misled by misinformation'],
    offers: ['Research & insight reports', 'Data analysis', 'Market or investment analysis'],
  },
  connect: {
    facets: ['Hosting & gathering people', 'Deep one-on-one conversations', 'Building communities', 'Introducing people to each other'],
    audiences: ['Lonely or isolated people', 'Newcomers to a city or company', 'Communities drifting apart'],
    offers: ['Events & experiences', 'Community management', 'Partnerships & networking'],
  },
  perform: {
    facets: ['Music', 'Being on stage or camera', 'Making people laugh or feel', 'Speaking to inspire'],
    audiences: ['Audiences who need inspiration', 'Young performers', 'Causes that need a voice'],
    offers: ['Speaking & hosting', 'Performances & shows', 'Video, podcasts & content'],
  },
  craft: {
    facets: ['Cooking & food', 'Building & woodwork', 'Fixing & repairing things', 'Making things by hand'],
    audiences: ['People who value handmade', 'Neighbours & local communities', 'Anyone tired of throwaway stuff'],
    offers: ['Handmade products', 'A food business', 'Repairs & skilled trades'],
  },
  justice: {
    facets: ['Standing up for others', 'Fixing unfair systems', 'Campaigning & activism', 'Giving people a fair chance'],
    audiences: ['Overlooked communities', 'People facing discrimination', 'People with no voice in power'],
    offers: ['Nonprofit & advocacy roles', 'Social enterprise', 'Policy & campaign work'],
  },
};

/*
 * Question types
 *  chips  – multi-select, options carry themes, `max` picks
 *  single – pick one card (auto-advances)
 *  tags   – the person's own words (typed phrases) — shown on their final map
 *  scale  – sliders 1..5, each slider carries themes
 *  adaptive – generated live from earlier answers (AI engine, or the local fallback)
 *
 * Every non-tags question also accepts an open-ended answer (`note`).
 */
export const QUESTIONS = [
  // ───────────── LOVE ─────────────
  {
    id: 'love_enjoy', circle: 'love', type: 'chips', max: 3,
    title: 'What do you enjoy doing most?',
    hint: 'Pick up to 3.',
    note: 'Or describe it in your own words…',
    options: [
      { id: 'design', label: 'Drawing & design', emoji: '🎨', themes: ['create'] },
      { id: 'tech', label: 'Tech & computers', emoji: '💻', themes: ['tech'] },
      { id: 'read', label: 'Reading & writing', emoji: '📖', themes: ['words'] },
      { id: 'nature', label: 'Being in nature', emoji: '🌲', themes: ['nature'] },
      { id: 'people', label: 'Meeting people', emoji: '🥂', themes: ['connect'] },
      { id: 'puzzles', label: 'Solving puzzles', emoji: '🧩', themes: ['analyze'] },
      { id: 'making', label: 'Cooking & making things', emoji: '🍳', themes: ['craft'] },
      { id: 'helping', label: 'Helping others', emoji: '💛', themes: ['care'] },
      { id: 'music', label: 'Music & performing', emoji: '🎶', themes: ['perform'] },
      { id: 'ideas', label: 'Starting new ideas', emoji: '🚀', themes: ['lead'] },
      { id: 'cause', label: 'Fighting for a cause', emoji: '✊', themes: ['justice'] },
      { id: 'teaching', label: 'Teaching others', emoji: '🧑‍🏫', themes: ['teach'] },
    ],
  },
  {
    id: 'love_flow', circle: 'love', type: 'tags', max: 4, words: true,
    title: 'What makes you lose track of time?',
    hint: 'Type a few things. Press Enter after each one.',
    placeholder: 'e.g. drawing, coding, long walks',
    suggestions: ['Drawing', 'Writing', 'Coding', 'Cooking', 'Gardening', 'Deep talks', 'Music', 'Sport'],
  },
  { id: 'adapt_love', circle: 'love', type: 'adaptive' },

  // ───────────── GOOD AT ─────────────
  {
    id: 'good_at', circle: 'good', type: 'chips', max: 3,
    title: 'What are you naturally good at?',
    hint: 'Pick up to 3.',
    note: 'Something else you’re good at?',
    options: [
      { id: 'creative', label: 'Being creative', emoji: '✨', themes: ['create'] },
      { id: 'fixtech', label: 'Fixing tech problems', emoji: '🖥️', themes: ['tech'] },
      { id: 'explain', label: 'Explaining things', emoji: '💡', themes: ['teach'] },
      { id: 'listen', label: 'Listening & caring', emoji: '🫂', themes: ['care'] },
      { id: 'writing', label: 'Writing', emoji: '📝', themes: ['words'] },
      { id: 'numbers', label: 'Numbers & research', emoji: '📊', themes: ['analyze'] },
      { id: 'organise', label: 'Organising & leading', emoji: '📋', themes: ['lead'] },
      { id: 'connect', label: 'Connecting people', emoji: '🔗', themes: ['connect'] },
      { id: 'speak', label: 'Speaking & presenting', emoji: '🎙️', themes: ['perform'] },
      { id: 'hands', label: 'Working with my hands', emoji: '🔨', themes: ['craft'] },
      { id: 'grow', label: 'Caring for plants & animals', emoji: '🪴', themes: ['nature'] },
      { id: 'standup', label: 'Standing up for others', emoji: '🦁', themes: ['justice'] },
    ],
  },
  {
    id: 'good_praise', circle: 'good', type: 'tags', max: 4, words: true,
    title: 'What do people praise you for?',
    hint: 'Even small things count. Press Enter after each one.',
    placeholder: 'e.g. listening, Excel, cooking',
    suggestions: ['Listening', 'Public speaking', 'Design', 'Problem solving', 'Organising', 'Writing', 'Cooking', 'Teaching'],
  },
  { id: 'adapt_good', circle: 'good', type: 'adaptive' },

  // ───────────── WORLD NEEDS ─────────────
  {
    id: 'needs_causes', circle: 'needs', type: 'chips', max: 3,
    title: 'Which problems do you care about most?',
    hint: 'Pick up to 3.',
    note: 'A problem you care about that isn’t listed?',
    options: [
      { id: 'climate', label: 'Climate & nature', emoji: '🌍', themes: ['nature'] },
      { id: 'health', label: 'Mental & physical health', emoji: '🩺', themes: ['care'] },
      { id: 'fairness', label: 'Unfairness & inequality', emoji: '⚖️', themes: ['justice'] },
      { id: 'education', label: 'Education', emoji: '🏫', themes: ['teach'] },
      { id: 'lonely', label: 'Loneliness', emoji: '🫶', themes: ['connect'] },
      { id: 'misinfo', label: 'Fake news', emoji: '📰', themes: ['words', 'analyze'] },
      { id: 'jobs', label: 'Lack of jobs', emoji: '💼', themes: ['lead'] },
      { id: 'digital', label: 'People left behind by tech', emoji: '📱', themes: ['tech', 'teach'] },
      { id: 'culture', label: 'Art & culture fading', emoji: '🏛️', themes: ['create', 'perform'] },
      { id: 'waste', label: 'Waste & throwaway culture', emoji: '♻️', themes: ['craft', 'nature'] },
    ],
  },
  {
    id: 'needs_who', circle: 'needs', type: 'chips', max: 2,
    title: 'Who would you most like to help?',
    hint: 'Pick up to 2.',
    note: 'Describe the people you picture…',
    options: [
      { id: 'kids', label: 'Children & teens', emoji: '🧒', themes: ['teach', 'care'] },
      { id: 'elderly', label: 'Older people', emoji: '👵', themes: ['care', 'connect'] },
      { id: 'founders', label: 'Small businesses', emoji: '🏪', themes: ['lead', 'tech'] },
      { id: 'creators', label: 'Artists & creators', emoji: '🎨', themes: ['create', 'perform'] },
      { id: 'planet', label: 'Animals & the planet', emoji: '🐋', themes: ['nature'] },
      { id: 'patients', label: 'People who are unwell', emoji: '❤️‍🩹', themes: ['care'] },
      { id: 'learners', label: 'Students', emoji: '📚', themes: ['teach', 'words'] },
      { id: 'overlooked', label: 'Communities left behind', emoji: '🤝', themes: ['justice', 'connect'] },
      { id: 'teams', label: 'Companies & teams', emoji: '🏢', themes: ['lead', 'analyze'] },
    ],
  },
  { id: 'adapt_needs', circle: 'needs', type: 'adaptive' },

  // ───────────── PAID FOR ─────────────
  {
    id: 'paid_skills', circle: 'paid', type: 'chips', max: 3,
    title: 'What could people pay you for?',
    hint: 'Now, or after a little practice. Pick up to 3.',
    note: 'Anything you’ve been paid for before?',
    options: [
      { id: 'design', label: 'Design', emoji: '🎨', themes: ['create'] },
      { id: 'software', label: 'Building apps or websites', emoji: '💻', themes: ['tech'] },
      { id: 'coaching', label: 'Teaching or coaching', emoji: '🧑‍🏫', themes: ['teach'] },
      { id: 'wellness', label: 'Health & wellness', emoji: '🧘', themes: ['care'] },
      { id: 'content', label: 'Writing or content', emoji: '✍️', themes: ['words'] },
      { id: 'green', label: 'Eco & outdoor work', emoji: '🌿', themes: ['nature'] },
      { id: 'consult', label: 'Managing or advising', emoji: '🗂️', themes: ['lead'] },
      { id: 'research', label: 'Data & research', emoji: '📊', themes: ['analyze'] },
      { id: 'events', label: 'Events & community', emoji: '🎪', themes: ['connect'] },
      { id: 'media', label: 'Speaking, video or music', emoji: '🎥', themes: ['perform'] },
      { id: 'handmade', label: 'Food or handmade things', emoji: '🧁', themes: ['craft'] },
      { id: 'impact', label: 'Charity or social work', emoji: '📢', themes: ['justice'] },
    ],
  },
  {
    id: 'paid_style', circle: 'paid', type: 'single', style: true,
    title: 'How do you want to work?',
    hint: 'This helps us suggest the right careers.',
    note: 'Your ideal working life, in a sentence…',
    options: [
      { id: 'employed', label: 'A job at a good company', emoji: '🏢', themes: [] },
      { id: 'freelance', label: 'Freelance — my own boss', emoji: '🧳', themes: [] },
      { id: 'business', label: 'My own business', emoji: '🚀', themes: ['lead'] },
      { id: 'creator', label: 'Online creator', emoji: '📱', themes: ['perform'] },
      { id: 'impact', label: 'For a cause or charity', emoji: '🌍', themes: ['justice'] },
      { id: 'mix', label: 'A mix of these', emoji: '🧩', themes: [] },
    ],
  },
  { id: 'adapt_paid', circle: 'paid', type: 'adaptive' },
];

/*
 * Careers the rule-based engine can recommend. `themes` weights say what each career is made of;
 * `modes` are the ways of working it suits (see paid_style).
 */
export const CAREERS = [
  { id: 'brand_designer', title: 'Graphic & brand designer', themes: { create: 1, lead: 0.2 }, modes: ['employed', 'freelance'], does: 'Design logos, visuals and brand looks for businesses.', start: 'Redesign the brand of a friend’s or local business for your portfolio.' },
  { id: 'ux_designer', title: 'UX / product designer', themes: { create: 0.8, tech: 0.7, care: 0.2 }, modes: ['employed', 'freelance'], does: 'Design apps and websites that are easy and pleasant to use.', start: 'Take a free UX course and redesign one app screen that annoys you.' },
  { id: 'content_creator', title: 'Content creator', themes: { perform: 0.7, words: 0.6, create: 0.6 }, modes: ['creator', 'business'], does: 'Make videos, posts or podcasts that grow an audience.', start: 'Post one piece of content a week for a month on a topic you love.' },
  { id: 'photographer', title: 'Photographer / videographer', themes: { create: 1, perform: 0.3, craft: 0.3 }, modes: ['freelance', 'business'], does: 'Capture events, people and products.', start: 'Shoot a friend’s event for free and build a small portfolio.' },
  { id: 'software_dev', title: 'Software developer', themes: { tech: 1, analyze: 0.5 }, modes: ['employed', 'freelance'], does: 'Build apps, websites and tools people use every day.', start: 'Build one small app that solves a problem you actually have.' },
  { id: 'data_analyst', title: 'Data analyst', themes: { analyze: 1, tech: 0.6 }, modes: ['employed', 'freelance'], does: 'Turn data into clear answers that help teams decide.', start: 'Analyse a free public dataset and share three things you found.' },
  { id: 'ai_specialist', title: 'AI & automation specialist', themes: { tech: 1, lead: 0.3, analyze: 0.3 }, modes: ['freelance', 'business', 'employed'], does: 'Help businesses save time with AI tools and automations.', start: 'Automate one boring task for a small business you know.' },
  { id: 'edtech', title: 'EdTech builder', themes: { tech: 0.8, teach: 0.8 }, modes: ['business', 'employed'], does: 'Create apps and tools that help people learn.', start: 'Build a simple quiz or learning tool for a topic you know well.' },
  { id: 'teacher', title: 'Teacher / trainer', themes: { teach: 1, connect: 0.4, care: 0.3 }, modes: ['employed', 'impact'], does: 'Help students learn and grow, in a classroom or online.', start: 'Volunteer to teach a weekly class or tutor one student.' },
  { id: 'coach', title: 'Life or career coach', themes: { care: 0.8, teach: 0.7, connect: 0.4 }, modes: ['freelance', 'business'], does: 'Guide people through change, one conversation at a time.', start: 'Offer three free coaching sessions to friends and ask for honest feedback.' },
  { id: 'course_creator', title: 'Online course creator', themes: { teach: 0.9, perform: 0.4, words: 0.4, lead: 0.3 }, modes: ['creator', 'business'], does: 'Turn what you know into courses people pay for.', start: 'Run a free one-hour online workshop and see who shows up.' },
  { id: 'learning_designer', title: 'Learning designer', themes: { teach: 0.8, create: 0.5, tech: 0.3 }, modes: ['employed', 'freelance'], does: 'Design training programmes for companies and schools.', start: 'Turn a skill you have into a short step-by-step lesson.' },
  { id: 'counsellor', title: 'Counsellor / therapist', themes: { care: 1, analyze: 0.2 }, modes: ['employed', 'freelance', 'impact'], does: 'Support people through mental and emotional challenges.', start: 'Look up accredited counselling courses near you and start a short intro course.' },
  { id: 'wellness_coach', title: 'Health & wellness coach', themes: { care: 0.9, teach: 0.4, nature: 0.2 }, modes: ['freelance', 'business', 'creator'], does: 'Help people build healthier habits that stick.', start: 'Get a basic wellness or fitness certificate and coach one friend for a month.' },
  { id: 'healthcare', title: 'Healthcare professional', themes: { care: 1, analyze: 0.4 }, modes: ['employed', 'impact'], does: 'Care for patients in a clinic, hospital or community.', start: 'Shadow or volunteer at a clinic for a few days.' },
  { id: 'people_partner', title: 'HR / people & culture', themes: { connect: 0.8, care: 0.6, lead: 0.4 }, modes: ['employed'], does: 'Help teams hire, grow and feel good at work.', start: 'Offer to organise onboarding or team events at your workplace.' },
  { id: 'writer', title: 'Writer / author', themes: { words: 1, create: 0.4 }, modes: ['freelance', 'creator'], does: 'Write articles, books or stories people want to read.', start: 'Write and publish one piece a week for a month.' },
  { id: 'copywriter', title: 'Copywriter / content strategist', themes: { words: 0.9, lead: 0.4, create: 0.3 }, modes: ['freelance', 'employed'], does: 'Write the words that help brands explain and sell.', start: 'Rewrite the website text of a small business and show them.' },
  { id: 'journalist', title: 'Journalist / editor', themes: { words: 0.9, analyze: 0.5, justice: 0.4 }, modes: ['employed', 'freelance'], does: 'Research and tell true stories that matter.', start: 'Pitch one story idea to a local publication or blog.' },
  { id: 'sustainability', title: 'Sustainability consultant', themes: { nature: 1, analyze: 0.4, lead: 0.4 }, modes: ['employed', 'freelance', 'impact'], does: 'Help companies cut waste and carbon.', start: 'Take a free sustainability course and audit your own workplace or home.' },
  { id: 'env_scientist', title: 'Environmental scientist', themes: { nature: 0.9, analyze: 0.8 }, modes: ['employed', 'impact'], does: 'Study and protect nature, water and climate.', start: 'Join a local conservation or citizen-science project.' },
  { id: 'outdoor_guide', title: 'Outdoor guide / eco-tourism', themes: { nature: 0.9, connect: 0.5, perform: 0.2 }, modes: ['freelance', 'business'], does: 'Lead people on trips and experiences in nature.', start: 'Lead one free guided walk or hike for friends.' },
  { id: 'landscape', title: 'Gardener / landscape designer', themes: { nature: 0.8, craft: 0.6, create: 0.4 }, modes: ['freelance', 'business'], does: 'Design and grow beautiful green spaces.', start: 'Design and plant one small garden or balcony.' },
  { id: 'founder', title: 'Founder / entrepreneur', themes: { lead: 1, create: 0.3, tech: 0.2 }, modes: ['business'], does: 'Start and grow your own business.', start: 'Sell a small version of your idea to five real customers.' },
  { id: 'product_manager', title: 'Product manager', themes: { lead: 0.8, tech: 0.6, analyze: 0.4 }, modes: ['employed'], does: 'Decide what a product team builds, and why.', start: 'Write a one-page plan to improve an app you use every day.' },
  { id: 'consultant', title: 'Business consultant', themes: { lead: 0.8, analyze: 0.7 }, modes: ['freelance', 'employed'], does: 'Solve business problems for different clients.', start: 'Help one small business fix one problem, then write up the result.' },
  { id: 'marketer', title: 'Marketing manager', themes: { lead: 0.6, words: 0.5, create: 0.5, perform: 0.3 }, modes: ['employed', 'freelance'], does: 'Help people discover and love a product.', start: 'Grow a small social account or newsletter to your first 100 followers.' },
  { id: 'sales', title: 'Sales & partnerships', themes: { lead: 0.7, connect: 0.7, perform: 0.4 }, modes: ['employed', 'freelance'], does: 'Build relationships and close deals.', start: 'Sell something small — anything — to learn how selling works.' },
  { id: 'researcher', title: 'Researcher / scientist', themes: { analyze: 1, words: 0.3 }, modes: ['employed', 'impact'], does: 'Investigate questions nobody has answered yet.', start: 'Pick a question you’re curious about and write a short research summary.' },
  { id: 'finance', title: 'Financial analyst / planner', themes: { analyze: 0.9, lead: 0.3, care: 0.2 }, modes: ['employed', 'freelance'], does: 'Help people and companies make smart money decisions.', start: 'Take a free personal-finance or financial-modelling course.' },
  { id: 'community_manager', title: 'Community manager', themes: { connect: 1, words: 0.3, lead: 0.3 }, modes: ['employed', 'freelance', 'creator'], does: 'Build and look after online or local communities.', start: 'Start a small group, online or local, around something you love.' },
  { id: 'event_producer', title: 'Event producer', themes: { connect: 0.9, lead: 0.5, create: 0.4 }, modes: ['freelance', 'business', 'employed'], does: 'Plan and run events people remember.', start: 'Organise one small meetup this month.' },
  { id: 'social_worker', title: 'Social worker', themes: { care: 0.8, justice: 0.8, connect: 0.5 }, modes: ['employed', 'impact'], does: 'Support people and families through hard times.', start: 'Volunteer with a local charity or support service.' },
  { id: 'speaker', title: 'Speaker / host', themes: { perform: 1, teach: 0.4, connect: 0.3 }, modes: ['creator', 'freelance'], does: 'Inform and inspire audiences on stage or online.', start: 'Give a short talk at a local meetup, or record one on video.' },
  { id: 'performer', title: 'Performer / musician', themes: { perform: 1, create: 0.6 }, modes: ['creator', 'freelance'], does: 'Create and perform music, theatre or comedy.', start: 'Perform in front of an audience once this month — even an open mic.' },
  { id: 'chef', title: 'Chef / food entrepreneur', themes: { craft: 1, create: 0.4, lead: 0.3 }, modes: ['business', 'employed'], does: 'Cook and sell food people love.', start: 'Sell a small batch of your best dish to friends or at a market.' },
  { id: 'maker', title: 'Maker / artisan', themes: { craft: 1, create: 0.6 }, modes: ['business', 'creator'], does: 'Make and sell handmade products.', start: 'Make five pieces and list them online or at a local market.' },
  { id: 'tradesperson', title: 'Skilled tradesperson', themes: { craft: 0.9, tech: 0.3 }, modes: ['employed', 'business'], does: 'Build, repair and install things people need.', start: 'Find an apprenticeship or short trade course near you.' },
  { id: 'nonprofit', title: 'Nonprofit / NGO professional', themes: { justice: 1, lead: 0.4, connect: 0.3 }, modes: ['impact', 'employed'], does: 'Work full-time on a cause you believe in.', start: 'Volunteer for a cause you care about for one month.' },
  { id: 'social_entrepreneur', title: 'Social entrepreneur', themes: { justice: 0.8, lead: 0.8, create: 0.2 }, modes: ['business', 'impact'], does: 'Run a business that solves a social problem.', start: 'Talk to ten people affected by the problem and test a small fix.' },
  { id: 'policy', title: 'Policy advisor / advocate', themes: { justice: 0.9, analyze: 0.5, words: 0.4 }, modes: ['impact', 'employed'], does: 'Change rules and systems to make them fairer.', start: 'Write to a local representative about an issue you care about.' },
];
