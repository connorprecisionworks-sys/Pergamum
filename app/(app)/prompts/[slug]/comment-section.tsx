"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { relativeTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { CommentWithAuthor } from "@/lib/types/database";

interface CommentSectionProps {
  promptId: string;
  initialComments: CommentWithAuthor[];
  currentUserId: string | null;
}

interface CommentItemProps {
  comment: CommentWithAuthor;
  promptId: string;
  currentUserId: string | null;
  onReply: (comment: CommentWithAuthor) => void;
}

function CommentItem({ comment, promptId, currentUserId, onReply }: CommentItemProps) {
  const author = comment.profiles;
  const initials = author?.display_name
    ? author.display_name.slice(0, 2).toUpperCase()
    : author?.username?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0 mt-0.5">
        <AvatarImage
          src={author?.avatar_url ?? undefined}
          alt={author?.display_name ?? author?.username ?? ""}
        />
        <AvatarFallback className="text-xs bg-violet-100 text-violet-700">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-baseline gap-2">
          <Link
            href={`/u/${author?.username}`}
            className="text-sm font-medium hover:text-violet-600 transition-colors"
          >
            {author?.display_name ?? author?.username}
          </Link>
          <span className="text-xs text-muted-foreground">
            {relativeTime(comment.created_at)}
          </span>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {comment.body}
        </p>
        {currentUserId && (
          <button
            onClick={() => onReply(comment)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-1 transition-colors"
          >
            <Reply className="h-3 w-3" />
            Reply
          </button>
        )}
      </div>
    </div>
  );
}

export function CommentSection({
  promptId,
  initialComments,
  currentUserId,
}: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<CommentWithAuthor | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  const submitComment = (body: string, parentId: string | null) => {
    if (!currentUserId) {
      toast.error("Sign in to leave a comment.");
      return;
    }
    if (!body.trim()) return;

    startTransition(async () => {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          prompt_id: promptId,
          user_id: currentUserId,
          body: body.trim(),
          parent_id: parentId ?? null,
        })
        .select(`*, profiles(id, username, display_name, avatar_url)`)
        .single();

      if (error) {
        toast.error("Failed to post comment.");
        return;
      }

      toast.success("Comment posted!");
      setComments((prev) => [...prev, data as CommentWithAuthor]);
      setNewComment("");
      setReplyText("");
      setReplyingTo(null);
    });
  };

  return (
    <div className="space-y-6">
      {/* Comment list */}
      {comments.length > 0 ? (
        <div className="space-y-5">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              promptId={promptId}
              currentUserId={currentUserId}
              onReply={(c) => {
                setReplyingTo(c);
                setReplyText("");
              }}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-4">
          No comments yet. Be the first to share your experience with this prompt!
        </p>
      )}

      {/* Reply form */}
      {replyingTo && currentUserId && (
        <div className="pl-11 space-y-2">
          <p className="text-xs text-muted-foreground">
            Replying to{" "}
            <span className="font-medium">
              {replyingTo.profiles?.display_name ?? replyingTo.profiles?.username}
            </span>
          </p>
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply…"
            rows={3}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => submitComment(replyText, replyingTo.id)}
              disabled={!replyText.trim() || isPending}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              Post reply
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setReplyingTo(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* New comment form */}
      {currentUserId ? (
        <div className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your experience with this prompt, suggest improvements…"
            rows={3}
            aria-label="Write a comment"
          />
          <Button
            onClick={() => submitComment(newComment, null)}
            disabled={!newComment.trim() || isPending}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Post comment
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground bg-muted rounded-lg p-4">
          <Link
            href="/auth/login"
            className="text-violet-600 hover:text-violet-700 font-medium"
          >
            Sign in
          </Link>{" "}
          to leave a comment.
        </p>
      )}
    </div>
  );
}
