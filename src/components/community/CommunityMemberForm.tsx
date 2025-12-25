/**
 * Formulaire d'inscription à la communauté
 * Date: 31 Janvier 2025
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ImageUpload } from '@/components/ui/image-upload';
import { useCreateCommunityMember } from '@/hooks/community/useCommunityMembers';
import { Upload, User, Mail, Phone, Briefcase, Globe, Linkedin, Twitter, Github } from 'lucide-react';
import { COUNTRIES } from '@/lib/countries';

const memberFormSchema = z.object({
  first_name: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  last_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  profession: z.string().optional(),
  company: z.string().optional(),
  bio: z.string().max(500, 'La bio ne doit pas dépasser 500 caractères').optional(),
  profile_image_url: z.string().optional(),
  country: z.string().min(1, 'Le pays est requis'),
  city: z.string().optional(),
  website: z.string().url('URL invalide').optional().or(z.literal('')),
  linkedin_url: z.string().url('URL LinkedIn invalide').optional().or(z.literal('')),
  twitter_url: z.string().url('URL Twitter invalide').optional().or(z.literal('')),
  github_url: z.string().url('URL GitHub invalide').optional().or(z.literal('')),
});

type MemberFormData = z.infer<typeof memberFormSchema>;

interface CommunityMemberFormProps {
  onSuccess?: () => void;
}

export function CommunityMemberForm({ onSuccess }: CommunityMemberFormProps) {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const createMember = useCreateCommunityMember();

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      profession: '',
      company: '',
      bio: '',
      profile_image_url: '',
      country: 'BF',
      city: '',
      website: '',
      linkedin_url: '',
      twitter_url: '',
      github_url: '',
    },
  });

  const onSubmit = async (data: MemberFormData) => {
    try {
      await createMember.mutateAsync({
        ...data,
        profile_image_url: profileImage || undefined,
        website: data.website || undefined,
        linkedin_url: data.linkedin_url || undefined,
        twitter_url: data.twitter_url || undefined,
        github_url: data.github_url || undefined,
      });
      form.reset();
      setProfileImage(null);
      onSuccess?.();
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informations personnelles */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations personnelles
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Jean" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Dupont" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="jean.dupont@example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone</FormLabel>
                  <FormControl>
                    <Input {...field} type="tel" placeholder="+226 XX XX XX XX" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Photo de profil */}
          <FormField
            control={form.control}
            name="profile_image_url"
            render={() => (
              <FormItem>
                <FormLabel>Photo de profil</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={profileImage || ''}
                    onChange={(url) => {
                      setProfileImage(url);
                      form.setValue('profile_image_url', url);
                    }}
                    folder="community/profiles"
                  />
                </FormControl>
                <FormDescription>
                  Téléchargez une photo de profil (recommandé: 400x400px)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Informations professionnelles */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Informations professionnelles
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="profession"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profession</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Développeur web" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entreprise</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nom de l'entreprise" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Biographie</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Parlez-nous de vous..."
                    rows={4}
                    maxLength={500}
                  />
                </FormControl>
                <FormDescription>
                  {field.value?.length || 0}/500 caractères
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Localisation */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Localisation
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pays *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un pays" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ville</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ouagadougou" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Réseaux sociaux */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Réseaux sociaux (optionnel)</h3>

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Site web</FormLabel>
                <FormControl>
                  <Input {...field} type="url" placeholder="https://example.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="linkedin_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type="url" placeholder="https://linkedin.com/in/..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="twitter_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type="url" placeholder="https://twitter.com/..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="github_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Github className="h-4 w-4" />
                    GitHub
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type="url" placeholder="https://github.com/..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={createMember.isPending}
        >
          {createMember.isPending ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Rejoindre la communauté
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}

