export const CONTACTS = [
  { id: 1, name: "Anjali",  initials: "AS", online: true,  time: "2m ago",    preview: "Can't wait for tonight ✨",    unread: 2 },
  { id: 2, name: "Aliya", initials: "LM", online: true,  time: "14m ago",   preview: "That sunset was beautiful 🌅", unread: 0 },
  { id: 3, name: "Jennyfer",  initials: "ZH", online: false, time: "1h ago",    preview: "I loved that place too!",      unread: 0 },
  { id: 4, name: "Mia",    initials: "EC", online: false, time: "3h ago",    preview: "Coffee tomorrow?",             unread: 1 },
  { id: 5, name: "Maya",   initials: "MR", online: true,  time: "Yesterday", preview: "You're so funny lol 😄",       unread: 0 },
];

export const INITIAL_MESSAGES = {
  1: [
    { id: 1, text: "Hey! So happy we matched 😊",               sent: false, time: "6:00 PM" },
    { id: 2, text: "Same here! Your profile caught my eye.",     sent: true,  time: "6:02 PM" },
    { id: 3, text: "Aww that's so sweet 🥺 Where are you from?",sent: false, time: "6:04 PM" },
    { id: 4, text: "I'm from Mumbai! You?",                     sent: true,  time: "6:05 PM" },
    { id: 5, text: "No way, me too!! Small world 😍",           sent: false, time: "6:06 PM" },
    { id: 6, text: "Can't wait for tonight ✨",                 sent: false, time: "6:07 PM" },
  ],
  2: [
    { id: 1, text: "That photo you posted was stunning.",        sent: true,  time: "5:10 PM" },
    { id: 2, text: "Thank you! That sunset was beautiful 🌅",   sent: false, time: "5:12 PM" },
  ],
  3: [
    { id: 1, text: "Have you been to Olive Bar?",               sent: true,  time: "3:00 PM" },
    { id: 2, text: "I loved that place too!",                   sent: false, time: "3:15 PM" },
  ],
  4: [
    { id: 1, text: "Hey, are you free tomorrow morning?",       sent: false, time: "10:00 AM" },
    { id: 2, text: "Coffee tomorrow?",                          sent: false, time: "10:01 AM" },
  ],
  5: [
    { id: 1, text: "Okay that joke was terrible 😂",            sent: false, time: "Yesterday" },
    { id: 2, text: "You're so funny lol 😄",                    sent: false, time: "Yesterday" },
  ],
};
