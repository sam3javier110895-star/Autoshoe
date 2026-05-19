import { useListGroups, useCreateGroup, getListGroupsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";

export default function Groups() {
  const { data: groups, isLoading } = useListGroups();
  const createGroup = useCreateGroup();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#06b6d4"); // cyan-500

  const handleCreate = () => {
    createGroup.mutate({
      data: { name, description, color }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey() });
        setOpen(false);
        setName("");
        setDescription("");
      }
    });
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
          <p className="text-muted-foreground mt-1">Manage your task groups.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Frontend Team" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details about this group" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input id="color" type="color" className="w-16 h-10 p-1" value={color} onChange={(e) => setColor(e.target.value)} />
                  <Input value={color} onChange={(e) => setColor(e.target.value)} className="flex-1" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!name || createGroup.isPending}>
                {createGroup.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups?.map((group) => (
          <Link key={group.id} href={`/groups/${group.id}`} className="block">
            <Card className="hover:border-primary/50 transition-colors h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: group.color || 'var(--primary)' }} 
                  />
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {group.description || "No description provided."}
                </p>
                <div className="mt-4 text-xs text-muted-foreground">
                  Updated {new Date(group.updatedAt || group.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
