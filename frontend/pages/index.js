import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  return (
    <div>
      <Head>
        <title>Crypto Trading Platform</title>
        <meta name="description" content="Advanced crypto trading platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>Welcome to the Crypto Trading Platform</h1>
        <nav>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/trading">Trading</Link>
          <Link href="/analytics">Analytics</Link>
        </nav>
      </main>
    </div>
  )
}