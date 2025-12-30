export const motivationalQuotes = [
  {
    quote: "The pain you feel today will be the strength you feel tomorrow.",
    author: "Arnold Schwarzenegger"
  },
  {
    quote: "Success isn't always about greatness. It's about consistency.",
    author: "Dwayne Johnson"
  },
  {
    quote: "The only bad workout is the one that didn't happen.",
    author: "Unknown"
  },
  {
    quote: "Don't limit your challenges. Challenge your limits.",
    author: "Unknown"
  },
  {
    quote: "Your body can stand almost anything. It's your mind you have to convince.",
    author: "Unknown"
  },
  {
    quote: "The difference between try and triumph is a little umph.",
    author: "Marvin Phillips"
  },
  {
    quote: "Push harder than yesterday if you want a different tomorrow.",
    author: "Unknown"
  },
  {
    quote: "Strength does not come from physical capacity. It comes from an indomitable will.",
    author: "Mahatma Gandhi"
  },
  {
    quote: "The body achieves what the mind believes.",
    author: "Napoleon Hill"
  },
  {
    quote: "What seems impossible today will one day become your warm-up.",
    author: "Unknown"
  },
  {
    quote: "Discipline is choosing between what you want now and what you want most.",
    author: "Abraham Lincoln"
  },
  {
    quote: "The only way to define your limits is by going beyond them.",
    author: "Arthur C. Clarke"
  },
  {
    quote: "Champions are made from something deep inside – a desire, a dream, a vision.",
    author: "Muhammad Ali"
  },
  {
    quote: "Every rep counts. Every drop of sweat matters.",
    author: "Unknown"
  },
  {
    quote: "You're only one workout away from a good mood.",
    author: "Unknown"
  }
];

export const getRandomQuote = () => {
  const index = Math.floor(Math.random() * motivationalQuotes.length);
  return motivationalQuotes[index];
};

export const getDailyQuote = () => {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const index = dayOfYear % motivationalQuotes.length;
  return motivationalQuotes[index];
};
