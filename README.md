<<<<<<< HEAD
# Multi-Agent AI System

This project is a multi-agent AI system built using Next.js, Prisma, Supabase, and OpenAI. It provides a platform for managing AI agents, user authentication, and interaction with the OpenAI API.

## Features

- **Agent Management**: Create and manage AI agents through a dedicated API.
- **User Authentication**: Secure login functionality for users.
- **OpenAI Integration**: Interact with the OpenAI API to generate text based on user prompts.
- **Dashboard**: A user-specific dashboard to view and interact with agents.

## Technologies Used

- **Next.js**: A React framework for building server-side rendered applications.
- **Prisma**: An ORM for database management and migrations.
- **Supabase**: A backend-as-a-service for authentication and database storage.
- **OpenAI**: API for generating AI-driven content.

## Project Structure

```
multi-agent-ai-system
├── src
│   ├── pages
│   │   ├── api
│   │   │   ├── agents
│   │   │   │   └── index.ts
│   │   │   ├── auth
│   │   │   │   └── login.ts
│   │   │   └── openai
│   │   │       └── query.ts
│   │   ├── index.tsx
│   │   └── dashboard.tsx
│   ├── components
│   │   ├── AgentCard.tsx
│   │   └── Navbar.tsx
│   ├── lib
│   │   ├── prisma.ts
│   │   └── supabaseClient.ts
│   ├── styles
│   │   ├── globals.css
│   │   └── dashboard.module.css
│   └── utils
│       ├── openaiHelper.ts
│       └── agentManager.ts
├── prisma
│   ├── schema.prisma
│   └── migrations
├── public
│   └── favicon.ico
├── .env.local
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

## Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd multi-agent-ai-system
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory and add your database connection strings and OpenAI API keys.

4. **Run Migrations**:
   Ensure your database is set up and run the following command to apply migrations:
   ```bash
   npx prisma migrate dev
   ```

5. **Start the Development Server**:
   ```bash
   npm run dev
   ```

6. **Access the Application**:
   Open your browser and navigate to `http://localhost:3000`.

## Usage Guidelines

- Use the dashboard to manage your agents and view their interactions.
- Authenticate using the login API to access user-specific features.
- Interact with the OpenAI API through the provided endpoints to generate content.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
=======
# zulgap-ai
>>>>>>> 925ed6ef6b7cca7f9a744cc665aedb64ac609886
