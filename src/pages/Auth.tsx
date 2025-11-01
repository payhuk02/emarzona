import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Eye, EyeOff, Mail, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import payhukLogo from "@/assets/payhuk-logo.png";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { SEOMeta } from "@/components/seo/SEOMeta";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { logger } from "@/lib/logger";

const Auth = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState({ login: false, signup: false });
  const [passwordStrength, setPasswordStrength] = useState<number>(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string>("");
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
    setResetError("");
    setIsResetLoading(true);

    if (!resetEmail || !resetEmail.includes('@')) {
      setResetError(t('auth.forgotPassword.errorInvalidEmail', 'Veuillez entrer une adresse email valide'));
      setIsResetLoading(false);
      return;
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
        description: t('auth.forgotPassword.successDescription', `Un email de réinitialisation a été envoyé à ${resetEmail}. Vérifiez votre boîte de réception.`),
      });
    } catch (error: any) {
      logger.error('Reset password error', {
        error: error.message,
        email: resetEmail,
      });
      setResetError(error.message || t('auth.forgotPassword.error', 'Une erreur est survenue lors de l\'envoi de l\'email'));
      toast({
        title: t('auth.forgotPassword.errorTitle', 'Erreur'),
        description: error.message || t('auth.forgotPassword.error', 'Une erreur est survenue'),
        variant: 'destructive',
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email-signup') as string;
    const password = formData.get('password-signup') as string;
    const name = formData.get('name') as string;

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

    const redirectUrl = `${window.location.origin}/dashboard`;

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: name
          }
        }
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        toast({
          title: t('auth.signup.success'),
          description: t('auth.signup.successDescription'),
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      logger.error('Signup error', {
        error: error.message,
        email: formData.email,
      });
      setError(error.message || t('auth.signup.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email-login') as string;
    const password = formData.get('password-login') as string;

    if (!email || !password) {
      setError(t('auth.login.errorRequired'));
      setIsLoading(false);
      return;
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
        navigate("/dashboard");
      }
    } catch (error: any) {
      logger.error('Login error', {
        error: error.message,
        email: formData.email,
      });
      if (error.message.includes('Invalid login credentials')) {
        setError(t('auth.login.error'));
      } else {
        setError(error.message || t('auth.login.error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const baseUrl = window.location.origin;

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 relative">
      {/* SEO Meta Tags */}
      <SEOMeta
        title={`${t('nav.login')} / ${t('nav.signup')} - Payhuk`}
        description={t('auth.welcomeSubtitle')}
        keywords="payhuk, connexion, inscription, authentification, compte utilisateur"
        url={`${baseUrl}/auth`}
        canonical={`${baseUrl}/auth`}
        type="website"
        locale="fr_FR"
        noindex={true}
      />

      {/* Language Switcher - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher variant="outline" showLabel={false} />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6" aria-label="Retour à l'accueil">
            <OptimizedImage
              src={payhukLogo}
              alt="Payhuk Logo"
              width={40}
              height={40}
              className="h-10 w-10"
              priority
            />
            <span className="text-3xl font-bold">
              Payhuk
            </span>
          </Link>
        </div>

        <Card className="shadow-large" role="main" aria-labelledby="auth-title">
          <CardHeader>
            <CardTitle id="auth-title">{t('auth.welcome')}</CardTitle>
            <CardDescription>
              {t('auth.welcomeSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t('nav.login')}</TabsTrigger>
                <TabsTrigger value="signup">{t('nav.signup')}</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form 
                  ref={loginFormRef}
                  onSubmit={handleSignIn} 
                  className="space-y-4"
                  aria-label={t('auth.login.formLabel')}
                  noValidate
                >
                  <div className="space-y-2">
                    <Label htmlFor="email-login">{t('auth.login.email')}</Label>
                    <Input
                      id="email-login"
                      name="email-login"
                      type="email"
                      placeholder={t('auth.login.emailPlaceholder')}
                      required
                      disabled={isLoading}
                      autoComplete="email"
                      aria-required="true"
                      aria-invalid={error.includes('email') || error.includes('Email')}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password-login">{t('auth.login.password')}</Label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setResetSent(false);
                          setResetError("");
                          setResetEmail("");
                        }}
                        className="text-xs text-primary hover:underline"
                        aria-label="Réinitialiser le mot de passe"
                      >
                        {t('auth.login.forgotPassword', 'Mot de passe oublié ?')}
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="password-login"
                        name="password-login"
                        type={showPassword.login ? "text" : "password"}
                        placeholder={t('auth.login.passwordPlaceholder')}
                        required
                        disabled={isLoading}
                        autoComplete="current-password"
                        aria-required="true"
                        aria-invalid={error.includes('password') || error.includes('mot de passe')}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({ ...showPassword, login: !showPassword.login })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword.login ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                        tabIndex={-1}
                      >
                        {showPassword.login ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full gradient-primary"
                    disabled={isLoading}
                    aria-busy={isLoading}
                  >
                    {isLoading ? t('auth.login.buttonLoading') : t('auth.login.button')}
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
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('auth.signup.name')}</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder={t('auth.signup.namePlaceholder')}
                      required
                      disabled={isLoading}
                      autoComplete="name"
                      aria-required="true"
                      aria-invalid={error.includes('name') || error.includes('nom')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-signup">{t('auth.signup.email')}</Label>
                    <Input
                      id="email-signup"
                      name="email-signup"
                      type="email"
                      placeholder={t('auth.signup.emailPlaceholder')}
                      required
                      disabled={isLoading}
                      autoComplete="email"
                      aria-required="true"
                      aria-invalid={error.includes('email') || error.includes('Email')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup">{t('auth.signup.password')}</Label>
                    <div className="relative">
                      <Input
                        id="password-signup"
                        name="password-signup"
                        type={showPassword.signup ? "text" : "password"}
                        placeholder={t('auth.signup.passwordPlaceholder')}
                        required
                        minLength={6}
                        disabled={isLoading}
                        autoComplete="new-password"
                        aria-required="true"
                        aria-invalid={error.includes('password') || error.includes('mot de passe')}
                        className="pr-10"
                        onChange={(e) => handlePasswordChange(e.target.value, 'signup')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({ ...showPassword, signup: !showPassword.signup })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword.signup ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                        tabIndex={-1}
                      >
                        {showPassword.signup ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordStrength > 0 && (
                      <div className="space-y-1">
                        <div className="flex gap-1 h-1.5">
                          {[1, 2, 3, 4, 5].map((level) => (
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
                          {passwordStrength <= 2 && t('auth.signup.passwordStrength.weak', 'Faible')}
                          {passwordStrength === 3 && t('auth.signup.passwordStrength.medium', 'Moyen')}
                          {passwordStrength === 4 && t('auth.signup.passwordStrength.good', 'Bon')}
                          {passwordStrength >= 5 && t('auth.signup.passwordStrength.strong', 'Fort')}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t('auth.signup.passwordHint')}
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full gradient-primary"
                    disabled={isLoading}
                    aria-busy={isLoading}
                  >
                    {isLoading ? t('auth.signup.buttonLoading') : t('auth.signup.button')}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {t('auth.termsNote')}
        </p>
      </div>

      {/* Dialog Réinitialisation du mot de passe */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('auth.forgotPassword.title', 'Réinitialiser le mot de passe')}</DialogTitle>
            <DialogDescription>
              {t('auth.forgotPassword.description', 'Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.')}
            </DialogDescription>
          </DialogHeader>
          
          {resetSent ? (
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{t('auth.forgotPassword.successTitle', 'Email envoyé !')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('auth.forgotPassword.successMessage', `Nous avons envoyé un lien de réinitialisation à ${resetEmail}. Vérifiez votre boîte de réception et votre dossier spam.`)}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSent(false);
                    setResetEmail("");
                  }}
                  className="w-full"
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
                <Label htmlFor="reset-email">{t('auth.forgotPassword.emailLabel', 'Adresse email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder={t('auth.forgotPassword.emailPlaceholder', 'votre@email.com')}
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    disabled={isResetLoading}
                    autoComplete="email"
                    className="pl-10"
                    aria-required="true"
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button
                  type="submit"
                  className="w-full"
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
                    setResetEmail("");
                    setResetError("");
                  }}
                  disabled={isResetLoading}
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
