import { redirect } from 'next/navigation'

// Root page: redirect to /stores or show landing page
// In production you can redirect to a store listing page.
export default function RootPage() {
  // If you want to redirect to a store list: redirect('/stores')
  // For now, show a simple landing page.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Multi-Store Platform
          </h1>
          <p className="text-gray-500 text-lg">
            Access your store at{' '}
            <code className="bg-gray-100 text-blue-600 px-2 py-1 rounded text-sm font-mono">
              /[your-store-slug]
            </code>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-left">
          <h2 className="font-semibold text-gray-900 mb-3">How to access your store</h2>
          <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
            <li>Log in to the admin panel</li>
            <li>Create or select your store</li>
            <li>Copy your store slug from the settings</li>
            <li>
              Visit{' '}
              <code className="bg-gray-100 px-1 rounded font-mono">
                /your-store-slug
              </code>{' '}
              on this domain
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
