import './globals.css';
import Navbar from './components/Navbar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />   {/* 네비게이션 바를 공통으로 추가 */}
        {children}
      </body>
    </html>
  );
}