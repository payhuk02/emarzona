import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MobileFormField } from '@/components/ui/mobile-form-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, Eye, EyeOff, Mail, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { usePlatformLogo } from '@/hooks/usePlatformLogo';
import { SEOMeta } from '@/components/seo/SEOMeta';
import { logger } from '@/lib/logger';
import {
  getStoredReferralCode,
  clearStoredReferralCode,
} from '@/components/referral/ReferralTracker';
import { usePageCustomization } from '@/hooks/usePageCustomization';
import { useAdvancedLoyalty } from '@/hooks/useAdvancedLoyalty';

const Auth = () => {
  const { t } = useTranslation();
  const { getValue } = usePageCustomization('auth');
  const platformLogo = usePlatformLogo();
  const { triggerLoyaltyEvent } = useAdvancedLoyalty();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState({ login: false, signup: false });
  const [passwordStrength, setPasswordStrength] = useState<number>(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string>('');
  // États contrôlés pour les formulaires
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const loginFormRef = useRef<HTMLFormElement>(null);
  const signupFormRef = useRef<HTMLFormElement>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Check for password reset token in URL
  useEffect(() => {
    const handleHashChange = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      const accessToken = hashParams.get('access_token');

      if (type === 'recovery' && accessToken) {
        // User clicked on password reset link from email
        setShowForgotPassword(false);
        // The user will be redirected to a password update form
        // For now, we'll let Supabase handle the redirect
        // The user should already be authenticated with the recovery token
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Calculate password strength
  const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^a-zA-Z\d]/.test(password)) strength += 1;
    return Math.min(strength, 5);
  };

  const handlePasswordChange = (value: string, type: 'signup') => {
    if (type === 'signup') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResetError('');
    setIsResetLoading(true);

    if (!resetEmail || !resetEmail.includes('@')) {
      setResetError(
        t('auth.forgotPassword.errorInvalidEmail', 'Veuillez entrer une adresse email valide')
      );
      setIsResetLoading(false);
      return;
    }

    // Vérifier le rate limit pour la réinitialisation de mot de passe
    try {
      const { checkAuthRateLimit } = await import('@/lib/auth-rate-limiter');
      const rateLimitResult = await checkAuthRateLimit('password-reset', resetEmail);

      if (!rateLimitResult.allowed) {
        setResetError(
          rateLimitResult.message ||
            t(
              'auth.forgotPassword.rateLimitExceeded',
              'Trop de demandes de réinitialisation. Réessayez plus tard.'
            )
        );
        setIsResetLoading(false);
        toast({
          title: t('auth.forgotPassword.rateLimitTitle', 'Limite atteinte'),
          description: rateLimitResult.message || t('auth.forgotPassword.rateLimitExceeded'),
          variant: 'destructive',
        });
        return;
      }
    } catch (rateLimitError) {
      // En cas d'erreur du rate limiter, continuer (fail open)
      logger.warn('Rate limit check failed for password reset', { error: rateLimitError });
    }

    try {
      const redirectUrl = `${window.location.origin}/auth?type=reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: redirectUrl,
      });

      if (resetError) throw resetError;

      setResetSent(true);
      toast({
        title: t('auth.forgotPassword.successTitle', 'Email envoyé'),
        description: t(
          'auth.forgotPassword.successDescription',
          `Un email de réinitialisation a été envoyé à ${resetEmail}. Vérifiez votre boîte de réception.`
        ),
      });
    } catch (_error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Reset password error', {
        error: errorMessage,
        email: resetEmail,
      });
      setResetError(
        errorMessage ||
          t('auth.forgotPassword.error', "Une erreur est survenue lors de l'envoi de l'email")
      );
      toast({
        title: t('auth.forgotPassword.errorTitle', 'Erreur'),
        description: errorMessage || t('auth.forgotPassword.error', 'Une erreur est survenue'),
        variant: 'destructive',
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const email = signupEmail;
    const password = signupPassword;
    const name = signupName;

    // Validation
    if (!email || !password || !name) {
      setError(t('auth.signup.errorRequired'));
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t('auth.signup.errorPasswordLength'));
      setIsLoading(false);
      return;
    }

    // Vérifier le rate limit pour l'inscription
    try {
      const { checkAuthRateLimit } = await import('@/lib/auth-rate-limiter');
      const rateLimitResult = await checkAuthRateLimit('register', email);

      if (!rateLimitResult.allowed) {
        setError(
          rateLimitResult.message ||
            t(
              'auth.signup.rateLimitExceeded',
              "Trop de tentatives d'inscription. Réessayez plus tard."
            )
        );
        setIsLoading(false);
        toast({
          title: t('auth.signup.rateLimitTitle', 'Limite atteinte'),
          description: rateLimitResult.message || t('auth.signup.rateLimitExceeded'),
          variant: 'destructive',
        });
        return;
      }
    } catch (rateLimitError) {
      // En cas d'erreur du rate limiter, continuer (fail open)
      logger.warn('Rate limit check failed for signup', { error: rateLimitError });
    }

    const redirectUrl = `${window.location.origin}/dashboard`;

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: name,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // Traiter le code de parrainage si présent
        const referralCode = getStoredReferralCode();
        if (referralCode && data.user.id) {
          try {
            // Trouver le parrain via son code de parrainage
            const { data: referrerProfile } = await supabase
              .from('profiles')
              .select('user_id')
              .eq('referral_code', referralCode)
              .single();

            if (referrerProfile && referrerProfile.user_id !== data.user.id) {
              // Créer la relation de parrainage
              const { createReferralRelation } = await import('@/lib/referral-helpers');
              await createReferralRelation(referrerProfile.user_id, data.user.id, referralCode);

              // Déclencher l'événement de fidélisation pour le parrainage réussi
              try {
                // Points pour le parrain (celui qui a invité)
                const referrerReward = await triggerLoyaltyEvent('referral_success', {
                  referrerId: referrerProfile.user_id,
                  referredId: data.user.id,
                  referralCode,
                });

                // Points pour le parrainé (celui qui s'inscrit)
                const referredReward = await triggerLoyaltyEvent('signup_with_referral', {
                  referrerId: referrerProfile.user_id,
                  referredId: data.user.id,
                  referralCode,
                });

                logger.info('Referral loyalty events triggered', {
                  referrerId: referrerProfile.user_id,
                  referredId: data.user.id,
                  referrerReward,
                  referredReward,
                });
              } catch (loyaltyError) {
                logger.error('Failed to trigger referral loyalty events', { error: loyaltyError });
              }

              // Nettoyer le code stocké
              clearStoredReferralCode();

              logger.info('Referral relation created on signup', {
                referrerId: referrerProfile.user_id,
                referredId: data.user.id,
              });
            }
          } catch (_referralError: unknown) {
            // Ne pas bloquer l'inscription si l'erreur est sur le parrainage
            const referralErrorMessage =
              referralError instanceof Error ? referralError.message : String(referralError);
            logger.error('Error processing referral on signup', {
              error: referralErrorMessage,
              referralCode,
            });
          }
        }

        toast({
          title: t('auth.signup.success'),
          description: t('auth.signup.successDescription'),
        });
        navigate('/dashboard');
      }
    } catch (_error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Signup error', {
        error: errorMessage,
        email: signupEmail,
      });
      setError(errorMessage || t('auth.signup.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const email = loginEmail;
    const password = loginPassword;

    if (!email || !password) {
      setError(t('auth.login.errorRequired'));
      setIsLoading(false);
      return;
    }

    // Vérifier le rate limit pour la connexion
    try {
      const { checkAuthRateLimit } = await import('@/lib/auth-rate-limiter');
      const rateLimitResult = await checkAuthRateLimit('login', email);

      if (!rateLimitResult.allowed) {
        setError(
          rateLimitResult.message ||
            t(
              'auth.login.rateLimitExceeded',
              'Trop de tentatives de connexion. Réessayez dans quelques minutes.'
            )
        );
        setIsLoading(false);
        toast({
          title: t('auth.login.rateLimitTitle', 'Limite atteinte'),
          description: rateLimitResult.message || t('auth.login.rateLimitExceeded'),
          variant: 'destructive',
        });
        return;
      }
    } catch (rateLimitError) {
      // En cas d'erreur du rate limiter, continuer (fail open)
      logger.warn('Rate limit check failed for login', { error: rateLimitError });
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        toast({
          title: t('auth.login.success'),
          description: t('auth.login.successDescription'),
        });
        navigate('/dashboard');
      }
    } catch (_error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Login error', {
        error: errorMessage,
        email: loginEmail,
      });
      if (errorMessage.includes('Invalid login credentials')) {
        setError(t('auth.login.error'));
      } else {
        setError(errorMessage || t('auth.login.error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const baseUrl = window.location.origin;

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-3 sm:p-4 md:p-6 relative">
      {/* SEO Meta Tags */}
      <SEOMeta
        title={`${t('nav.login')} / ${t('nav.signup')} - Emarzona`}
        description={t('auth.welcomeSubtitle')}
        keywords="emarzona, connexion, inscription, authentification, compte utilisateur"
        url={`${baseUrl}/auth`}
        canonical={`${baseUrl}/auth`}
        type="website"
        locale="fr_FR"
        noindex={true}
      />

      {/* Language Switcher - Top Right */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50">
        <LanguageSwitcher variant="outline" showLabel={false} />
      </div>

      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6 sm:mb-8">
          <Link
            to="/"
            className="relative inline-flex items-center gap-2 mb-4 sm:mb-6"
            aria-label="Retour à l'accueil"
          >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 sm:relative sm:left-auto sm:top-auto sm:translate-y-0 sm:h-10 sm:w-10 z-0">
              {platformLogo ? (
                <img
                  src={platformLogo}
                  alt="Emarzona Logo"
                  width={40}
                  height={40}
                  className="h-full w-full opacity-60 sm:opacity-100 flex-shrink-0 object-contain"
                  loading="eager"
                />
              ) : (
                <div className="h-full w-full bg-primary rounded flex items-center justify-center opacity-60 sm:opacity-100 flex-shrink-0">
                  <span className="text-sm font-bold text-primary-foreground">E</span>
                </div>
              )}
            </div>
            <span className="relative z-10 pl-9 sm:pl-0 text-2xl sm:text-3xl font-bold">
              Emarzona
            </span>
          </Link>
        </div>

        <Card className="shadow-large" role="main" aria-labelledby="auth-title">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle id="auth-title" className="text-xl sm:text-2xl">
              {getValue('auth.welcome') || t('auth.welcome')}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {getValue('auth.welcomeSubtitle') || t('auth.welcomeSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="w-full overflow-x-auto flex-nowrap justify-start">
                <TabsTrigger value="login" className="min-h-[44px] shrink-0">
                  {getValue('auth.login.title') || t('nav.login')}
                </TabsTrigger>
                <TabsTrigger value="signup" className="min-h-[44px] shrink-0">
                  {getValue('auth.signup.title') || t('nav.signup')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form
                  ref={loginFormRef}
                  onSubmit={handleSignIn}
                  className="space-y-4"
                  aria-label={t('auth.login.formLabel')}
                  noValidate
                >
                  <MobileFormField
                    label={t('auth.login.email')}
                    name="email-login"
                    type="email"
                    value={loginEmail}
                    onChange={setLoginEmail}
                    required
                    error={error.includes('email') || error.includes('Email') ? error : undefined}
                    fieldProps={{
                      disabled: isLoading,
                      autoComplete: 'email',
                      placeholder: t('auth.login.emailPlaceholder'),
                    }}
                  />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password-login">{t('auth.login.password')}</Label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setResetSent(false);
                          setResetError('');
                          setResetEmail('');
                        }}
                        className="text-xs sm:text-sm text-primary hover:underline min-h-[44px] px-2 flex items-center touch-manipulation"
                        aria-label="Réinitialiser le mot de passe"
                      >
                        {t('auth.login.forgotPassword', 'Mot de passe oublié ?')}
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="password-login"
                        name="password-login"
                        type={showPassword.login ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder={t('auth.login.passwordPlaceholder')}
                        required
                        disabled={isLoading}
                        autoComplete="current-password"
                        aria-required="true"
                        aria-invalid={error.includes('password') || error.includes('mot de passe')}
                        className="pr-12 min-h-[44px] text-base"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword({ ...showPassword, login: !showPassword.login })
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                        aria-label={
                          showPassword.login
                            ? 'Masquer le mot de passe'
                            : 'Afficher le mot de passe'
                        }
                        tabIndex={-1}
                      >
                        {showPassword.login ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full gradient-primary min-h-[44px] text-base touch-manipulation"
                    disabled={isLoading}
                    aria-busy={isLoading}
                  >
                    {isLoading
                      ? t('auth.login.buttonLoading')
                      : getValue('auth.login.button') || t('auth.login.button')}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form
                  ref={signupFormRef}
                  onSubmit={handleSignUp}
                  className="space-y-4"
                  aria-label={t('auth.signup.formLabel')}
                  noValidate
                >
                  <MobileFormField
                    label={t('auth.signup.name')}
                    name="name"
                    type="text"
                    value={signupName}
                    onChange={setSignupName}
                    required
                    error={error.includes('name') || error.includes('nom') ? error : undefined}
                    fieldProps={{
                      disabled: isLoading,
                      autoComplete: 'name',
                      placeholder: t('auth.signup.namePlaceholder'),
                    }}
                  />
                  <MobileFormField
                    label={t('auth.signup.email')}
                    name="email-signup"
                    type="email"
                    value={signupEmail}
                    onChange={setSignupEmail}
                    required
                    error={error.includes('email') || error.includes('Email') ? error : undefined}
                    fieldProps={{
                      disabled: isLoading,
                      autoComplete: 'email',
                      placeholder: t('auth.signup.emailPlaceholder'),
                    }}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="password-signup">{t('auth.signup.password')}</Label>
                    <div className="relative">
                      <Input
                        id="password-signup"
                        name="password-signup"
                        type={showPassword.signup ? 'text' : 'password'}
                        value={signupPassword}
                        onChange={e => {
                          setSignupPassword(e.target.value);
                          handlePasswordChange(e.target.value, 'signup');
                        }}
                        placeholder={t('auth.signup.passwordPlaceholder')}
                        required
                        minLength={6}
                        disabled={isLoading}
                        autoComplete="new-password"
                        aria-required="true"
                        aria-invalid={error.includes('password') || error.includes('mot de passe')}
                        className="pr-12 min-h-[44px] text-base"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword({ ...showPassword, signup: !showPassword.signup })
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                        aria-label={
                          showPassword.signup
                            ? 'Masquer le mot de passe'
                            : 'Afficher le mot de passe'
                        }
                        tabIndex={-1}
                      >
                        {showPassword.signup ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {passwordStrength > 0 && (
                      <div className="space-y-1">
                        <div className="flex gap-1 h-1.5">
                          {[1, 2, 3, 4, 5].map(level => (
                            <div
                              key={level}
                              className={`flex-1 rounded-full transition-colors ${
                                level <= passwordStrength
                                  ? level <= 2
                                    ? 'bg-red-500'
                                    : level <= 4
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                  : 'bg-muted'
                              }`}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {passwordStrength <= 2 &&
                            t('auth.signup.passwordStrength.weak', 'Faible')}
                          {passwordStrength === 3 &&
                            t('auth.signup.passwordStrength.medium', 'Moyen')}
                          {passwordStrength === 4 && t('auth.signup.passwordStrength.good', 'Bon')}
                          {passwordStrength >= 5 &&
                            t('auth.signup.passwordStrength.strong', 'Fort')}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">{t('auth.signup.passwordHint')}</p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full gradient-primary min-h-[44px] text-base touch-manipulation"
                    disabled={isLoading}
                    aria-busy={isLoading}
                  >
                    {isLoading
                      ? t('auth.signup.buttonLoading')
                      : getValue('auth.signup.button') || t('auth.signup.button')}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-4 px-2">
          {t('auth.termsNote')}
        </p>
      </div>

      {/* Dialog Réinitialisation du mot de passe */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {t('auth.forgotPassword.title', 'Réinitialiser le mot de passe')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'auth.forgotPassword.description',
                'Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.'
              )}
            </DialogDescription>
          </DialogHeader>

          {resetSent ? (
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">
                    {t('auth.forgotPassword.successTitle', 'Email envoyé !')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      'auth.forgotPassword.successMessage',
                      `Nous avons envoyé un lien de réinitialisation à ${resetEmail}. Vérifiez votre boîte de réception et votre dossier spam.`
                    )}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSent(false);
                    setResetEmail('');
                  }}
                  className="w-full min-h-[44px] text-base touch-manipulation"
                >
                  {t('common.close', 'Fermer')}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4 py-4">
              {resetError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{resetError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="reset-email">
                  {t('auth.forgotPassword.emailLabel', 'Adresse email')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder={t('auth.forgotPassword.emailPlaceholder', 'votre@email.com')}
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    required
                    disabled={isResetLoading}
                    autoComplete="email"
                    className="pl-10 min-h-[44px] text-base"
                    aria-required="true"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  type="submit"
                  className="w-full min-h-[44px] text-base touch-manipulation"
                  disabled={isResetLoading || !resetEmail}
                  aria-busy={isResetLoading}
                >
                  {isResetLoading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      {t('auth.forgotPassword.sending', 'Envoi en cours...')}
                    </>
                  ) : (
                    t('auth.forgotPassword.sendButton', 'Envoyer le lien de réinitialisation')
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail('');
                    setResetError('');
                  }}
                  className="touch-manipulation min-h-[44px]"
                  disabled={isResetLoading}
                  className="min-h-[44px] text-base"
                >
                  {t('common.cancel', 'Annuler')}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
