'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signup, setSignup] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupMsg, setSignupMsg] = useState('');
  const router = useRouter();

  // 로그인 핸들러
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      // 모든 반환값을 상세하게 출력
      console.log('[LOGIN DEBUG] signIn result:', res);

      if (res && res.ok) {
        router.push('/chat');
      } else {
        let detail = '';
        if (res?.error) {
          detail = ` (next-auth error: ${res.error})`;
        }
        // 콘솔에 상세 로그 남기기 (status, url, error 등 모두 출력)
        console.error(`[LOGIN FAIL] email: ${email}, reason: ${res?.error || 'Unknown'}${detail}`, res);

        // 추가: 네트워크 탭 안내
        if (!res) {
          alert('로그인 실패: signIn 함수에서 반환값이 없습니다.\n브라우저 개발자도구 네트워크 탭에서 /api/auth/callback/credentials, /api/auth/providers 요청의 응답을 확인해 주세요.');
        } else if (res?.status) {
          alert(`로그인 실패: 서버 응답 코드 ${res.status}\n${res.error || ''}`);
        } else if (res?.error === 'CredentialsSignin') {
          alert('로그인 실패: 이메일 또는 비밀번호가 올바르지 않습니다.');
        } else if (res?.error) {
          alert(`로그인 실패: ${res.error}`);
        } else {
          alert('로그인 실패: 서버에 연결할 수 없습니다. (네트워크 또는 라우트 문제)\n브라우저 개발자도구 네트워크 탭에서 /api/auth/providers, /api/auth/session 요청의 응답을 확인해 주세요.');
        }
      }
    } catch (err: any) {
      // 네트워크/예외 에러도 상세 출력
      console.error('[LOGIN ERROR] 네트워크 또는 예외:', err);
      alert(`로그인 실패: 네트워크 또는 서버 예외\n${err?.message || err}`);
    }
  };

  // 회원가입 핸들러
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupMsg('');
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: signupEmail, password: signupPassword }),
    });
    if (res.ok) {
      setSignupMsg('회원가입 성공! 이제 로그인하세요.');
      setSignup(false);
      setEmail(signupEmail);
      setPassword('');
    } else {
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: '회원가입 실패(서버 응답 없음)' };
      }
      setSignupMsg(data.error || '회원가입 실패');
    }
  };

  return (
    <>
      <div style={{ maxWidth: 400, margin: 'auto', padding: 32 }}>
        <h2>{signup ? '회원가입' : '로그인'}</h2>
        {!signup ? (
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            /><br />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            /><br />
            <button type="submit">로그인</button>
            <button type="button" style={{ marginLeft: 8 }} onClick={() => setSignup(true)}>
              회원가입
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup}>
            <input
              type="email"
              placeholder="이메일"
              value={signupEmail}
              onChange={e => setSignupEmail(e.target.value)}
              required
            /><br />
            <input
              type="password"
              placeholder="비밀번호"
              value={signupPassword}
              onChange={e => setSignupPassword(e.target.value)}
              required
            /><br />
            <button type="submit">회원가입</button>
            <button type="button" style={{ marginLeft: 8 }} onClick={() => setSignup(false)}>
              로그인으로
            </button>
            {signupMsg && <div style={{ color: signupMsg.includes('성공') ? 'green' : 'red', marginTop: 8 }}>{signupMsg}</div>}
          </form>
        )}
      </div>
    </>
  );
}