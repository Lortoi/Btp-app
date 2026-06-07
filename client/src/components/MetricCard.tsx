import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function MetricCard({
  title,
  value,
  change,
  trend,
  subtitle,
  icon,
  className
}: MetricCardProps) {
  return (
    <Card className={cn("shadow-glow-hover", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <div className="flex items-end gap-2">
              <h3 className="text-stat">{value}</h3>
              {change && (
                <div className={cn(
                  "flex items-center text-xs font-medium",
                  trend === 'up' ? "text-brand-light" : "text-red-400"
                )}>
                  {trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {change}
                </div>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-[#888888]">{subtitle}</p>
            )}
          </div>
          
          {icon && (
            <div className="p-3 rounded-lg bg-brand/10 border border-brand/20 text-brand">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
