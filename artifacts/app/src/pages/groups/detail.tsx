import { useParams } from "wouter";
import { 
  useGetGroup, 
  useListTasks, 
  useGetGroupStats,
  useCreateTask,
  useAiChat,
  useAiSuggestTasks,
  getGetGroupQueryKey,
  getListTasksQueryKey,
  getGetGroupStatsQueryKey,
  ChatMessage,
  TaskInputPriority
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Send, Wand2, Sparkles, BotMessageSquare, CheckSquare } from "lucide-react";
import { TaskCard } from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function GroupDetail() {
  const { id } = useParams();
  const groupId = parseInt(id || "0", 10);
  const queryClient = useQueryClient();

  const { data: group, isLoading: isLoadingGroup } = useGetGroup(groupId, { query: { enabled: !!groupId, queryKey: getGetGroupQueryKey(groupId) } });
  const { data: tasks, isLoading: isLoadingTasks } = useListTasks({ groupId }, { query: { enabled: !!groupId, queryKey: getListTasksQueryKey({ groupId }) } });
  const { data: stats } = useGetGroupStats(groupId, { query: { enabled: !!groupId, queryKey: getGetGroupStatsQueryKey(groupId) } });

  const createTask = useCreateTask();
  const aiChat = useAiChat();
  const aiSuggest = useAiSuggestTasks();

  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskInputPriority>("medium");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, aiChat.isPending]);

  const handleSendMessage = () => {
    if (!chatInput.trim() || aiChat.isPending) return;

    const userMessage: ChatMessage = { role: "user", content: chatInput };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setChatInput("");

    aiChat.mutate(
      { data: { message: chatInput, groupId, conversationHistory: messages } },
      {
        onSuccess: (reply) => {
          setMessages([...newMessages, { role: "assistant", content: reply.message }]);
        }
      }
    );
  };

  const handleCreateTask = () => {
    createTask.mutate(
      { data: { title, description, priority, groupId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey({ groupId }) });
          queryClient.invalidateQueries({ queryKey: getGetGroupStatsQueryKey(groupId) });
          setNewTaskOpen(false);
          setTitle("");
          setDescription("");
          setPriority("medium");
        }
      }
    );
  };

  const handleSuggestTasks = () => {
    aiSuggest.mutate(
      { data: { groupId } },
      {
        onSuccess: (res) => {
          // Just taking the first suggestion and popping open the dialog for user to confirm
          if (res.suggestions.length > 0) {
            const s = res.suggestions[0];
            setTitle(s.title);
            setDescription(s.description || "");
            setPriority(s.priority as TaskInputPriority);
            setNewTaskOpen(true);
          }
        }
      }
    );
  };

  if (isLoadingGroup || isLoadingTasks) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  if (!group) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:flex-row gap-6 max-w-7xl mx-auto">
      {/* Left side: Tasks */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: group.color || 'var(--primary)' }} />
            <h1 className="text-2xl font-bold tracking-tight truncate">{group.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSuggestTasks} disabled={aiSuggest.isPending}>
              {aiSuggest.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-primary" />}
              Suggest Tasks
            </Button>
            <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Additional details..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={(v) => setPriority(v as TaskInputPriority)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setNewTaskOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateTask} disabled={!title || createTask.isPending}>
                    {createTask.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Task
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {group.description && (
          <p className="text-muted-foreground mb-6">{group.description}</p>
        )}

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-8">
          {tasks?.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
          {tasks?.length === 0 && (
            <div className="border border-dashed rounded-lg p-12 text-center flex flex-col items-center justify-center text-muted-foreground">
              <CheckSquare className="h-10 w-10 mb-4 opacity-20" />
              <p>No tasks in this group yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right side: AI Assistant Chat */}
      <Card className="w-full md:w-80 lg:w-96 flex flex-col h-[500px] md:h-auto shrink-0 bg-sidebar/5 border-sidebar-border">
        <CardHeader className="py-3 px-4 border-b bg-card">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BotMessageSquare className="h-4 w-4 text-primary" />
            AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground my-8">
                Ask me about this group, or what to do next.
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-foreground'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {aiChat.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground max-w-[85%] rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                </div>
              </div>
            )}
          </div>
          <div className="p-3 bg-card border-t mt-auto">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex items-center gap-2"
            >
              <Input 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask AI..."
                className="flex-1 text-sm bg-background"
                disabled={aiChat.isPending}
              />
              <Button type="submit" size="icon" disabled={!chatInput.trim() || aiChat.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
