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
    intro: 'Forget what you <em>should</em> love. We’re looking for what quietly lights you up.',
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
    intro: 'Your gifts often feel ordinary to you — because they come so easily. Let’s notice them.',
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
    intro: 'Somewhere, a problem is waiting for exactly your kind of care.',
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
    intro: 'Purpose needs fuel. Let’s find where your value meets someone who’ll pay for it.',
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
    id: 'love_saturday', circle: 'love', type: 'chips', max: 3,
    title: 'It’s a free Saturday. Nothing is scheduled. What pulls you in?',
    note: 'Or describe your perfect free day in your own words…',
    hint: 'Pick up to 3 — go with your gut, not your to-do list.',
    options: [
      { id: 'sketch', label: 'Sketching or designing something', emoji: '🎨', themes: ['create'] },
      { id: 'tinker', label: 'Tinkering with tech or code', emoji: '💻', themes: ['tech'] },
      { id: 'read', label: 'Getting lost in a book or writing', emoji: '📖', themes: ['words'] },
      { id: 'outdoors', label: 'Being outdoors, far from screens', emoji: '🌲', themes: ['nature'] },
      { id: 'host', label: 'Hosting friends or meeting new people', emoji: '🥂', themes: ['connect'] },
      { id: 'learn', label: 'Going down a research rabbit hole', emoji: '🔍', themes: ['analyze'] },
      { id: 'cook', label: 'Cooking, building or fixing things', emoji: '🍳', themes: ['craft'] },
      { id: 'helping', label: 'Helping someone through a tough time', emoji: '💛', themes: ['care'] },
      { id: 'music', label: 'Music, dance or performing', emoji: '🎶', themes: ['perform'] },
      { id: 'venture', label: 'Planning a new idea or side-hustle', emoji: '🚀', themes: ['lead'] },
      { id: 'cause', label: 'Volunteering for a cause', emoji: '✊', themes: ['justice'] },
      { id: 'explain', label: 'Teaching someone something new', emoji: '🧑‍🏫', themes: ['teach'] },
    ],
  },
  {
    id: 'love_flow', circle: 'love', type: 'tags', max: 4, words: true,
    title: 'What makes you completely lose track of time?',
    hint: 'Type a few things in your own words. Press Enter after each one.',
    placeholder: 'e.g. editing videos, long walks, solving puzzles',
    suggestions: ['Drawing', 'Writing', 'Coding', 'Cooking', 'Gardening', 'Deep conversations', 'Playing music', 'Learning languages'],
  },
  {
    id: 'love_child', circle: 'love', type: 'single',
    title: 'At ten years old, you spent most of your time…',
    note: 'Anything else you loved as a kid? Tell us…',
    hint: 'Childhood often remembers what adulthood forgets.',
    options: [
      { id: 'worlds', label: 'Drawing or building imaginary worlds', emoji: '🏰', themes: ['create', 'craft'] },
      { id: 'apart', label: 'Taking things apart to see how they work', emoji: '🔧', themes: ['tech', 'analyze'] },
      { id: 'games', label: 'Organising the other kids into games', emoji: '🎯', themes: ['lead', 'connect'] },
      { id: 'reading', label: 'Reading under the covers', emoji: '🔦', themes: ['words', 'analyze'] },
      { id: 'exploring', label: 'Outside, exploring and collecting things', emoji: '🐞', themes: ['nature'] },
      { id: 'shows', label: 'Putting on shows for anyone who’d watch', emoji: '🎭', themes: ['perform'] },
      { id: 'caring', label: 'Looking after siblings, friends or pets', emoji: '🐶', themes: ['care', 'nature'] },
      { id: 'teacher', label: 'Playing teacher', emoji: '✏️', themes: ['teach'] },
      { id: 'underdog', label: 'Standing up for the underdog', emoji: '🛡️', themes: ['justice'] },
    ],
  },
  { id: 'adapt_love', circle: 'love', type: 'adaptive' },

  // ───────────── GOOD AT ─────────────
  {
    id: 'good_askedfor', circle: 'good', type: 'chips', max: 3,
    title: 'What do friends and colleagues come to you for?',
    note: 'What do people really come to you for? In your words…',
    hint: 'Pick up to 3. Think about what people actually ask you, not what you wish they’d ask.',
    options: [
      { id: 'advice', label: 'Advice on life or relationships', emoji: '🫂', themes: ['care'] },
      { id: 'fixtech', label: 'Fixing their tech problems', emoji: '🖥️', themes: ['tech'] },
      { id: 'pretty', label: 'Making things look good', emoji: '✨', themes: ['create'] },
      { id: 'organise', label: 'Organising plans and people', emoji: '📋', themes: ['lead'] },
      { id: 'explain', label: 'Explaining something complicated', emoji: '💡', themes: ['teach'] },
      { id: 'writing', label: 'Writing or editing something', emoji: '📝', themes: ['words'] },
      { id: 'numbers', label: 'Crunching numbers or research', emoji: '📊', themes: ['analyze'] },
      { id: 'intro', label: 'Introductions to the right people', emoji: '🔗', themes: ['connect'] },
      { id: 'pitch', label: 'Pitching, persuading or presenting', emoji: '🎙️', themes: ['perform'] },
      { id: 'build', label: 'Building, cooking or repairing', emoji: '🔨', themes: ['craft'] },
      { id: 'standup', label: 'Standing up for them', emoji: '🦁', themes: ['justice'] },
      { id: 'plants', label: 'Caring for plants or animals', emoji: '🪴', themes: ['nature'] },
    ],
  },
  {
    id: 'good_praise', circle: 'good', type: 'tags', max: 4, words: true,
    title: 'What skills have you been complimented on?',
    hint: 'Even the small, “that’s nothing” ones. Press Enter after each one.',
    placeholder: 'e.g. public speaking, Excel wizardry, calming people down',
    suggestions: ['Listening', 'Public speaking', 'Design', 'Problem solving', 'Organising', 'Writing', 'Cooking', 'Teaching'],
  },
  {
    id: 'good_strengths', circle: 'good', type: 'scale',
    title: 'How naturally do these come to you?',
    note: 'A strength the sliders missed? Name it…',
    hint: 'Slide honestly — 1 is “I struggle”, 5 is “it’s effortless”.',
    items: [
      { id: 'imagination', label: 'Creative imagination', emoji: '🌈', themes: ['create', 'perform'] },
      { id: 'logic', label: 'Logical problem-solving', emoji: '🧩', themes: ['analyze', 'tech'] },
      { id: 'empathy', label: 'Understanding people', emoji: '💞', themes: ['care', 'connect'] },
      { id: 'communication', label: 'Explaining & communicating', emoji: '🗣️', themes: ['teach', 'words'] },
      { id: 'leading', label: 'Organising & leading', emoji: '🧭', themes: ['lead'] },
      { id: 'hands', label: 'Working with my hands', emoji: '✋', themes: ['craft'] },
    ],
  },
  { id: 'adapt_good', circle: 'good', type: 'adaptive' },

  // ───────────── WORLD NEEDS ─────────────
  {
    id: 'needs_problems', circle: 'needs', type: 'chips', max: 3,
    title: 'Which problems in the world stir something in you?',
    note: 'Which problem gets under your skin most — and why?',
    hint: 'Pick up to 3 — the ones you can’t stop thinking about.',
    options: [
      { id: 'climate', label: 'Climate & the environment', emoji: '🔥', themes: ['nature'] },
      { id: 'mental', label: 'Mental health', emoji: '🧠', themes: ['care'] },
      { id: 'inequality', label: 'Inequality & injustice', emoji: '⚖️', themes: ['justice'] },
      { id: 'education', label: 'Access to good education', emoji: '🏫', themes: ['teach'] },
      { id: 'lonely', label: 'Loneliness & disconnection', emoji: '🫥', themes: ['connect'] },
      { id: 'misinfo', label: 'Misinformation', emoji: '📰', themes: ['words', 'analyze'] },
      { id: 'health', label: 'Physical health & disease', emoji: '🩺', themes: ['care', 'analyze'] },
      { id: 'jobs', label: 'Lack of jobs & opportunity', emoji: '💼', themes: ['lead'] },
      { id: 'digital', label: 'People left behind by technology', emoji: '📱', themes: ['tech', 'teach'] },
      { id: 'culture', label: 'Loss of art & culture', emoji: '🏛️', themes: ['create', 'perform'] },
      { id: 'waste', label: 'Throwaway culture & waste', emoji: '♻️', themes: ['craft', 'nature'] },
      { id: 'leaders', label: 'Bad leadership', emoji: '🧭', themes: ['lead', 'justice'] },
    ],
  },
  {
    id: 'needs_who', circle: 'needs', type: 'chips', max: 2,
    title: 'Who would you most love to help?',
    note: 'Who exactly? Describe the people you picture…',
    hint: 'Pick up to 2.',
    options: [
      { id: 'kids', label: 'Children & young people', emoji: '🧒', themes: ['teach', 'care'] },
      { id: 'elderly', label: 'The elderly', emoji: '👵', themes: ['care', 'connect'] },
      { id: 'founders', label: 'Founders & small businesses', emoji: '🏪', themes: ['lead', 'tech'] },
      { id: 'creators', label: 'Artists & creators', emoji: '🎨', themes: ['create', 'perform'] },
      { id: 'planet', label: 'Animals & the planet', emoji: '🐋', themes: ['nature'] },
      { id: 'patients', label: 'People who are unwell or hurting', emoji: '❤️‍🩹', themes: ['care'] },
      { id: 'learners', label: 'Students & lifelong learners', emoji: '📚', themes: ['teach', 'words'] },
      { id: 'overlooked', label: 'Overlooked communities', emoji: '🤝', themes: ['justice', 'connect'] },
      { id: 'teams', label: 'Professionals & teams', emoji: '🏢', themes: ['lead', 'analyze'] },
    ],
  },
  {
    id: 'needs_fix', circle: 'needs', type: 'tags', max: 3, words: true,
    title: 'If you could fix one thing in the world, what would it be?',
    hint: 'Dream big, write small. A few words is perfect.',
    placeholder: 'e.g. kids growing up without mentors',
    suggestions: ['Loneliness', 'Plastic waste', 'Burnout', 'Access to education', 'Mental health stigma', 'Food waste'],
  },
  { id: 'adapt_needs', circle: 'needs', type: 'adaptive' },

  // ───────────── PAID FOR ─────────────
  {
    id: 'paid_market', circle: 'paid', type: 'chips', max: 3,
    title: 'What could people pay you for — now, or with a little practice?',
    note: 'Something else people would pay you for?',
    hint: 'Pick up to 3. Be generous with yourself.',
    options: [
      { id: 'design', label: 'Designing visuals or brands', emoji: '🎨', themes: ['create'] },
      { id: 'software', label: 'Building software or websites', emoji: '🧑‍💻', themes: ['tech'] },
      { id: 'coaching', label: 'Coaching, tutoring or training', emoji: '🧑‍🏫', themes: ['teach'] },
      { id: 'wellness', label: 'Health, therapy or wellness', emoji: '🧘', themes: ['care'] },
      { id: 'content', label: 'Writing or creating content', emoji: '✍️', themes: ['words'] },
      { id: 'green', label: 'Sustainability or outdoor work', emoji: '🌿', themes: ['nature'] },
      { id: 'consult', label: 'Managing or consulting', emoji: '🗂️', themes: ['lead'] },
      { id: 'research', label: 'Research or data analysis', emoji: '📊', themes: ['analyze'] },
      { id: 'events', label: 'Running events or communities', emoji: '🎪', themes: ['connect'] },
      { id: 'media', label: 'Speaking, performing or video', emoji: '🎥', themes: ['perform'] },
      { id: 'handmade', label: 'Making, cooking or repairing', emoji: '🧁', themes: ['craft'] },
      { id: 'impact', label: 'Advocacy or nonprofit work', emoji: '📢', themes: ['justice'] },
    ],
  },
  {
    id: 'paid_before', circle: 'paid', type: 'tags', max: 4, words: true,
    title: 'What have you been paid for — or asked to do for money?',
    hint: 'Jobs, gigs, favours someone offered to pay for. It all counts.',
    placeholder: 'e.g. wedding photos, tutoring maths, social media',
    suggestions: ['Tutoring', 'Freelance design', 'Consulting', 'Baking', 'Photography', 'Copywriting', 'Coding'],
  },
  {
    id: 'paid_style', circle: 'paid', type: 'single', style: true,
    title: 'How would you love to earn a living?',
    note: 'Your ideal working life, in a sentence…',
    hint: 'This shapes the paths we suggest.',
    options: [
      { id: 'employed', label: 'A great role at an organisation I believe in', emoji: '🏢', themes: [] },
      { id: 'freelance', label: 'Freelance, on my own terms', emoji: '🧳', themes: [] },
      { id: 'business', label: 'Building my own business', emoji: '🚀', themes: ['lead'] },
      { id: 'creator', label: 'Growing an audience as a creator', emoji: '📱', themes: ['perform'] },
      { id: 'impact', label: 'At a mission-driven organisation', emoji: '🌍', themes: ['justice'] },
      { id: 'mix', label: 'A mix — a portfolio career', emoji: '🧩', themes: [] },
    ],
  },
  { id: 'adapt_paid', circle: 'paid', type: 'adaptive' },
];
