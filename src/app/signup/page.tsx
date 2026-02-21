import SignupForm from '@/components/auth/SignupForm'
import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: '新規登録 | NEN2',
  description: 'NEN2でブログを始めよう',
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 dark:bg-gray-900">
      <Link href="/" className="mb-8 flex items-center gap-2 text-2xl font-bold text-blue-600">
        <Image src="/logo.png" alt="NEN2" width={32} height={32} className="h-8 w-8" />
        NEN2
      </Link>
      <SignupForm />
    </div>
  )
}
