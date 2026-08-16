import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col flex-1 w-full items-center justify-center relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 -translate-y-12 inset-x-0 flex justify-center overflow-hidden pointer-events-none">
        <div className="w-[108rem] flex-none flex justify-end">
          <div className="w-[71.75rem] flex-none max-w-none bg-gradient-to-r from-indigo-500/20 to-purple-500/20 dark:from-indigo-500/10 dark:to-purple-500/10 h-[40rem] rounded-full blur-3xl opacity-50" />
        </div>
      </div>

      <main className="relative z-10 flex flex-1 w-full flex-col items-center justify-center px-6 py-24 sm:py-32 lg:px-8 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 flex justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 dark:text-gray-300 ring-1 ring-gray-900/10 hover:ring-gray-900/20 dark:ring-white/10 dark:hover:ring-white/20 transition-all shadow-sm">
              Announcing our new shared memories feature.{' '}
              <Link href="/memories" className="font-semibold text-indigo-600 dark:text-indigo-400">
                <span className="absolute inset-0" aria-hidden="true" />
                Read more <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 pb-2">
            Explore the world, <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              share the journey
            </span>
          </h1>
          
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
            Plan your trips with ease, collaborate with friends, and keep your memories alive forever. The ultimate companion for modern travelers.
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/trips"
              className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 hover:shadow-lg hover:scale-105 transition-all duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Start Planning
            </Link>
            <Link 
              href="/memories" 
              className="text-sm font-semibold leading-6 text-gray-900 dark:text-white group transition-all"
            >
              View Memories <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">&rarr;</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-slate-50 dark:from-zinc-950 sm:h-32" />
    </div>
  );
}
