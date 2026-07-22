import React from 'react';

export const ProductSkeleton: React.FC = () => {
  return (
    <div className="premium-card animate-pulse" style={{ pointerEvents: 'none' }}>
      {/* Image Skeleton Area */}
      <div className="prod-img-wrap bg-gray-200 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-gray-300/50 flex items-center justify-center">
          <i className="fa-regular fa-image text-gray-400 text-2xl"></i>
        </div>
      </div>
      
      {/* Content Skeleton Area */}
      <div className="prod-info-wrap flex flex-col gap-2">
        {/* Category Label Shimmer */}
        <div className="w-1/3 h-3 bg-gray-200 rounded"></div>
        
        {/* Title Label Shimmer */}
        <div className="w-4/5 h-4.5 bg-gray-200 rounded mt-1"></div>
        <div className="w-2/3 h-4.5 bg-gray-200 rounded"></div>
        
        {/* Stars Shimmer */}
        <div className="flex gap-1 items-center mt-1">
          <div className="flex gap-0.5 text-gray-200">
            {Array.from({ length: 5 }).map((_, idx) => (
              <i key={idx} className="fa-solid fa-star text-[11px]"></i>
            ))}
          </div>
          <div className="w-10 h-3 bg-gray-200 rounded ml-1"></div>
        </div>

        {/* Price Row & Add Button Shimmer */}
        <div className="flex justify-between items-center mt-3">
          <div className="flex gap-2 items-center">
            <div className="w-16 h-5 bg-gray-200 rounded"></div>
          </div>
          <div className="w-9 h-9 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductSkeleton;
