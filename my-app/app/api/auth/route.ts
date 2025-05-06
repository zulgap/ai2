import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000/auth/login"; // NestJS 로그인 API

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        // NestJS 백엔드로 로그인 요청 중계
        const res = await fetch(BACKEND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          console.log(`[LOGIN FAIL] 백엔드 응답 실패: ${res.status}`);
          return null;
        }

        const user = await res.json();
        if (!user || !user.id) {
          console.log(`[LOGIN FAIL] 백엔드 사용자 없음`);
          return null;
        }

        console.log(`[LOGIN SUCCESS] ${email}`);
        return user;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});

export { handler as GET, handler as POST };