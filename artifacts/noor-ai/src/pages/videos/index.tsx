import { useListVideos, getListVideosQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlayCircle, Search, FilterX, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useLang } from "@/lib/language";

export default function Videos() {
  const { t, lang } = useLang();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  const { data: videos, isLoading } = useListVideos(
    {},
    { query: { queryKey: getListVideosQueryKey() } }
  );

  const filteredVideos = videos?.filter(v => {
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = category === "all" || v.subject === category;
    return matchSearch && matchCategory;
  });

  const categories = [...new Set(videos?.map(v => v.subject) || [])].filter(Boolean);

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
  };

  const hasFilters = search || category !== "all";

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t.videoLibrary}</h1>
            <p className="text-muted-foreground mt-2">{t.videoLibraryDesc}</p>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 mb-8 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className={`absolute ${lang === "ar" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
            <Input
              placeholder={t.searchLessons}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={lang === "ar" ? "pr-9 text-right" : "pl-9"}
            />
          </div>

          <div className="flex w-full md:w-auto gap-4">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder={t.allCategories} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allCategories}</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters} title={t.clearFilters}>
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
                <Skeleton className="h-9 w-full rounded-lg" />
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
                  {video.checkpointCount > 0 && (
                    <div className="absolute top-2 end-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded font-medium shadow-sm backdrop-blur-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                      {video.checkpointCount}
                    </div>
                  )}
                </Link>
                <CardContent className="p-5 flex-1 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      {video.subject}
                    </span>
                  </div>
                  <Link href={`/videos/${video.id}`} className="hover:underline">
                    <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">{video.title}</h3>
                  </Link>
                  {video.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
                  )}

                  {/* AI Chat Button */}
                  <Link href={`/videos/${video.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-auto gap-2 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary font-medium"
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <span className="text-sm">{t.discussWithNoor}</span>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-card rounded-2xl border border-dashed">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t.noVideos}</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t.noVideosDesc}</p>
            <Button onClick={clearFilters} variant="outline">{t.clearFilters}</Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
