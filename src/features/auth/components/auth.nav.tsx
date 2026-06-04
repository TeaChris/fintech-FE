import Link from 'next/link'

function AuthNav() {
      return (
            <nav className="w-full flex items-center justify-between px-20 py-5">
                  {/* TODO: add logo later */}

                  <Link
                        href="/"
                        className="text-xl sm:text-3xl font-bold font-geistSans text-accent"
                  >
                        BpaY
                  </Link>
            </nav>
      )
}

export { AuthNav }
