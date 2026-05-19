import { useListTasks, useUpdateTask, useDeleteTask, getListTasksQueryKey, Task } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, Loader2, CheckCircle2, Circle, MoreVertical, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export function TaskCard({ task }: { task: Task }) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const queryClient = useQueryClient();

  const handleStatusChange = (status: "pending" | "in_progress" | "completed") => {
    updateTask.mutate(
      { id: task.id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        }
      }
    );
  };

  const handleDelete = () => {
    deleteTask.mutate(
      { id: task.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        }
      }
    );
  };

  const isCompleted = task.status === "completed";

  const priorityColors = {
    low: "bg-secondary text-secondary-foreground",
    medium: "bg-orange-500/20 text-orange-500 border-orange-500/30",
    high: "bg-destructive/20 text-destructive border-destructive/30"
  };

  const statusColors = {
    pending: "text-muted-foreground",
    in_progress: "text-primary",
    completed: "text-muted-foreground"
  };

  return (
    <Card className={`group transition-all ${isCompleted ? 'opacity-60 bg-muted/50' : 'bg-card'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <button 
            onClick={() => handleStatusChange(isCompleted ? "pending" : "completed")}
            className={`mt-0.5 flex-shrink-0 transition-colors ${statusColors[task.status]}`}
          >
            {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`font-medium truncate ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleStatusChange("pending")}>Mark Pending</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange("in_progress")}>Mark In Progress</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange("completed")}>Mark Completed</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {task.description && (
              <p className={`mt-1 text-sm line-clamp-2 ${isCompleted ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                {task.description}
              </p>
            )}
            
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={priorityColors[task.priority]}>
                {task.priority}
              </Badge>
              
              {task.dueDate && (
                <div className="flex items-center text-xs text-muted-foreground gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(task.dueDate), "MMM d")}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
