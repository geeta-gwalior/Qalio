// SkeletonLoader.tsx
import { cn } from '@/lib/utils'

export default function MessagingSkeleton () {
  return (
    <div className='flex h-[87vh] bg-white rounded-lg shadow-lg animate-pulse'>
      {/* Contacts Sidebar Skeleton */}
      <div className='w-[260px] border-r border-dashed border-[#219CAE] p-4 space-y-4'>
        <div className='h-6 bg-gray-200 rounded w-3/4' />
        <div className='h-10 bg-[#E4EEFF] rounded-md' />

        <div className='space-y-4 pt-4'>
          {[...Array(4)].map((_, i) => (
            <div key={i} className='flex items-start space-x-3'>
              <div className='h-10 w-10 bg-gray-300 rounded-full' />
              <div className='flex-1 space-y-2'>
                <div className='h-4 bg-gray-200 rounded w-3/4' />
                <div className='h-3 bg-gray-200 rounded w-1/2' />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area Skeleton */}
      <div className='flex-1 flex flex-col '>
        {/* Header */}
        <div className='h-[70px] border-b shadow-sm flex items-center px-4 space-x-4'>
          <div className='h-[50px] w-[50px] rounded-full bg-gray-300' />
          <div className='space-y-2 flex-1'>
            <div className='h-4 bg-gray-200 rounded w-1/3' />
            <div className='h-3 bg-gray-200 rounded w-1/4' />
          </div>
          <div className='h-6 w-6 bg-gray-200 rounded-full' />
        </div>

        {/* Messages */}
        <div className='flex-1 overflow-y-auto p-4 space-y-6'>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex',
                i % 2 === 0 ? 'justify-start' : 'justify-end'
              )}
            >
              <div className='flex items-start space-x-2 max-w-[600px]'>
                {i % 2 === 0 && (
                  <div className='h-8 w-8 bg-gray-300 rounded-full' />
                )}
                <div className='space-y-2'>
                  <div className='h-4 bg-gray-200 rounded w-32' />
                  <div className='h-10 bg-gray-100 rounded-lg w-60' />
                </div>
                {i % 2 !== 0 && (
                  <div className='h-8 w-8 bg-gray-300 rounded-full' />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className='p-4'>
          <div className='relative'>
            <div className='h-14 bg-gray-100 rounded-lg' />
            <div className='absolute right-4 top-1/2 transform -translate-y-1/2 flex space-x-4'>
              {[...Array(3)].map((_, i) => (
                <div key={i} className='h-8 w-8 bg-gray-200 rounded-full' />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
