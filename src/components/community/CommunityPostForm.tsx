/**
 * Formulaire de création/édition de post
 * Date: 31 Janvier 2025
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useState } from 'react';
import { useCreateCommunityPost, useUpdateCommunityPost } from '@/hooks/community/useCommunityPosts';
import type { CommunityPost } from '@/types/community';

const postFormSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(10, 'Le contenu doit contenir au moins 10 caractères'),
  content_type: z.enum(['text', 'markdown', 'html']),
  category: z.string().optional(),
  tags: z.array(z.string()),
  status: z.enum(['draft', 'published', 'archived', 'deleted', 'moderated']),
});

type PostFormData = z.infer<typeof postFormSchema>;

interface CommunityPostFormProps {
  post?: CommunityPost;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CommunityPostForm({ post, onSuccess, onCancel }: CommunityPostFormProps) {
  const createPost = useCreateCommunityPost();
  const updatePost = useUpdateCommunityPost();
  const [tagInput, setTagInput] = useState('');

  const form = useForm<PostFormData>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: post?.title || '',
      content: post?.content || '',
      content_type: post?.content_type || 'text',
      category: post?.category || '',
      tags: post?.tags || [],
      status: post?.status || 'published',
    },
  });

  const tags = form.watch('tags');

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      form.setValue('tags', [...tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    form.setValue('tags', tags.filter((tag) => tag !== tagToRemove));
  };

  const onSubmit = async (data: PostFormData) => {
    try {
      if (post) {
        await updatePost.mutateAsync({ postId: post.id, formData: data });
      } else {
        await createPost.mutateAsync(data);
      }
      form.reset();
      onSuccess?.();
    } catch (error) {
      // Error handled by hook
    }
  };

  const isPending = createPost.isPending || updatePost.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre (optionnel)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Titre de votre post..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contenu *</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Partagez vos pensées avec la communauté..."
                  rows={8}
                />
              </FormControl>
              <FormDescription>
                Minimum 10 caractères. Vous pouvez utiliser du texte simple, Markdown ou HTML.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="content_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de contenu</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="text">Texte simple</SelectItem>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catégorie</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: Discussion, Question, Annonce..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tags"
          render={() => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                      aria-label={`Supprimer le tag ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Ajouter un tag..."
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Ajouter
                </Button>
              </div>
              <FormDescription>
                Appuyez sur Entrée ou cliquez sur "Ajouter" pour ajouter un tag
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Envoi...' : post ? 'Mettre à jour' : 'Publier'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

