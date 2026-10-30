import type { Situation } from './select';

export const MESSAGES: Record<Situation, string[]> = {
  noEntries: [
    'Welcome! Your first weigh-in is the start of something good.',
    "Today is a great day to begin. Log your first weight whenever you're ready.",
    'Every journey has a first step, and this is yours.',
  ],
  readyToLog: [
    'Good to see you. A quick weigh-in keeps your picture clear.',
    'Ready when you are. Five seconds is all this takes.',
    'Another day, another small step. You are doing this.',
  ],
  welcomeBack: [
    'Welcome back! Really glad you are here.',
    'Life happens, and you came back. That is what counts.',
    'Good to see you again. Pick up right where you are.',
  ],
  first: [
    'Your first entry is in. This is your starting line, and you crossed it.',
    'That took courage. You have begun, and that is the hardest part.',
    'Day one, done. Your future self is already grateful.',
  ],
  streak: [
    'Another full week of showing up. That consistency is your superpower.',
    'Seven more days in a row! Habits like this are what change things.',
    'Look at you go. Showing up every day is the real win.',
  ],
  upDayTrendDown: [
    'One day is water, not fat; your trend is still down.',
    'A small bump today, but the bigger picture is still moving your way.',
    'Daily numbers wobble. Your trend is what matters, and it looks great.',
  ],
  upTrend: [
    'The trend has crept up a little, and that is okay. Every long journey has hills.',
    'A slower patch is part of the process. You are still here, and that matters.',
    'Be kind to yourself this week. One small choice at a time is all it takes.',
  ],
  plateau: [
    'Holding steady is real progress too. Bodies often pause before moving again.',
    'A plateau is normal. Keep going, and the trend will follow.',
    'You are maintaining your progress, and that takes effort. Well done.',
  ],
  downDay: [
    'Nice work today. Small steps really do add up.',
    'Moving in the right direction. Keep being kind to yourself.',
    'Lovely to see. You are earning every bit of this progress.',
  ],
  upDay: [
    'Daily numbers bounce around, and that is completely normal.',
    'One number is just one moment. Thank you for showing up today.',
    'Water, salt and sleep all move the scale. You are doing fine.',
  ],
  milestone: [
    'Congratulations on {milestone}! You earned this.',
    'Look at that: {milestone}! Take a moment to be proud.',
    '{milestone}! All those small days added up to this.',
  ],
};
