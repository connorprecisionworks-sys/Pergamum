"use client";

import { useRef, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { useFormStatus } from "react-dom";
import { Loader2, Camera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateProfile, uploadAvatar } from "./actions";
import type { Profile, Prompt } from "@/lib/types/database";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
      Save changes
    </Button>
  );
}

interface ProfileFormProps {
  profile: Profile;
  publishedPrompts: Pick<Prompt, "id" | "title">[];
}

export function ProfileForm({ profile, publishedPrompts }: ProfileFormProps) {
  const [state, action] = useFormState(updateProfile, {} as { error?: string; success?: boolean });
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? undefined);
  const [uploading, setUploading] = useState(false);
  const [featuredId, setFeaturedId] = useState(profile.featured_prompt_id ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  if (state?.success) {
    toast.success("Profile updated.");
    state.success = false; // prevent re-toast
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("avatar", file);
    const result = await uploadAvatar(fd);
    setUploading(false);
    if (result.error) { toast.error(result.error); return; }
    if (result.url) setAvatarUrl(result.url);
    toast.success("Avatar updated.");
  };

  const initials = profile.display_name
    ? profile.display_name.slice(0, 2).toUpperCase()
    : profile.username.slice(0, 2).toUpperCase();

  return (
    <form action={action} className="space-y-6 max-w-lg">
      {state?.error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{state.error}</p>
      )}

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl} alt="Avatar" />
            <AvatarFallback className="bg-pergamum-100 text-pergamum-700 text-lg">{initials}</AvatarFallback>
          </Avatar>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
        </div>
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <Camera className="h-3.5 w-3.5" />
            Change avatar
          </Button>
          <p className="text-xs text-muted-foreground mt-1">JPG, PNG, GIF · max 2 MB</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      {/* Display name */}
      <div className="space-y-1.5">
        <Label htmlFor="display_name">Display name</Label>
        <Input id="display_name" name="display_name" defaultValue={profile.display_name ?? ""} placeholder="Your name" />
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={profile.bio ?? ""} rows={3} placeholder="A few words about you…" />
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <Label htmlFor="location">Location</Label>
        <Input id="location" name="location" defaultValue={profile.location ?? ""} placeholder="City, Country" />
      </div>

      {/* Website */}
      <div className="space-y-1.5">
        <Label htmlFor="website">Website</Label>
        <Input id="website" name="website" type="url" defaultValue={profile.website ?? ""} placeholder="https://yoursite.com" />
      </div>

      {/* Twitter */}
      <div className="space-y-1.5">
        <Label htmlFor="twitter">Twitter / X handle</Label>
        <Input id="twitter" name="twitter" defaultValue={profile.twitter ?? ""} placeholder="@handle" />
      </div>

      {/* GitHub */}
      <div className="space-y-1.5">
        <Label htmlFor="github">GitHub username</Label>
        <Input id="github" name="github" defaultValue={profile.github ?? ""} placeholder="username" />
      </div>

      {/* Featured prompt */}
      {publishedPrompts.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="featured_prompt_id">Featured prompt</Label>
          <Select
            name="featured_prompt_id"
            value={featuredId}
            onValueChange={setFeaturedId}
          >
            <SelectTrigger id="featured_prompt_id">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {publishedPrompts.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Pinned to the top of your public profile.</p>
        </div>
      )}

      <SaveButton />
    </form>
  );
}
