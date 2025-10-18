import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MessageSquare } from "lucide-react";

interface ContactFormProps {
  storeName: string;
  contactEmail?: string;
  contactPhone?: string;
}

const ContactForm = ({ storeName, contactEmail, contactPhone }: ContactFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate sending message
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Message envoyé !",
      description: "Nous vous répondrons dans les plus brefs délais.",
    });

    setFormData({ name: "", email: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Contactez {storeName}</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Vous avez une question ? N'hésitez pas à nous contacter. Nous vous répondrons dans les meilleurs délais.
        </p>
      </div>

      {(contactEmail || contactPhone) && (
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {contactEmail && (
            <a
              href={`mailto:${contactEmail}`}
              className="bg-muted/50 p-4 rounded-lg border border-border hover:border-primary transition-colors touch-manipulation block"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm sm:text-base text-foreground hover:text-primary transition-colors truncate">
                    {contactEmail}
                  </p>
                </div>
              </div>
            </a>
          )}
          {contactPhone && (
            <a
              href={`tel:${contactPhone}`}
              className="bg-muted/50 p-4 rounded-lg border border-border hover:border-primary transition-colors touch-manipulation block"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Téléphone</p>
                  <p className="text-sm sm:text-base text-foreground hover:text-primary transition-colors truncate">
                    {contactPhone}
                  </p>
                </div>
              </div>
            </a>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 bg-card p-4 sm:p-6 rounded-lg border border-border shadow-medium">
        <div className="flex items-center gap-3 mb-2 sm:mb-4">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold">Envoyer un message</h3>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm">Nom complet *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Votre nom"
              className="h-11 touch-manipulation"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="votre@email.com"
              className="h-11 touch-manipulation"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject" className="text-sm">Sujet *</Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
            placeholder="Objet de votre message"
            className="h-11 touch-manipulation"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message" className="text-sm">Message *</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
            rows={5}
            placeholder="Écrivez votre message ici..."
            className="min-h-[120px] sm:min-h-[150px] touch-manipulation resize-none"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-11 sm:h-12 gradient-primary font-semibold hover:opacity-90 transition-opacity touch-manipulation active:scale-[0.98]"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
        </Button>
      </form>
    </div>
  );
};

export default ContactForm;
