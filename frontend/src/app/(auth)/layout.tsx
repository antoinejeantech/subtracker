export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f1117] px-4">
      <a href="/" className="mb-8 text-2xl font-bold text-indigo-400">
        SubTracker
      </a>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#161b27] p-8">
        {children}
      </div>
    </div>
  )
}
