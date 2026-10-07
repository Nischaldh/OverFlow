# Overflow

A full-stack, AI-assisted Q&A platform for developers where users ask technical questions, share answers, vote, bookmark, and discover relevant content through a personalized hybrid recommendation engine — built with Next.js, MongoDB, and Google Gemini.

[Live Demo](https://over-flow-one.vercel.app/) · [GitHub Repository](https://github.com/Nischaldh/OverFlow)

## Motivation

I built Overflow to explore what a Q&A platform could look like if it were friendlier to beginners than the traditional model. On Stack Overflow, users must earn reputation before they can upvote, comment, or downvote, and posts are often closed or deleted by moderators. That is great for content quality but discouraging for people who are still learning.

Overflow removes those barriers and encourages open participation, then adds the features that make a community platform genuinely useful: AI-generated answer assistance, a recommendation system that learns from how each user interacts with the site, global search, personal collections, a community directory, and a job listings page.

A major focus of the project was the recommendation engine. Instead of relying on manually chosen tags, Overflow tracks user interactions and combines three scoring methods (content-based filtering, collaborative filtering, and popularity) into a single ranked "Recommended" feed.

## Features

### Questions and Answers
- Ask questions with a rich markdown editor (MDX Editor) supporting code blocks and formatting
- Tag questions (up to 5 tags) and browse by tag
- Answer questions posted by others
- Upvote and downvote questions and answers, with toggle behavior on repeated clicks
- View counts, answer counts, and vote counts on every question
- Home feed filters: Newest, Popular, Unanswered, and Recommended
- Pagination across all lists

### AI Assistance
- One-click **Generate AI Answer** on any question
- Uses Google Gemini through the Vercel AI SDK
- The AI considers the question, its content, and any answer you have already typed. It keeps your answer if it is correct and improves or corrects it if it is not
- Automatic fallback across multiple Gemini models when one is overloaded
- Available to logged-in users only

### Discovery
- Global search bar across questions, answers, tags, and user profiles
- Local search and filters on each page
- Personalized recommendations based on your activity (see [Recommendation Algorithm](#recommendation-algorithm))
- Tags page with question counts per tag

### Users and Community
- Register and log in with email and password, or with Google or GitHub
- Public profiles showing questions, answers, top tags, and gold, silver, and bronze badges
- Edit your own profile
- Community page to explore other members
- Collections page to save and revisit favorite questions

### Jobs
- Job listings page with filtering by location and keyword, powered by an API from RapidAPI

### Platform
- Dark and light theme with system preference support
- Fully responsive layout
- Zod validation on all API inputs
- Structured logging with Pino
- User-friendly error messages and toast notifications

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server Components, API Routes), React 19 |
| Language | TypeScript |
| Database | MongoDB + Mongoose (MongoDB Atlas) |
| Authentication | NextAuth v5 (credentials, Google, GitHub) + bcryptjs |
| AI | Vercel AI SDK (`ai`) + Google Gemini (`@ai-sdk/google`) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui, Radix UI, Lucide React |
| Forms and Validation | React Hook Form + Zod |
| Editor and Rendering | MDX Editor, next-mdx-remote, Bright (code highlighting) |
| Logging | Pino |
| Theming | next-themes |
| Deployment | Vercel |

## Quick Start

### Prerequisites

- Node.js v18+
- A MongoDB database (free MongoDB Atlas cluster works)
- A Google AI Studio account for the Gemini API key (free)
- A RapidAPI account for the job listings API key (free plan)
- GitHub and Google OAuth apps (optional, only if you want social login)

### 1. Clone the repository

```bash
git clone https://github.com/Nischaldh/OverFlow.git
cd OverFlow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root and fill in the values (see [Environment Variables](#environment-variables) below).

### 4. Run the development server

```bash
npm run dev
```

The app runs on http://localhost:3000.

### Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Create a production build |
| `npm start` | Run the production build |
| `npm run lint` | Run ESLint |

## Environment Variables

```env
MONGODB_URI=yourMongoDbConnectionString

AUTH_SECRET=yourAuthSecret
AUTH_GITHUB_ID=yourGithubClientId
AUTH_GITHUB_SECRET=yourGithubClientSecret
AUTH_GOOGLE_ID=yourGoogleClientId
AUTH_GOOGLE_SECRET=yourGoogleClientSecret

GOOGLE_GENERATIVE_AI_API_KEY=yourGeminiApiKey

NEXT_PUBLIC_RAPID_API_KEY=yourRapidApiKey
```

An optional `GEMINI_MODEL` variable can also be set to override the default Gemini model (see below).

### How to get each value

#### MONGODB_URI
A MongoDB connection string. Format: `mongodb+srv://user:password@cluster.mongodb.net/dbname`

- Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free cluster
- Create a database user under **Database Access**
- Allow your IP under **Network Access**
- Click **Connect → Drivers** and copy the connection string, replacing `<password>` with your user's password

#### AUTH_SECRET
Any long random string used by NextAuth to sign sessions. Generate one with:

```bash
npx auth secret
```

or

```bash
openssl rand -base64 32
```

#### AUTH_GITHUB_ID and AUTH_GITHUB_SECRET
For "Login with GitHub".

1. Go to GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
2. Set the homepage URL to `http://localhost:3000`
3. Set the callback URL to `http://localhost:3000/api/auth/callback/github`
4. Copy the **Client ID**, then generate and copy a **Client Secret**

#### AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET
For "Login with Google".

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a project
2. Open **APIs & Services → OAuth consent screen** and configure it
3. Open **Credentials → Create Credentials → OAuth client ID** and choose **Web application**
4. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI
5. Copy the **Client ID** and **Client Secret**

#### GOOGLE_GENERATIVE_AI_API_KEY
For AI answer generation.

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and sign in
2. Click **Create API key** and pick a project
3. Copy the key

The variable name must match exactly, because `@ai-sdk/google` reads it automatically.

#### NEXT_PUBLIC_RAPID_API_KEY
For the job listings page.

1. Sign up at [rapidapi.com](https://rapidapi.com/)
2. Open the jobs API used by the app on RapidAPI and click **Subscribe to Test** (the free plan is enough for development)
3. Copy your key from the **X-RapidAPI-Key** field in the code snippets panel, or from your app under **My Apps**

> **Note:** Variables starting with `NEXT_PUBLIC_` are bundled into the browser code, so this key is visible to anyone using the site. Use a free-plan key with usage limits, and consider moving the job requests into an API route if you want to keep it private.

#### GEMINI_MODEL
Optional. The Gemini model used for AI answers. If unset, the app falls back to a default. Model names change often, so check the current free models at [ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models).

> **Note:** Restart the dev server after editing `.env.local`. Next.js only reads environment files at startup.

> **Note:** On the Gemini free tier, Google may use your prompts to improve its products, and rate limits apply per project. Preview models can return `503` errors during demand spikes, which is why the AI route tries several models in order.

## Usage

### Visitor flow
1. Browse questions, tags, the community page, and job listings without an account
2. Sign up with email and password, or continue with Google or GitHub

### Asking and answering
1. Click **Ask a Question**, write a title and details in the markdown editor, and add up to 5 tags
2. Open any question to read it and post an answer
3. Click **Generate AI Answer** to get an AI-assisted response. If you have typed your own answer first, the AI builds on it and corrects it where needed
4. Upvote or downvote helpful posts, and click the star to save a question to your collection

### Discovering content
1. Use the filters on the home page: Newest, Popular, Unanswered, Recommended
2. Use the global search bar to find questions, tags, and users
3. Visit the Tags page to browse by topic
4. Visit the Community page to explore other members' profiles

## Recommendation Algorithm

The **Recommended** feed ranks questions with a hybrid score that combines three signals:

```
Final Score = 0.5 × CBF + 0.3 × CF + 0.2 × Popularity
```

| Signal | What it measures | How |
|---|---|---|
| **Content-Based Filtering (CBF)** | How well a question's tags match the tags you interact with | Cosine similarity between your weighted tag vector and the question's tag vector |
| **Collaborative Filtering (CF)** | What users similar to you have engaged with | Cosine similarity between your interaction vector and other users', applied to the questions they interacted with |
| **Popularity** | Overall community engagement | `0.5 × upvotes + 0.3 × answers + 0.2 × views`, each normalized by the maximum across all questions |

A question is recommended only when its final score is above **0.6**. Your own questions are excluded from your feed.

**Worked example:** for a question with CBF = 0.567, CF = 0.717, and popularity = 0.85:

```
0.5 × 0.567 + 0.3 × 0.717 + 0.2 × 0.85 = 0.669
```

Since 0.669 is above the 0.6 threshold, the question is recommended.

> Recommendations improve as you interact with the platform. A brand-new account, or a platform with few questions, will see fewer results.

## Contributing

### Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
npm install
```

### Run in development

```bash
npm run dev
```

### Build for production

```bash
npm run build && npm start
```

### Submit a pull request

Fork the repository, make your changes on a new branch, and open a pull request to `main`. Please keep PRs focused: one feature or fix per PR.