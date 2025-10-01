/**
 * Floating Action Button - Mobile-first responsive component
 * Shows as floating + button on mobile, inline button on desktop
 */

import { PlusIcon } from '@heroicons/react/24/outline'

interface FloatingActionButtonProps {
  onClick: () => void
  label: string
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}

const FloatingActionButton = ({ 
  onClick, 
  label, 
  icon: Icon = PlusIcon,
  className = '' 
}: FloatingActionButtonProps) => {
  return (
    <>
      {/* Desktop Button - Inline with title */}
      <button
        onClick={onClick}
        className={`hidden lg:flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors ${className}`}
      >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </button>

      {/* Mobile Floating Action Button */}
      <button
        onClick={onClick}
        className="lg:hidden fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 hover:scale-110 z-50"
        title={label}
      >
        <Icon className="h-6 w-6" />
      </button>
    </>
  )
}

export default FloatingActionButton
