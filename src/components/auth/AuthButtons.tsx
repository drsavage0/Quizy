
"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import UserAvatar from "./UserAvatar";
import { LogIn, UserCircle, UserPlus, ShieldQuestion } from "lucide-react"; 
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function AuthButtons() {
  const { currentUser, signInWithGoogle, signInAnonymously, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const isMobile = useIsMobile(); // isMobile can now be true, false, or undefined

  const handleSignInGoogle = async () => {
    const user = await signInWithGoogle();
    if (user) {
      toast({
        title: t('signedIn'),
        description: `${t('welcome')}, ${user.displayName || t('quizzer')}!`,
      });
    } else {
      // Error toast might already be handled by general error handler or specific context
      // For now, keeping it simple.
      toast({
        title: t('signInFailed'),
        description: t('signInFailedDescription'),
        variant: "destructive",
      });
    }
  };

  const handleSignInAnonymously = async () => {
    const user = await signInAnonymously();
    if (user) {
      toast({
        title: t('signedInAsGuest'),
        description: t('welcomeGuestUser'),
      });
    } else {
      toast({
        title: t('signInFailed'),
        description: t('signInFailedDescription'), 
        variant: "destructive",
      });
    }
  };

  // Show loading if auth state is loading OR if mobile status is not yet determined
  if (authLoading || isMobile === undefined) { 
    return <Button variant="outline" size="sm" disabled>{t('loading')}</Button>;
  }

  if (currentUser) {
    return <UserAvatar />;
  }

  // Not logged in, and mobile status is determined (isMobile is boolean)
  if (isMobile) { // isMobile is now guaranteed to be boolean here
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" aria-label={t('loginOptions')}>
            <UserCircle className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleSignInGoogle}>
            <LogIn className="me-2 h-4 w-4" />
            {t('loginWithGoogle')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignInAnonymously}>
            <ShieldQuestion className="me-2 h-4 w-4" />
            {t('continueAsGuest')}
          </DropdownMenuItem>
          {/* TODO: Add Email/Password options here */}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Desktop and not logged in
  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleSignInGoogle} variant="outline" size="sm">
        <LogIn className="me-2 h-4 w-4" />
        {t('loginWithGoogle')}
      </Button>
      <Button onClick={handleSignInAnonymously} variant="secondary" size="sm">
         <ShieldQuestion className="me-2 h-4 w-4" />
        {t('continueAsGuest')}
      </Button>
      {/* TODO: Add Email/Password buttons or modal triggers here */}
    </div>
  );
}
