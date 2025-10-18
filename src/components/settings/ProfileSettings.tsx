import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Loader2, Upload, X } from "lucide-react";

export const ProfileSettings = () => {
  const { user } = useAuth();
  const { profile, uploading, uploadAvatar, removeAvatar, updateProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
    }
  }, [profile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await removeAvatar();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        display_name: displayName,
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (displayName) {
      return displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
      {/* Avatar Section */}
      <div className="flex flex-col items-center space-y-4 sm:flex-row sm:items-start sm:space-y-0 sm:space-x-6">
        <div className="relative group">
          <Avatar className="h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 ring-4 ring-background shadow-lg">
            <AvatarImage src={profile?.avatar_url || undefined} alt={displayName || "Avatar"} />
            <AvatarFallback className="text-2xl sm:text-3xl lg:text-4xl font-semibold bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          
          {profile?.avatar_url && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              disabled={uploading}
              className="absolute -top-2 -right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-lg hover:bg-destructive/90 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
              aria-label="Supprimer la photo"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex-1 space-y-3 text-center sm:text-left w-full sm:w-auto">
          <div>
            <h3 className="text-lg font-semibold">Photo de profil</h3>
            <p className="text-sm text-muted-foreground mt-1">
              JPG, PNG ou WEBP. Maximum 5 Mo.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAvatarClick}
              disabled={uploading}
              className="w-full sm:w-auto"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Téléchargement...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {profile?.avatar_url ? 'Changer' : 'Télécharger'}
                </>
              )}
            </Button>

            {profile?.avatar_url && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveAvatar}
                disabled={uploading}
                className="w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Supprimer
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* First Name & Last Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom</Label>
          <Input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Votre prénom"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Nom</Label>
          <Input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Votre nom"
          />
        </div>
      </div>

      {/* Display Name */}
      <div className="space-y-2">
        <Label htmlFor="displayName">Nom d'affichage</Label>
        <Input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Votre nom d'affichage"
          className="max-w-full sm:max-w-md"
        />
        <p className="text-sm text-muted-foreground">
          Ce nom sera visible publiquement sur votre profil
        </p>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled
          className="max-w-full sm:max-w-md"
        />
        <p className="text-sm text-muted-foreground">
          Votre adresse email ne peut pas être modifiée
        </p>
      </div>

      {/* User ID */}
      <div className="space-y-2">
        <Label htmlFor="userId">ID Utilisateur</Label>
        <Input
          id="userId"
          value={user?.id || ""}
          disabled
          className="max-w-full sm:max-w-md font-mono text-xs sm:text-sm"
        />
        <p className="text-sm text-muted-foreground">
          Votre identifiant unique
        </p>
      </div>

      <Button 
        type="submit" 
        disabled={loading || uploading}
        className="w-full sm:w-auto"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Enregistrer les modifications
      </Button>
    </form>
  );
};
