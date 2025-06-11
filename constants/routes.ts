const ROUTES = {
  HOME: "/",
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  PROFILE: (_id: string) => `/profile/${_id}`,
  QUESTIONS: (_id: string) => `/questions/${_id}`,
  TAG: (_id: string) => `/tags/${_id}`,
  ASK_QUESTION: "/ask-question",
  SIGN_IN_WITH_OAUTH: "signin-with-oauth",
  COLLECTION: "/collection",
  COMMUNITY: "/community",
  JOBS: "/jobs",
  TAGS: "/tags",
};

export default ROUTES;
