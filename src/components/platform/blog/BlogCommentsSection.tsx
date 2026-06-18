import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  useAddBlogComment,
  usePlatformBlogComments,
  type BlogComment,
} from '@/hooks/platform/usePlatformBlogEngagement';
import { cn } from '@/lib/utils';

interface BlogCommentsSectionProps {
  postId: string;
  allowComments: boolean;
  locale: 'fr' | 'en';
  t: (key: string, opts?: Record<string, unknown>) => string;
}

export function BlogCommentsSection({
  postId,
  allowComments,
  locale,
  t,
}: BlogCommentsSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const dateLocale = locale === 'en' ? enUS : fr;
  const { data: comments = [], isLoading } = usePlatformBlogComments(postId);
  const addComment = useAddBlogComment(postId);
  const [body, setBody] = useState('');
  const [guestName, setGuestName] = useState('');
  const [replyTo, setReplyTo] = useState<BlogComment | null>(null);

  const { roots, repliesByParent } = useMemo(() => {
    const roots: BlogComment[] = [];
    const repliesByParent = new Map<string, BlogComment[]>();
    for (const c of comments) {
      if (!c.parent_id) {
        roots.push(c);
      } else {
        const list = repliesByParent.get(c.parent_id) ?? [];
        list.push(c);
        repliesByParent.set(c.parent_id, list);
      }
    }
    return { roots, repliesByParent };
  }, [comments]);

  if (!allowComments) {
    return (
      <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-sm text-white/50">
        {t('engagement.commentsDisabled')}
      </section>
    );
  }

  const submit = async () => {
    const trimmed = body.trim();
    if (trimmed.length < 2) return;

    try {
      const result = await addComment.mutateAsync({
        body: trimmed,
        authorName: user ? undefined : guestName.trim() || undefined,
        parentId: replyTo?.id ?? null,
      });
      setBody('');
      setReplyTo(null);
      if (result.comment.status === 'pending') {
        toast({
          title: t('engagement.commentPendingTitle'),
          description: t('engagement.commentPendingDesc'),
        });
      } else {
        toast({ title: t('engagement.commentPublished') });
      }
    } catch (e) {
      toast({
        title: t('engagement.commentError'),
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    }
  };

  return (
    <section id="blog-comments" className="mt-10 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">{t('engagement.commentsTitle')}</h2>
        <p className="mt-1 text-sm text-white/50">{t('engagement.commentsSubtitle')}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 space-y-4">
        {replyTo ? (
          <div className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/60">
            <span>
              {t('engagement.replyingTo')}{' '}
              <strong className="text-white/80">{replyTo.author_name}</strong>
            </span>
            <button
              type="button"
              className="text-[var(--lp-blue-bright)] hover:underline"
              onClick={() => setReplyTo(null)}
            >
              {t('engagement.cancelReply')}
            </button>
          </div>
        ) : null}

        {!user ? (
          <div className="space-y-2">
            <Label htmlFor="guest-name" className="text-white/70">
              {t('engagement.yourName')}
            </Label>
            <Input
              id="guest-name"
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              placeholder={t('engagement.namePlaceholder')}
              className="border-white/10 bg-white/[0.04] text-white"
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="comment-body" className="text-white/70">
            {t('engagement.yourComment')}
          </Label>
          <Textarea
            id="comment-body"
            rows={4}
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={t('engagement.commentPlaceholder')}
            className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/35"
          />
        </div>

        <Button
          type="button"
          onClick={submit}
          disabled={addComment.isPending || body.trim().length < 2}
          className="gap-2"
        >
          {addComment.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {t('engagement.publishComment')}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-white/50">{t('engagement.loadingComments')}</p>
      ) : roots.length === 0 ? (
        <p className="text-sm text-white/50">{t('engagement.noComments')}</p>
      ) : (
        <ul className="space-y-4">
          {roots.map(comment => (
            <CommentThread
              key={comment.id}
              comment={comment}
              replies={repliesByParent.get(comment.id) ?? []}
              dateLocale={dateLocale}
              t={t}
              onReply={setReplyTo}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function CommentThread({
  comment,
  replies,
  dateLocale,
  t,
  onReply,
}: {
  comment: BlogComment;
  replies: BlogComment[];
  dateLocale: typeof fr;
  t: (key: string) => string;
  onReply: (c: BlogComment) => void;
}) {
  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <CommentItem comment={comment} dateLocale={dateLocale} t={t} onReply={onReply} />
      {replies.length > 0 ? (
        <ul className="mt-4 ml-4 space-y-3 border-l border-white/10 pl-4">
          {replies.map(reply => (
            <li key={reply.id}>
              <CommentItem
                comment={reply}
                dateLocale={dateLocale}
                t={t}
                onReply={onReply}
                compact
              />
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function CommentItem({
  comment,
  dateLocale,
  t,
  onReply,
  compact = false,
}: {
  comment: BlogComment;
  dateLocale: typeof fr;
  t: (key: string) => string;
  onReply: (c: BlogComment) => void;
  compact?: boolean;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('font-medium text-white', compact ? 'text-sm' : 'text-base')}>
          {comment.author_name}
        </span>
        <span className="text-xs text-white/40">
          {format(new Date(comment.created_at), 'PPp', { locale: dateLocale })}
        </span>
      </div>
      <p
        className={cn('mt-2 text-white/75 whitespace-pre-wrap', compact ? 'text-sm' : 'text-base')}
      >
        {comment.body}
      </p>
      <button
        type="button"
        className="mt-2 text-xs text-[var(--lp-blue-bright)] hover:underline"
        onClick={() => onReply(comment)}
      >
        {t('engagement.reply')}
      </button>
    </div>
  );
}
