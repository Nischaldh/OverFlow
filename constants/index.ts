export const sidebarLinks = [
  {
    imgURL: "/icons/home.svg",
    route: "/",
    label: "Home",
  },
  {
    imgURL: "/icons/users.svg",
    route: "/community",
    label: "Community",
  },
  {
    imgURL: "/icons/star.svg",
    route: "/collection",
    label: "Collections",
  },
  {
    imgURL: "/icons/suitcase.svg",
    route: "/jobs",
    label: "Find Jobs",
  },
  {
    imgURL: "/icons/tag.svg",
    route: "/tags",
    label: "Tags",
  },
  {
    imgURL: "/icons/user.svg",
    route: "/profile",
    label: "Profile",
  },
  {
    imgURL: "/icons/question.svg",
    route: "/ask-question",
    label: "Ask a question",
  },
];

export const BADGE_CRITERIA = {
  QUESTION_COUNT: {
    BRONZE: 5,
    SILVER: 10,
    GOLD: 20,
  },
  ANSWER_COUNT: {
    BRONZE: 10,
    SILVER: 20,
    GOLD: 30,
  },
  QUESTION_UPVOTES: {
    BRONZE: 25,
    SILVER: 50,
    GOLD: 100,
  },
  ANSWER_UPVOTES: {
    BRONZE: 50,
    SILVER: 100,
    GOLD: 500,
  },
  TOTAL_VIEWS: {
    BRONZE: 10,
    SILVER: 100,
    GOLD: 200,
  },
};

export const Interaction_Weights = {
  view: 1,
  answer: 5,
  upvote: 2,
  downvote: -1,
  bookmark: 3,
  post: 10,
  unbookmark: -3,
};

export const countriesList: Country[] = [
  { name: { common: "All Locations" } },
  { name: { common: "Nepal" } },
  { name: { common: "India" } },
  { name: { common: "United States" } },
  { name: { common: "United Kingdom" } },
  { name: { common: "Canada" } },
  { name: { common: "Australia" } },
  { name: { common: "Germany" } },
  { name: { common: "France" } },
  { name: { common: "Japan" } },
  { name: { common: "China" } },
];