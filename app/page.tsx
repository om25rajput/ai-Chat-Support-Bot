import { CustomerSupportChat } from "@/components/customer-support-chat"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 text-slate-200">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Customer Support</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Get instant help with your orders, payments, and more
          </p>
        </div>
        <CustomerSupportChat />
      </div>
    </div>
  )
}
