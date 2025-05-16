
"use client";

import { useQuery } from "@tanstack/react-query";
import { firestoreService } from "@/services/firestoreService";
import type { UserProfile } from "@/types"; // Changed from ScoreEntry to UserProfile
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Terminal, UserCircle, Trophy } from "lucide-react";
// import { formatDistanceToNow } from 'date-fns'; // Removed as user document doesn't have a relevant timestamp for this view
// Select component removed as topic filter is not applicable for global user leaderboard
import { useLanguage } from "@/contexts/LanguageContext";
// import type { TranslationKey } from "@/lib/translations"; // Not needed directly if topic names are not displayed

export default function LeaderboardDisplay() {
  const { t } = useLanguage();

  // Fetching user profiles for the leaderboard, ordered by totalQuizPoints
  const { data: leaderboardData, isLoading, error } = useQuery<UserProfile[], Error>({
    queryKey: ["globalUserLeaderboard"], // Changed queryKey
    queryFn: () => firestoreService.getGlobalUserLeaderboard(10), // Call new service function
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
        <LoadingSpinner size={48} />
        <p className="text-lg text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-lg mx-auto">
        <Terminal className="h-4 w-4" />
        <AlertTitle>{t('errorFetchingLeaderboard')}</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (!leaderboardData || leaderboardData.length === 0) {
    return (
       <div className="text-center py-8">
        <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-xl text-muted-foreground">{t('leaderboardEmpty')}</p>
        <p className="text-sm text-muted-foreground">{t('beTheFirstToRank')}</p> 
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Topic Select filter removed */}
      <Table>
        <TableCaption>{t('leaderboardGlobalCaption')}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">{t('rank')}</TableHead>
            <TableHead>{t('player')}</TableHead>
            <TableHead className="text-right">{t('totalPoints')}</TableHead>
            {/* "Topic" and "When" columns removed */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaderboardData.map((user, index) => (
            <TableRow key={user.uid} className="hover:bg-secondary/50">
              <TableCell className="font-medium text-lg">{index + 1}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || t('anonymousUser')} />
                    <AvatarFallback>
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserCircle size={20}/>}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.displayName || t('anonymousUser')}</span>
                </div>
              </TableCell>
              <TableCell className="text-right font-semibold text-primary text-lg">
                {user.totalQuizPoints || 0}
              </TableCell>
              {/* Topic and Timestamp cells removed */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
