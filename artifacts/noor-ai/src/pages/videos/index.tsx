import { useListVideos, getListVideosQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlayCircle, Search, FilterX } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function Videos() {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState<string>("all");
  const [grade, setGrade] = useState<string>("all");

  const { data: videos, isLoading } = useListVideos(
    { 
      subject: subject !== "all" ? subject : undefined,
      grade: grade !== "all" ? grade : undefined
    },
    { query: { queryKey: getListVideosQueryKey({ subject: subject !== "all" ? subject : undefined, grade: grade !== "all" ? grade : undefined }) } }
  );

  const filteredVideos = videos?.filter(v => 
    v.title.toLowerCase().includes(search.toLowerCase()) || 
    (v.description && v.description.toLowerCase().includes(search.toLowerCase()))
  );

  const subjects = ["Math", "Science", "History", "English", "Programming", "Physics"];
  const grades = ["9", "10", "11", "12", "College"];

  const clearFilters = () => {
    setSearch("");
    setSubject("all");
    setGrade("all");
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Video Library</h1>
            <p className="text-muted-foreground mt-2">Interactive lessons with AI comprehension checks.</p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 mb-8 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search lessons..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex w-full md:w-auto gap-4">
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {grades.map(g => <SelectItem key={g} value={g}>Grade {g}</SelectItem>)}
              </SelectContent>
            </Select>
            
            {(search || subject !== "all" || grade !== "all") && (
              <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear filters">
                <FilterX className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="w-full aspect-video rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredVideos && filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map(video => (
              <Card key={video.id} className="overflow-hidden flex flex-col hover-elevate transition-all border-border/50 group">
                <Link href={`/videos/${video.id}`} className="block relative aspect-video bg-muted cursor-pointer overflow-hidden">
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/50 text-muted-foreground">
                      <PlayCircle className="h-10 w-10 opacity-50 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <PlayCircle className="h-16 w-16 text-white opacity-80" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-medium shadow-sm backdrop-blur-sm">
                    {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                  </div>
                  {video.checkpointCount > 0 && (
                    <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded font-medium shadow-sm backdrop-blur-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                      {video.checkpointCount} Checkpoints
                    </div>
                  )}
                </Link>
                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      {video.subject}
                    </span>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                      Grade {video.grade}
                    </span>
                  </div>
                  <Link href={`/videos/${video.id}`} className="hover:underline">
                    <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">{video.title}</h3>
                  </Link>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-auto">{video.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-card rounded-2xl border border-dashed">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No videos found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              We couldn't find any lessons matching your current filters. Try adjusting your search terms or clearing the filters.
            </p>
            <Button onClick={clearFilters} variant="outline">Clear all filters</Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
