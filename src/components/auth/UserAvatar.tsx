
"use client";

import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, UserCircle, User, Shield, SettingsIcon } from "lucide-react"; // Added Shield for Profile, SettingsIcon
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import React, { useState } from "react"; // Import useState
import SettingsDialog from "@/components/settings/SettingsDialog"; // Import SettingsDialog

export default function UserAvatar() {
  const { currentUser, signOutUser } = useAuth();
  const { t } = useLanguage();
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false); // State for dialog

  if (!currentUser) return null;

  const displayName = currentUser.isAnonymous ? t('guest') : currentUser.displayName || t('quizzer');
  const displayEmail = currentUser.isAnonymous ? t('anonymousUser') : currentUser.email;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              {currentUser.photoURL && !currentUser.isAnonymous ? (
                <AvatarImage src={currentUser.photoURL} alt={displayName} />
              ) : null}
              <AvatarFallback>
                {currentUser.isAnonymous ? (
                  <User size={24} />
                ) : displayName ? (
                  displayName.charAt(0).toUpperCase()
                ) : (
                  <UserCircle size={24} />
                )}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {displayName}
              </p>
              {displayEmail && (
                <p className="text-xs leading-none text-muted-foreground">
                  {displayEmail}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/profile">
              <Shield className="me-2 h-4 w-4" />
              <span>{t('viewProfile')}</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsSettingsDialogOpen(true)} className="cursor-pointer">
            <SettingsIcon className="me-2 h-4 w-4" />
            <span>{t('settings')}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOutUser} className="cursor-pointer">
            <LogOut className="me-2 h-4 w-4" />
            <span>{t('logout')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SettingsDialog isOpen={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen} />
    </>
  );
}
