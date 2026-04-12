import { Badge } from "@/components/ui/badge"

interface SubjectBadgeProps {
  name: string
  color: string
  icon?: string
}

export function SubjectBadge({ name, color, icon }: SubjectBadgeProps) {
  return (
    <Badge
      variant="outline"
      className="transition-all duration-200 hover:scale-105 hover:shadow-sm gap-1 px-2 py-0.5"
      style={{
        borderColor: color,
        color: color,
        backgroundColor: `${color}10`, // 10% opacity
      }}
    >
      {icon && <span className="text-xs">{icon}</span>}
      <span className="font-medium text-xs">{name}</span>
    </Badge>
  )
}
