export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f1117] text-gray-100">
      {/* Hero */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <span className="text-xl font-bold text-indigo-400">SubTracker</span>
        <nav className="flex items-center gap-3">
          <a href="/login" className="rounded-lg px-4 py-1.5 text-sm text-gray-400 hover:text-gray-100 hover:bg-white/5 transition-colors">
            Sign in
          </a>
          <a
            href="/register"
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm text-white hover:bg-indigo-500 transition-colors"
          >
            Get started
          </a>
        </nav>
      </header>

      <section className="flex flex-col items-center justify-center gap-8 px-4 py-32 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-400">
          ✨ Track every subscription you own
        </div>
        <h1 className="max-w-2xl text-5xl font-bold tracking-tight text-white">
          Stop losing money on forgotten subscriptions
        </h1>
        <p className="max-w-lg text-lg text-gray-400">
          SubTracker helps you manage all your recurring expenses in one place. Get renewal alerts before you're charged.
        </p>
        <div className="flex gap-4">
          <a
            href="/register"
            className="rounded-xl bg-indigo-600 px-8 py-3 text-white font-medium hover:bg-indigo-500 transition-colors"
          >
            Start for free
          </a>
          <a
            href="/login"
            className="rounded-xl border border-white/10 px-8 py-3 text-gray-300 font-medium hover:bg-white/5 transition-colors"
          >
            Sign in
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 gap-8 px-8 pb-24 sm:grid-cols-3 max-w-4xl mx-auto">
        {[
          { icon: '📋', title: 'All in one place', desc: 'Netflix, Spotify, AWS — list everything with cost, cycle and renewal date.' },
          { icon: '🔔', title: 'Renewal alerts', desc: 'Get notified by email before your subscriptions renew so you can cancel on time.' },
          { icon: '📊', title: 'Monthly overview', desc: 'See exactly how much you spend per month and per category.' },
        ].map(f => (
          <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold text-white mb-1">{f.title}</h3>
            <p className="text-sm text-gray-400">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
