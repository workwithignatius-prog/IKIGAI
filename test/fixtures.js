// Shared test data.
export const SAMPLE_SYNTHESIS = {
  archetype: 'The Storytelling Healer',
  statement: 'helping people heal through honest stories',
  ikigai_title: 'Stories that heal',
  ikigai_description: 'You turn listening into language.',
  insight: 'You mentioned "deep conversations" twice.',
  core_themes: ['care', 'words'],
  passion: { label: 'Listening deeply', insight: 'You lose time in long talks.' },
  mission: { label: 'Ending the stigma', insight: 'Mental health stigma keeps you up.' },
  profession: { label: 'Writing for wellbeing', insight: 'Copywriting pays.' },
  vocation: { label: 'Health storytelling', insight: 'Clinics need words.' },
  circles: {
    love: { sentence: 'You come alive in deep conversations.', words: ['deep conversations'] },
    good: { sentence: 'You make people feel heard.', words: ['listening'] },
    needs: { sentence: 'People need stigma-free help.', words: ['less stigma'] },
    paid: { sentence: 'People pay you to write.', words: ['copywriting'] },
  },
  careers: [
    { title: 'Mental-health content writer', match: 94, why: 'Joins your writing and your listening.', day_to_day: 'Write articles and guides for clinics.', first_step: 'Write one story about a friend\u2019s recovery.', themes: ['words', 'care'] },
    { title: 'Counsellor', match: 88, why: 'People already come to you to be heard.', day_to_day: 'Talk with clients one-to-one.', first_step: 'Take an intro counselling course.', themes: ['care'] },
    { title: 'Wellness podcaster', match: 81, why: 'You love deep conversations.', day_to_day: 'Interview people and publish episodes.', first_step: 'Record three episodes with friends.', themes: ['perform', 'care'] },
    { title: 'Health journalist', match: 76, why: 'You care about stigma and truth.', day_to_day: 'Research and report health stories.', first_step: 'Pitch one story to a local paper.', themes: ['words', 'analyze'] },
    { title: 'Patient advocate', match: 70, why: 'You stand up for people who are unwell.', day_to_day: 'Help patients navigate care.', first_step: 'Volunteer at a patient charity.', themes: ['justice', 'care'] },
  ],
  next_steps: [
    { when: 'This week', title: 'Write one story', text: 'Interview a friend.' },
    { when: 'This month', title: 'Pitch a clinic', text: 'Offer a newsletter.' },
    { when: 'In 90 days', title: 'Launch', text: 'Start a series.' },
  ],
};
