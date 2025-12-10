/**
 * StoreMarketingSections Component
 * Affiche les sections marketing dans le storefront public
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Target, 
  Heart, 
  BookOpen, 
  Users, 
  Star, 
  Award,
  CheckCircle
} from 'lucide-react';
import type { StoreMarketingContent } from '@/hooks/useStores';
import { useStoreTheme } from '@/hooks/useStoreTheme';
import type { Store } from '@/hooks/useStores';

interface StoreMarketingSectionsProps {
  marketingContent: StoreMarketingContent | null;
  store: Store | null;
}

export const StoreMarketingSections: React.FC<StoreMarketingSectionsProps> = ({
  marketingContent,
  store,
}) => {
  const theme = useStoreTheme(store);

  if (!marketingContent) {
    return null;
  }

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Message de bienvenue */}
      {marketingContent.welcome_message && (
        <section className="animate-fade-in">
          <Card className="border-2 border-dashed" style={{ borderColor: theme.primaryColor + '40' }}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div 
                  className="p-2 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: theme.primaryColor + '15' }}
                >
                  <MessageSquare 
                    className="h-5 w-5" 
                    style={{ color: theme.primaryColor }}
                  />
                </div>
                <div className="flex-1">
                  <p 
                    className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap"
                    style={{ 
                      color: theme.textColor,
                      fontFamily: theme.bodyFont,
                    }}
                  >
                    {marketingContent.welcome_message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Mission et Vision */}
      {(marketingContent.mission_statement || marketingContent.vision_statement) && (
        <section className="animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {marketingContent.mission_statement && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div 
                      className="p-2 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: theme.primaryColor + '15' }}
                    >
                      <Target 
                        className="h-5 w-5" 
                        style={{ color: theme.primaryColor }}
                      />
                    </div>
                    <h3 
                      className="text-lg sm:text-xl font-bold"
                      style={{ 
                        color: theme.textColor,
                        fontFamily: theme.headingFont,
                      }}
                    >
                      Notre Mission
                    </h3>
                  </div>
                  <p 
                    className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap"
                    style={{ 
                      color: theme.textSecondaryColor,
                      fontFamily: theme.bodyFont,
                    }}
                  >
                    {marketingContent.mission_statement}
                  </p>
                </CardContent>
              </Card>
            )}

            {marketingContent.vision_statement && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div 
                      className="p-2 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: theme.secondaryColor + '15' }}
                    >
                      <Target 
                        className="h-5 w-5" 
                        style={{ color: theme.secondaryColor }}
                      />
                    </div>
                    <h3 
                      className="text-lg sm:text-xl font-bold"
                      style={{ 
                        color: theme.textColor,
                        fontFamily: theme.headingFont,
                      }}
                    >
                      Notre Vision
                    </h3>
                  </div>
                  <p 
                    className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap"
                    style={{ 
                      color: theme.textSecondaryColor,
                      fontFamily: theme.bodyFont,
                    }}
                  >
                    {marketingContent.vision_statement}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Valeurs */}
      {marketingContent.values && marketingContent.values.length > 0 && (
        <section className="animate-fade-in">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: theme.accentColor + '15' }}
                >
                  <Heart 
                    className="h-5 w-5" 
                    style={{ color: theme.accentColor }}
                  />
                </div>
                <h3 
                  className="text-lg sm:text-xl font-bold"
                  style={{ 
                    color: theme.textColor,
                    fontFamily: theme.headingFont,
                  }}
                >
                  Nos Valeurs
                </h3>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {marketingContent.values.map((value, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-sm sm:text-base px-3 py-1.5"
                    style={{
                      backgroundColor: theme.primaryColor + '15',
                      color: theme.primaryColor,
                      borderColor: theme.primaryColor + '30',
                    }}
                  >
                    <Heart className="h-3 w-3 mr-1.5 inline" />
                    {value}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Histoire */}
      {marketingContent.story && (
        <section className="animate-fade-in">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: theme.secondaryColor + '15' }}
                >
                  <BookOpen 
                    className="h-5 w-5" 
                    style={{ color: theme.secondaryColor }}
                  />
                </div>
                <h3 
                  className="text-lg sm:text-xl font-bold"
                  style={{ 
                    color: theme.textColor,
                    fontFamily: theme.headingFont,
                  }}
                >
                  Notre Histoire
                </h3>
              </div>
              <div 
                className="prose prose-sm sm:prose max-w-none"
                style={{ 
                  color: theme.textColor,
                  fontFamily: theme.bodyFont,
                }}
              >
                <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                  {marketingContent.story}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Équipe */}
      {marketingContent.team_section && marketingContent.team_section.length > 0 && (
        <section className="animate-fade-in">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: theme.primaryColor + '15' }}
              >
                <Users 
                  className="h-5 w-5" 
                  style={{ color: theme.primaryColor }}
                />
              </div>
              <h3 
                className="text-lg sm:text-xl font-bold"
                style={{ 
                  color: theme.textColor,
                  fontFamily: theme.headingFont,
                }}
              >
                Notre Équipe
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {marketingContent.team_section.map((member, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-center">
                    {member.photo_url ? (
                      <img
                        src={member.photo_url}
                        alt={member.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover mx-auto mb-4 border-4"
                        style={{ borderColor: theme.primaryColor + '30' }}
                      />
                    ) : (
                      <div 
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
                        style={{ backgroundColor: theme.primaryColor + '15' }}
                      >
                        <Users 
                          className="h-10 w-10 sm:h-12 sm:w-12"
                          style={{ color: theme.primaryColor }}
                        />
                      </div>
                    )}
                    <h4 
                      className="font-semibold text-base sm:text-lg mb-1"
                      style={{ 
                        color: theme.textColor,
                        fontFamily: theme.headingFont,
                      }}
                    >
                      {member.name}
                    </h4>
                    <p 
                      className="text-sm sm:text-base mb-3"
                      style={{ 
                        color: theme.primaryColor,
                        fontFamily: theme.bodyFont,
                      }}
                    >
                      {member.role}
                    </p>
                    {member.bio && (
                      <p 
                        className="text-xs sm:text-sm leading-relaxed"
                        style={{ 
                          color: theme.textSecondaryColor,
                          fontFamily: theme.bodyFont,
                        }}
                      >
                        {member.bio}
                      </p>
                    )}
                    {member.social_links && Object.keys(member.social_links).length > 0 && (
                      <div className="flex justify-center gap-2 mt-4">
                        {Object.entries(member.social_links).map(([platform, url]) => (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full hover:opacity-80 transition-opacity"
                            style={{
                              backgroundColor: theme.buttonSecondaryColor,
                              color: theme.buttonSecondaryText,
                            }}
                            aria-label={`${platform} de ${member.name}`}
                          >
                            <span className="text-xs">{platform}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Témoignages */}
      {marketingContent.testimonials && marketingContent.testimonials.length > 0 && (
        <section className="animate-fade-in">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: theme.accentColor + '15' }}
              >
                <Star 
                  className="h-5 w-5" 
                  style={{ color: theme.accentColor }}
                />
              </div>
              <h3 
                className="text-lg sm:text-xl font-bold"
                style={{ 
                  color: theme.textColor,
                  fontFamily: theme.headingFont,
                }}
              >
                Témoignages Clients
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {marketingContent.testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {testimonial.photo_url ? (
                      <img
                        src={testimonial.photo_url}
                        alt={testimonial.author}
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: theme.primaryColor + '15' }}
                      >
                        <Users 
                          className="h-8 w-8"
                          style={{ color: theme.primaryColor }}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 
                          className="font-semibold text-sm sm:text-base"
                          style={{ 
                            color: theme.textColor,
                            fontFamily: theme.headingFont,
                          }}
                        >
                          {testimonial.author}
                        </h4>
                        {testimonial.company && (
                          <span 
                            className="text-xs sm:text-sm"
                            style={{ color: theme.textSecondaryColor }}
                          >
                            - {testimonial.company}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mb-3">
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
                      <p 
                        className="text-xs sm:text-sm leading-relaxed italic"
                        style={{ 
                          color: theme.textSecondaryColor,
                          fontFamily: theme.bodyFont,
                        }}
                      >
                        "{testimonial.content}"
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {marketingContent.certifications && marketingContent.certifications.length > 0 && (
        <section className="animate-fade-in">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: theme.secondaryColor + '15' }}
              >
                <Award 
                  className="h-5 w-5" 
                  style={{ color: theme.secondaryColor }}
                />
              </div>
              <h3 
                className="text-lg sm:text-xl font-bold"
                style={{ 
                  color: theme.textColor,
                  fontFamily: theme.headingFont,
                }}
              >
                Certifications & Accréditations
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {marketingContent.certifications.map((cert, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="text-center">
                    {cert.image_url ? (
                      <img
                        src={cert.image_url}
                        alt={cert.name}
                        className="w-full h-32 sm:h-40 object-contain rounded-lg mb-4"
                      />
                    ) : (
                      <div 
                        className="w-full h-32 sm:h-40 rounded-lg mb-4 flex items-center justify-center"
                        style={{ backgroundColor: theme.secondaryColor + '15' }}
                      >
                        <Award 
                          className="h-12 w-12 sm:h-16 sm:w-16"
                          style={{ color: theme.secondaryColor }}
                        />
                      </div>
                    )}
                    <h4 
                      className="font-semibold text-sm sm:text-base mb-1"
                      style={{ 
                        color: theme.textColor,
                        fontFamily: theme.headingFont,
                      }}
                    >
                      {cert.name}
                    </h4>
                    <p 
                      className="text-xs sm:text-sm mb-2"
                      style={{ 
                        color: theme.textSecondaryColor,
                        fontFamily: theme.bodyFont,
                      }}
                    >
                      {cert.issuer}
                    </p>
                    {cert.expiry_date && (
                      <p 
                        className="text-xs mb-3"
                        style={{ color: theme.textSecondaryColor }}
                      >
                        Expire le: {new Date(cert.expiry_date).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    {cert.verification_url && (
                      <a
                        href={cert.verification_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs sm:text-sm px-3 py-1.5 rounded-md hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: theme.buttonPrimaryColor,
                          color: theme.buttonPrimaryText,
                        }}
                      >
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        Vérifier
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

