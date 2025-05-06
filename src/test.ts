import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 데이터베이스 연결 테스트: User 테이블에서 모든 사용자 가져오기
  const users = await prisma.user.findMany();
  console.log('Users:', users);

  // 새 사용자 추가 테스트
  const newUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed_password', // 실제로는 해시된 비밀번호를 사용해야 합니다.
    },
  });
  console.log('New User Created:', newUser);
}

main()
  .catch((e) => {
    console.error('Error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });