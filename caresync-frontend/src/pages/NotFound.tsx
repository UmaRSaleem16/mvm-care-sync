import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/common/Button'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-bold text-slate-200">404</p>
      <p className="mt-2 text-xl font-semibold text-slate-700">Page not found</p>
      <p className="mt-1 text-sm text-slate-500">The page you're looking for doesn't exist.</p>
      <Button className="mt-6" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
    </div>
  )
}
