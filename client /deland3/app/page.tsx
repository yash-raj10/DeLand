import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
            🏛️ DeLand - Blockchain Land Records
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-300 mt-2">
            Transparent, Immutable, and Tamper-proof Land Registry System
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center px-4 py-16 sm:py-24">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
              Welcome to DeLand
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Choose an option to get started with the land registry system
            </p>
          </div>

          <div className="space-y-4">
            {/* Add New Land Entry Button */}
            <Link
              href="/admin"
              className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              <svg
                className="w-6 h-6 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add New Land Entry
            </Link>

            {/* View Property Details Button */}
            <Link
              href="/property"
              className="w-full flex items-center justify-center px-8 py-4 border-2 border-indigo-600 text-lg font-medium rounded-lg text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 shadow-lg hover:shadow-xl dark:bg-gray-800 dark:text-indigo-400 dark:border-indigo-400 dark:hover:bg-gray-700"
            >
              <svg
                className="w-6 h-6 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              View Property Details
            </Link>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-3xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Secure
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Blockchain-based security ensures your land records are
              tamper-proof
            </p>
          </div>
          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-3xl mb-4">👁️</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Transparent
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Full transparency in all land transactions and ownership transfers
            </p>
          </div>
          <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Efficient
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Quick and easy access to property information and records
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
