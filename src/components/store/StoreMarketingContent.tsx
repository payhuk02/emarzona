/**
 * StoreMarketingContent Component
 * Composant pour la gestion du contenu marketing de la boutique
 * Phase 2 - Fonctionnalités avancées
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Target, 
  Heart, 
  BookOpen, 
  Users, 
  Star, 
  Award,
  Plus,
  X,
  Trash2,
  Edit2,
} from 'lucide-react';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';
import { StoreMarketingContent } from '@/hooks/useStores';

interface StoreMarketingContentProps {
  marketingContent: StoreMarketingContent | null;
  onChange: (content: StoreMarketingContent) => void;
}

export const StoreMarketingContentComponent: React.FC<StoreMarketingContentProps> = ({
  marketingContent,
  onChange,
}) => {
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();
  
  const [welcomeMessage, setWelcomeMessage] = useState(marketingContent?.welcome_message || '');
  const [missionStatement, setMissionStatement] = useState(marketingContent?.mission_statement || '');
  const [visionStatement, setVisionStatement] = useState(marketingContent?.vision_statement || '');
  const [values, setValues] = useState<string[]>(marketingContent?.values || []);
  const [newValue, setNewValue] = useState('');
  const [story, setStory] = useState(marketingContent?.story || '');
  const [teamSection, setTeamSection] = useState(marketingContent?.team_section || []);
  const [testimonials, setTestimonials] = useState(marketingContent?.testimonials || []);
  const [certifications, setCertifications] = useState(marketingContent?.certifications || []);

  // État pour l'édition d'un membre d'équipe
  const [editingTeamMember, setEditingTeamMember] = useState<number | null>(null);
  const [teamMemberForm, setTeamMemberForm] = useState({
    name: '',
    role: '',
    bio: '',
    photo_url: '',
    social_links: {} as Record<string, string>,
  });

  // État pour l'édition d'un témoignage
  const [editingTestimonial, setEditingTestimonial] = useState<number | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({
    author: '',
    content: '',
    rating: 5,
    photo_url: '',
    company: '',
  });

  // État pour l'édition d'une certification
  const [editingCertification, setEditingCertification] = useState<number | null>(null);
  const [certificationForm, setCertificationForm] = useState({
    name: '',
    issuer: '',
    image_url: '',
    verification_url: '',
    expiry_date: '',
  });

  // Sauvegarder les changements
  const handleSave = () => {
    const updatedContent: StoreMarketingContent = {
      welcome_message: welcomeMessage || undefined,
      mission_statement: missionStatement || undefined,
      vision_statement: visionStatement || undefined,
      values: values.length > 0 ? values : undefined,
      story: story || undefined,
      team_section: teamSection.length > 0 ? teamSection : undefined,
      testimonials: testimonials.length > 0 ? testimonials : undefined,
      certifications: certifications.length > 0 ? certifications : undefined,
    };
    onChange(updatedContent);
  };

  // Gestion des valeurs
  const handleAddValue = () => {
    if (newValue.trim()) {
      setValues([...values, newValue.trim()]);
      setNewValue('');
    }
  };

  const handleRemoveValue = (index: number) => {
    setValues(values.filter((_, i) => i !== index));
  };

  // Gestion de l'équipe
  const handleAddTeamMember = () => {
    if (teamMemberForm.name && teamMemberForm.role) {
      if (editingTeamMember !== null) {
        const updated = [...teamSection];
        updated[editingTeamMember] = { ...teamMemberForm };
        setTeamSection(updated);
        setEditingTeamMember(null);
      } else {
        setTeamSection([...teamSection, { ...teamMemberForm }]);
      }
      setTeamMemberForm({ name: '', role: '', bio: '', photo_url: '', social_links: {} });
    }
  };

  const handleEditTeamMember = (index: number) => {
    const member = teamSection[index];
    setTeamMemberForm({
      name: member.name,
      role: member.role,
      bio: member.bio,
      photo_url: member.photo_url,
      social_links: member.social_links || {},
    });
    setEditingTeamMember(index);
  };

  const handleDeleteTeamMember = (index: number) => {
    setTeamSection(teamSection.filter((_, i) => i !== index));
  };

  // Gestion des témoignages
  const handleAddTestimonial = () => {
    if (testimonialForm.author && testimonialForm.content) {
      if (editingTestimonial !== null) {
        const updated = [...testimonials];
        updated[editingTestimonial] = { ...testimonialForm };
        setTestimonials(updated);
        setEditingTestimonial(null);
      } else {
        setTestimonials([...testimonials, { ...testimonialForm }]);
      }
      setTestimonialForm({ author: '', content: '', rating: 5, photo_url: '', company: '' });
    }
  };

  const handleEditTestimonial = (index: number) => {
    const testimonial = testimonials[index];
    setTestimonialForm({
      author: testimonial.author,
      content: testimonial.content,
      rating: testimonial.rating,
      photo_url: testimonial.photo_url || '',
      company: testimonial.company || '',
    });
    setEditingTestimonial(index);
  };

  const handleDeleteTestimonial = (index: number) => {
    setTestimonials(testimonials.filter((_, i) => i !== index));
  };

  // Gestion des certifications
  const handleAddCertification = () => {
    if (certificationForm.name && certificationForm.issuer) {
      if (editingCertification !== null) {
        const updated = [...certifications];
        updated[editingCertification] = { ...certificationForm };
        setCertifications(updated);
        setEditingCertification(null);
      } else {
        setCertifications([...certifications, { ...certificationForm }]);
      }
      setCertificationForm({ name: '', issuer: '', image_url: '', verification_url: '', expiry_date: '' });
    }
  };

  const handleEditCertification = (index: number) => {
    const cert = certifications[index];
    setCertificationForm({
      name: cert.name,
      issuer: cert.issuer,
      image_url: cert.image_url,
      verification_url: cert.verification_url,
      expiry_date: cert.expiry_date || '',
    });
    setEditingCertification(index);
  };

  const handleDeleteCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  // Sauvegarder automatiquement à chaque changement
  React.useEffect(() => {
    handleSave();
  }, [welcomeMessage, missionStatement, visionStatement, values, story, teamSection, testimonials, certifications]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Contenu marketing
        </CardTitle>
        <CardDescription>
          Personnalisez le contenu marketing de votre boutique (message de bienvenue, mission, vision, équipe, témoignages, certifications)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="welcome" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1 sm:gap-2">
            <TabsTrigger value="welcome" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Bienvenue</span>
              <span className="sm:hidden">Accueil</span>
            </TabsTrigger>
            <TabsTrigger value="mission" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Target className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Mission</span>
              <span className="sm:hidden">Mission</span>
            </TabsTrigger>
            <TabsTrigger value="values" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Valeurs</span>
              <span className="sm:hidden">Valeurs</span>
            </TabsTrigger>
            <TabsTrigger value="story" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Histoire</span>
              <span className="sm:hidden">Histoire</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Équipe</span>
              <span className="sm:hidden">Équipe</span>
            </TabsTrigger>
            <TabsTrigger value="testimonials" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Star className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Témoignages</span>
              <span className="sm:hidden">Avis</span>
            </TabsTrigger>
            <TabsTrigger value="certifications" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Award className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Certifications</span>
              <span className="sm:hidden">Certifs</span>
            </TabsTrigger>
          </TabsList>

          {/* Message de bienvenue */}
          <TabsContent value="welcome" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="welcome_message">Message de bienvenue</Label>
              <Textarea
                id="welcome_message"
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                onKeyDown={handleSpaceKeyDown}
                placeholder="Bienvenue dans notre boutique ! Découvrez nos produits de qualité..."
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                Message qui s'affichera en haut de la page d'accueil de votre boutique
              </p>
            </div>
          </TabsContent>

          {/* Mission */}
          <TabsContent value="mission" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mission_statement">Mission</Label>
                <Textarea
                  id="mission_statement"
                  value={missionStatement}
                  onChange={(e) => setMissionStatement(e.target.value)}
                  onKeyDown={handleSpaceKeyDown}
                  placeholder="Notre mission est de fournir des produits de qualité exceptionnelle..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Déclaration de mission de votre boutique
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vision_statement">Vision</Label>
                <Textarea
                  id="vision_statement"
                  value={visionStatement}
                  onChange={(e) => setVisionStatement(e.target.value)}
                  onKeyDown={handleSpaceKeyDown}
                  placeholder="Notre vision est de devenir le leader dans notre secteur..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Vision à long terme de votre boutique
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Valeurs */}
          <TabsContent value="values" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Valeurs de votre boutique</Label>
              <div className="flex gap-2">
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddValue();
                    }
                    handleSpaceKeyDown(e);
                  }}
                  placeholder="Ex: Qualité, Innovation, Service client..."
                />
                <Button onClick={handleAddValue} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Ajoutez les valeurs importantes de votre boutique
              </p>
            </div>

            {values.length > 0 && (
              <div className="space-y-2">
                <Label>Valeurs ajoutées</Label>
                <div className="flex flex-wrap gap-2">
                  {values.map((value, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {value}
                      <button
                        onClick={() => handleRemoveValue(index)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        aria-label={`Supprimer ${value}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Histoire */}
          <TabsContent value="story" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="story">Histoire de votre boutique</Label>
              <Textarea
                id="story"
                value={story}
                onChange={(e) => setStory(e.target.value)}
                onKeyDown={handleSpaceKeyDown}
                placeholder="Racontez l'histoire de votre boutique, comment elle a été créée, vos défis, vos succès..."
                rows={10}
              />
              <p className="text-xs text-muted-foreground">
                Histoire complète de votre boutique (support Markdown)
              </p>
            </div>
          </TabsContent>

          {/* Équipe */}
          <TabsContent value="team" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Membres de l'équipe</Label>
                <Button
                  onClick={() => {
                    setTeamMemberForm({ name: '', role: '', bio: '', photo_url: '', social_links: {} });
                    setEditingTeamMember(null);
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>

              {/* Formulaire membre d'équipe */}
              <Card className="border-dashed">
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="team_name">Nom *</Label>
                      <Input
                        id="team_name"
                        value={teamMemberForm.name}
                        onChange={(e) => setTeamMemberForm({ ...teamMemberForm, name: e.target.value })}
                        placeholder="Jean Dupont"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="team_role">Rôle *</Label>
                      <Input
                        id="team_role"
                        value={teamMemberForm.role}
                        onChange={(e) => setTeamMemberForm({ ...teamMemberForm, role: e.target.value })}
                        placeholder="Directeur Général"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team_bio">Biographie</Label>
                    <Textarea
                      id="team_bio"
                      value={teamMemberForm.bio}
                      onChange={(e) => setTeamMemberForm({ ...teamMemberForm, bio: e.target.value })}
                      onKeyDown={handleSpaceKeyDown}
                      placeholder="Description du membre de l'équipe..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team_photo">Photo (URL)</Label>
                    <Input
                      id="team_photo"
                      value={teamMemberForm.photo_url}
                      onChange={(e) => setTeamMemberForm({ ...teamMemberForm, photo_url: e.target.value })}
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>
                  <Button
                    onClick={handleAddTeamMember}
                    disabled={!teamMemberForm.name || !teamMemberForm.role}
                    className="w-full"
                  >
                    {editingTeamMember !== null ? 'Modifier' : 'Ajouter'} le membre
                  </Button>
                </CardContent>
              </Card>

              {/* Liste des membres */}
              {teamSection.length > 0 && (
                <div className="space-y-3">
                  {teamSection.map((member, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          {member.photo_url && (
                            <img
                              src={member.photo_url}
                              alt={member.name}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold">{member.name}</h4>
                            <p className="text-sm text-muted-foreground">{member.role}</p>
                            {member.bio && <p className="text-sm mt-2">{member.bio}</p>}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTeamMember(index)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTeamMember(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Témoignages */}
          <TabsContent value="testimonials" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Témoignages clients</Label>
                <Button
                  onClick={() => {
                    setTestimonialForm({ author: '', content: '', rating: 5, photo_url: '', company: '' });
                    setEditingTestimonial(null);
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>

              {/* Formulaire témoignage */}
              <Card className="border-dashed">
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="testimonial_author">Auteur *</Label>
                      <Input
                        id="testimonial_author"
                        value={testimonialForm.author}
                        onChange={(e) => setTestimonialForm({ ...testimonialForm, author: e.target.value })}
                        placeholder="Jean Dupont"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="testimonial_company">Entreprise</Label>
                      <Input
                        id="testimonial_company"
                        value={testimonialForm.company}
                        onChange={(e) => setTestimonialForm({ ...testimonialForm, company: e.target.value })}
                        placeholder="Entreprise XYZ"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="testimonial_content">Témoignage *</Label>
                    <Textarea
                      id="testimonial_content"
                      value={testimonialForm.content}
                      onChange={(e) => setTestimonialForm({ ...testimonialForm, content: e.target.value })}
                      onKeyDown={handleSpaceKeyDown}
                      placeholder="Excellent service, produits de qualité..."
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="testimonial_rating">Note (1-5)</Label>
                      <Input
                        id="testimonial_rating"
                        type="number"
                        min="1"
                        max="5"
                        value={testimonialForm.rating}
                        onChange={(e) => setTestimonialForm({ ...testimonialForm, rating: parseInt(e.target.value) || 5 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="testimonial_photo">Photo (URL)</Label>
                      <Input
                        id="testimonial_photo"
                        value={testimonialForm.photo_url}
                        onChange={(e) => setTestimonialForm({ ...testimonialForm, photo_url: e.target.value })}
                        placeholder="https://example.com/photo.jpg"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddTestimonial}
                    disabled={!testimonialForm.author || !testimonialForm.content}
                    className="w-full"
                  >
                    {editingTestimonial !== null ? 'Modifier' : 'Ajouter'} le témoignage
                  </Button>
                </CardContent>
              </Card>

              {/* Liste des témoignages */}
              {testimonials.length > 0 && (
                <div className="space-y-3">
                  {testimonials.map((testimonial, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          {testimonial.photo_url && (
                            <img
                              src={testimonial.photo_url}
                              alt={testimonial.author}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{testimonial.author}</h4>
                              {testimonial.company && (
                                <span className="text-sm text-muted-foreground">- {testimonial.company}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= testimonial.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-sm">{testimonial.content}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTestimonial(index)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTestimonial(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Certifications */}
          <TabsContent value="certifications" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Certifications</Label>
                <Button
                  onClick={() => {
                    setCertificationForm({ name: '', issuer: '', image_url: '', verification_url: '', expiry_date: '' });
                    setEditingCertification(null);
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>

              {/* Formulaire certification */}
              <Card className="border-dashed">
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cert_name">Nom de la certification *</Label>
                      <Input
                        id="cert_name"
                        value={certificationForm.name}
                        onChange={(e) => setCertificationForm({ ...certificationForm, name: e.target.value })}
                        placeholder="ISO 9001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cert_issuer">Émetteur *</Label>
                      <Input
                        id="cert_issuer"
                        value={certificationForm.issuer}
                        onChange={(e) => setCertificationForm({ ...certificationForm, issuer: e.target.value })}
                        placeholder="Organisme de certification"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cert_image">Image (URL)</Label>
                      <Input
                        id="cert_image"
                        value={certificationForm.image_url}
                        onChange={(e) => setCertificationForm({ ...certificationForm, image_url: e.target.value })}
                        placeholder="https://example.com/cert.jpg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cert_verification">URL de vérification</Label>
                      <Input
                        id="cert_verification"
                        value={certificationForm.verification_url}
                        onChange={(e) => setCertificationForm({ ...certificationForm, verification_url: e.target.value })}
                        placeholder="https://example.com/verify"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cert_expiry">Date d'expiration</Label>
                    <Input
                      id="cert_expiry"
                      type="date"
                      value={certificationForm.expiry_date}
                      onChange={(e) => setCertificationForm({ ...certificationForm, expiry_date: e.target.value })}
                    />
                  </div>
                  <Button
                    onClick={handleAddCertification}
                    disabled={!certificationForm.name || !certificationForm.issuer}
                    className="w-full"
                  >
                    {editingCertification !== null ? 'Modifier' : 'Ajouter'} la certification
                  </Button>
                </CardContent>
              </Card>

              {/* Liste des certifications */}
              {certifications.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {certifications.map((cert, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          {cert.image_url && (
                            <img
                              src={cert.image_url}
                              alt={cert.name}
                              className="w-full h-32 object-contain rounded-lg"
                            />
                          )}
                          <div>
                            <h4 className="font-semibold">{cert.name}</h4>
                            <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                            {cert.expiry_date && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Expire le: {new Date(cert.expiry_date).toLocaleDateString('fr-FR')}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {cert.verification_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(cert.verification_url, '_blank')}
                                className="flex-1"
                              >
                                Vérifier
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCertification(index)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCertification(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

