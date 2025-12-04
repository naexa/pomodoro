import { FC } from 'react';
import { Category } from '../../types';
import { getCategoryColorClasses } from '../../hooks/useCategories';

interface CategoryBadgeProps {
  category: Category;
  size?: 'sm' | 'md';
  onRemove?: () => void;
  onClick?: () => void;
}

export const CategoryBadge: FC<CategoryBadgeProps> = ({
  category,
  size = 'sm',
  onRemove,
  onClick,
}) => {
  const colors = getCategoryColorClasses(category.color);
  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${colors.bg} ${colors.text} ${sizeClasses} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={onClick}
    >
      <span>{category.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:opacity-70"
        >
          ×
        </button>
      )}
    </span>
  );
};
