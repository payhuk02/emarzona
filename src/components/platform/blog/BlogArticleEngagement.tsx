import { useCallback, useState } from 'react';
import {
  Copy,
  Facebook,
  Heart,
  Linkedin,
  Link2,
  Mail,
  MessageCircle,
  Share2,
  Twitter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  usePlatformBlogEngagement,
  useRecordBlogShare,
  useToggleBlogLike,
  type BlogShareChannel,
} from '@/hooks/platform/usePlatformBlogEngagement';

interface BlogArticleEngagementProps {
  postId: string;
  articleUrl: string;
  articleTitle: string;
  allowComments: boolean;
  onScrollToComments?: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
  className?: string;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function BlogArticleEngagement({
  postId,
  articleUrl,
  articleTitle,
  allowComments,
  onScrollToComments,
  t,
  className,
}: BlogArticleEngagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: engagement } = usePlatformBlogEngagement(postId);
  const toggleLike = useToggleBlogLike(postId);
  const recordShare = useRecordBlogShare(postId);
  const [shareOpen, setShareOpen] = useState(false);

  const liked = engagement?.user_liked ?? false;
  const likeCount = engagement?.like_count ?? 0;
  const commentCount = engagement?.comment_count ?? 0;
  const shareCount = engagement?.share_count ?? 0;
  const viewCount = engagement?.view_count ?? 0;

  const handleLike = () => {
    if (!user) {
      toast({
        title: t('engagement.loginToLike'),
        description: t('engagement.loginToLikeDesc'),
      });
      return;
    }
    toggleLike.mutate();
  };

  const shareLinks: {
    channel: BlogShareChannel;
    label: string;
    icon: typeof Twitter;
    href?: string;
  }[] = [
    {
      channel: 'twitter',
      label: 'X',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(articleTitle)}`,
    },
    {
      channel: 'facebook',
      label: 'Facebook',
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`,
    },
    {
      channel: 'linkedin',
      label: 'LinkedIn',
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`,
    },
    {
      channel: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(`${articleTitle} ${articleUrl}`)}`,
    },
    {
      channel: 'email',
      label: 'Email',
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(articleTitle)}&body=${encodeURIComponent(articleUrl)}`,
    },
  ];

  const runShare = useCallback(
    async (channel: BlogShareChannel, href?: string) => {
      if (channel === 'copy') {
        await navigator.clipboard.writeText(articleUrl);
        toast({ title: t('engagement.linkCopied') });
      } else if (channel === 'native' && navigator.share) {
        await navigator.share({ title: articleTitle, url: articleUrl });
      } else if (href) {
        window.open(href, '_blank', 'noopener,noreferrer,width=600,height=500');
      }
      recordShare.mutate(channel);
      setShareOpen(false);
    },
    [articleTitle, articleUrl, recordShare, t, toast]
  );

  return (
    <div className={cn('rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5', className)}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              'gap-2 border-white/15 bg-transparent text-white/80 hover:bg-white/10',
              liked && 'border-rose-400/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/15'
            )}
            onClick={handleLike}
            disabled={toggleLike.isPending}
          >
            <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
            {formatCount(likeCount)}
            <span className="hidden sm:inline">{t('engagement.likes')}</span>
          </Button>

          {allowComments ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 border-white/15 bg-transparent text-white/80 hover:bg-white/10"
              onClick={onScrollToComments}
            >
              <MessageCircle className="h-4 w-4" />
              {formatCount(commentCount)}
              <span className="hidden sm:inline">{t('engagement.comments')}</span>
            </Button>
          ) : null}

          <span className="inline-flex items-center gap-1.5 px-2 text-xs text-white/45">
            {formatCount(viewCount)} {t('engagement.views')}
          </span>
        </div>

        <div className="relative">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 border-white/15 bg-transparent text-white/80 hover:bg-white/10"
            onClick={() => setShareOpen(v => !v)}
          >
            <Share2 className="h-4 w-4" />
            {t('engagement.share')}
            {shareCount > 0 ? ` · ${formatCount(shareCount)}` : ''}
          </Button>

          {shareOpen ? (
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-white/10 bg-[#121218] p-2 shadow-xl">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                onClick={() => void runShare('copy')}
              >
                <Copy className="h-4 w-4" />
                {t('engagement.copyLink')}
              </button>
              {typeof navigator !== 'undefined' && 'share' in navigator ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                  onClick={() => void runShare('native')}
                >
                  <Share2 className="h-4 w-4" />
                  {t('engagement.nativeShare')}
                </button>
              ) : null}
              {shareLinks.map(item => (
                <button
                  key={item.channel}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                  onClick={() => void runShare(item.channel, item.href)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {!user ? (
        <p className="mt-3 text-xs text-white/45">
          <Link to="/login" className="text-[var(--lp-blue-bright)] hover:underline">
            {t('engagement.login')}
          </Link>{' '}
          {t('engagement.loginHint')}
        </p>
      ) : null}
    </div>
  );
}

export function BlogEngagementStats({
  likes,
  comments,
  views,
  t,
  className,
}: {
  likes: number;
  comments: number;
  views: number;
  t: (key: string) => string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 text-xs text-white/45', className)}>
      <span className="inline-flex items-center gap-1">
        <Heart className="h-3 w-3" />
        {formatCount(likes)} {t('engagement.likes')}
      </span>
      <span className="inline-flex items-center gap-1">
        <MessageCircle className="h-3 w-3" />
        {formatCount(comments)}
      </span>
      <span className="inline-flex items-center gap-1">
        <Link2 className="h-3 w-3" />
        {formatCount(views)} {t('engagement.views')}
      </span>
    </div>
  );
}
