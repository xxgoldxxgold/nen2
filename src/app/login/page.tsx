import LoginForm from '@/components/auth/LoginForm'
import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'ログイン | NEN2',
  description: 'NEN2にログイン',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 dark:bg-gray-900">
      <Link href="/" className="mb-8 flex items-center gap-2 text-2xl font-bold text-blue-600">
        <Image src="/logo.png" alt="NEN2" width={43} height={43} className="h-[43px] w-[43px]" />
        NEN2
      </Link>
      <LoginForm />
    </div>
  )
}
