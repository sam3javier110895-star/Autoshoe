import { useListTasks } from "@workspace/api-client-react";
import { TaskCard } from "@/components/task-card";
import { Loader2 } from "lucide-react";

export default function Tasks() {
  const { data: tasks, isLoading } = useListTasks();

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All Tasks</h1>
        <p className="text-muted-foreground mt-1">Manage tasks across all your groups.</p>
      </div>

      <div className="grid gap-3">
        {tasks?.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks?.length === 0 && (
          <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
            No tasks found. Create a group to add tasks.
          </div>
        )}
      </div>
    </div>
  );
}
