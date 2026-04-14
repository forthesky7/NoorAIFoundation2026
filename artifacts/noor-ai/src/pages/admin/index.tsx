import { AppLayout } from "@/components/layout/AppLayout";
import { 
  useGetAdminDashboard, getGetAdminDashboardQueryKey,
  useListVideos, getListVideosQueryKey,
  useCreateVideo, useDeleteVideo
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, PlayCircle, CreditCard, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false);
  
  const { data: stats, isLoading: statsLoading } = useGetAdminDashboard({
    query: { queryKey: getGetAdminDashboardQueryKey() }
  });
  
  const { data: videos, isLoading: videosLoading } = useListVideos(undefined, {
    query: { queryKey: getListVideosQueryKey() }
  });

  const createVideoMutation = useCreateVideo();
  const deleteVideoMutation = useDeleteVideo();

  // Add Video Form State
  const [title, setTitle] = useState("");
  const [youtubeId, setYoutubeId] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [durationStr, setDurationStr] = useState("");

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    createVideoMutation.mutate({
      data: {
        title,
        youtubeId,
        description,
        subject,
        grade,
        duration: parseInt(durationStr) || 300,
        thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListVideosQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
        setIsAddVideoOpen(false);
        toast({ title: "Video added successfully" });
        // Reset form
        setTitle(""); setYoutubeId(""); setDescription(""); setSubject(""); setGrade(""); setDurationStr("");
      }
    });
  };

  const handleDeleteVideo = (id: number) => {
    if (confirm("Are you sure you want to delete this video?")) {
      deleteVideoMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVideosQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
          toast({ title: "Video deleted" });
        }
      });
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
            <p className="text-muted-foreground mt-1">Manage platform content and users.</p>
          </div>
        </div>

        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Subscribers</CardTitle>
                <CreditCard className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalSubscribers || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Video Library</CardTitle>
                <PlayCircle className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalVideos || 0}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="videos">Video Management</TabsTrigger>
            <TabsTrigger value="users">Recent Users</TabsTrigger>
          </TabsList>
          
          <TabsContent value="videos" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Video Catalog</h2>
              <Dialog open={isAddVideoOpen} onOpenChange={setIsAddVideoOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" /> Add Video</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add New Video</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddVideo} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">YouTube Video ID</label>
                      <Input required placeholder="e.g. dQw4w9WgXcQ" value={youtubeId} onChange={e => setYoutubeId(e.target.value)} />
                      <p className="text-xs text-muted-foreground">The 11-character code in the YouTube URL</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Title</label>
                      <Input required placeholder="Video Title" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Subject</label>
                        <Select required value={subject} onValueChange={setSubject}>
                          <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Math">Math</SelectItem>
                            <SelectItem value="Science">Science</SelectItem>
                            <SelectItem value="History">History</SelectItem>
                            <SelectItem value="Computer Science">Computer Science</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Grade Level</label>
                        <Select required value={grade} onValueChange={setGrade}>
                          <SelectTrigger><SelectValue placeholder="Grade" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="9">Grade 9</SelectItem>
                            <SelectItem value="10">Grade 10</SelectItem>
                            <SelectItem value="11">Grade 11</SelectItem>
                            <SelectItem value="12">Grade 12</SelectItem>
                            <SelectItem value="College">College</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Duration (seconds)</label>
                      <Input type="number" required value={durationStr} onChange={e => setDurationStr(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full" disabled={createVideoMutation.isPending}>
                      {createVideoMutation.isPending ? "Adding..." : "Save Video"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground border-b">
                    <tr>
                      <th className="px-6 py-3 font-medium">Title</th>
                      <th className="px-6 py-3 font-medium">Subject</th>
                      <th className="px-6 py-3 font-medium">Grade</th>
                      <th className="px-6 py-3 font-medium">Checkpoints</th>
                      <th className="px-6 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videosLoading ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center"><Skeleton className="h-8 w-full max-w-md mx-auto" /></td></tr>
                    ) : videos?.map((video) => (
                      <tr key={video.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-medium">{video.title}</td>
                        <td className="px-6 py-4"><span className="bg-secondary px-2 py-1 rounded text-xs">{video.subject}</span></td>
                        <td className="px-6 py-4 text-muted-foreground">{video.grade}</td>
                        <td className="px-6 py-4 text-muted-foreground">{video.checkpointCount}</td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteVideo(video.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="users">
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground border-b">
                    <tr>
                      <th className="px-6 py-3 font-medium">Name</th>
                      <th className="px-6 py-3 font-medium">Email</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.recentUsers?.map((user) => (
                      <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-medium">{user.name}</td>
                        <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                        <td className="px-6 py-4">
                          {user.subscribed ? (
                            <span className="text-primary bg-primary/10 px-2 py-1 rounded-md text-xs font-medium">Premium</span>
                          ) : (
                            <span className="text-muted-foreground bg-secondary px-2 py-1 rounded-md text-xs">Free</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {format(new Date(user.createdAt), 'MMM d, yyyy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
