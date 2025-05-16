
import { db } from "@/lib/firebase";
import type { ScoreEntry, ScoreAttackGameData, PlayerGameState, UserProfile, GeneratedQuestion, SpeedChallengeGameData, SpeedChallengePlayerData } from "@/types";
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  where,
  Timestamp,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  Unsubscribe,
  DocumentData,
  increment, 
} from "firebase/firestore";

const SCORES_COLLECTION = "scores";
const USERS_COLLECTION = "users";
const MULTIPLAYER_GAMES_COLLECTION = "multiplayerGames";
const SPEED_CHALLENGE_GAMES_COLLECTION = "speedChallengeGames"; // New collection

export const firestoreService = {
  saveScore: async (scoreData: Omit<ScoreEntry, "timestamp" | "id">): Promise<string | null> => {
    try {
      const docRef = await addDoc(collection(db, SCORES_COLLECTION), {
        ...scoreData,
        timestamp: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error saving score:", error);
      return null;
    }
  },

  getTopQuizScores: async (topic?: string, count: number = 10): Promise<ScoreEntry[]> => {
    try {
      let q;
      if (topic) {
        q = query(
          collection(db, SCORES_COLLECTION),
          where("topic", ">=", topic),
          where("topic", "<=", topic + '\uf8ff'), 
          orderBy("topic", "asc"), 
          orderBy("score", "desc"),
          orderBy("timestamp", "asc"), 
          limit(count)
        );
      } else {
        q = query(
          collection(db, SCORES_COLLECTION),
          orderBy("score", "desc"),
          orderBy("timestamp", "asc"),
          limit(count)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const leaderboard: ScoreEntry[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        leaderboard.push({
          id: doc.id,
          ...data,
          timestamp: (data.timestamp as Timestamp)?.toDate ? (data.timestamp as Timestamp).toDate() : new Date(), 
        } as ScoreEntry);
      });
      return leaderboard;
    } catch (error) {
      console.error("Error fetching top quiz scores:", error);
      return [];
    }
  },

  getGlobalUserLeaderboard: async (count: number = 10): Promise<UserProfile[]> => {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(
        usersRef,
        orderBy("totalQuizPoints", "desc"),
        limit(count)
      );
      const querySnapshot = await getDocs(q);
      const userLeaderboard: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        userLeaderboard.push({
          uid: doc.id, 
          ...doc.data(),
        } as UserProfile);
      });
      return userLeaderboard;
    } catch (error) {
      console.error("Error fetching global user leaderboard:", error);
      return [];
    }
  },

  getUserScores: async (userId: string, topic?: string): Promise<ScoreEntry[]> => {
    try {
      let q = query(
        collection(db, SCORES_COLLECTION),
        where("userId", "==", userId),
        orderBy("score", "desc"),
        orderBy("timestamp", "desc")
      );

      if (topic) {
        q = query(
          collection(db, SCORES_COLLECTION),
          where("userId", "==", userId),
          where("topic", "==", topic), 
          orderBy("score", "desc"),
          orderBy("timestamp", "desc")
        );
      }

      const querySnapshot = await getDocs(q);
      const scores: ScoreEntry[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        scores.push({
          id: doc.id,
          ...data,
          timestamp: (data.timestamp as Timestamp)?.toDate ? (data.timestamp as Timestamp).toDate() : new Date(),
        } as ScoreEntry);
      });
      return scores;
    } catch (error) {
      console.error("Error fetching user scores:", error);
      return [];
    }
  },

  incrementUserTotalPoints: async (userId: string, pointsToAdd: number): Promise<void> => {
    const userRef = doc(db, USERS_COLLECTION, userId);
    try {
      await updateDoc(userRef, {
        totalQuizPoints: increment(pointsToAdd)
      });
      console.log(`Updated totalQuizPoints by ${pointsToAdd} for user ${userId}`);
    } catch (error) {
      // If update fails (e.g. field doesn't exist), try setting it
      console.error(`Error updating totalQuizPoints for user ${userId}:`, error);
      try {
          const userSnap = await getDoc(userRef);
          const currentPoints = (userSnap.data()?.totalQuizPoints || 0) as number;
          await setDoc(userRef, { totalQuizPoints: currentPoints + pointsToAdd }, { merge: true });
          console.log(`Set totalQuizPoints to ${currentPoints + pointsToAdd} for user ${userId} after update failed.`);
      } catch (setErr) {
          console.error(`Error setting totalQuizPoints for user ${userId} after update failed:`, setErr);
      }
    }
  },

  async getOrCreateScoreAttackGame(
    gameId: string, 
    userId: string, 
    displayName: string | null, 
    avatarUrl?: string | null
  ): Promise<{ gameData: ScoreAttackGameData | null, playerRole: 'player1' | 'player2' | 'observer' | 'full' }> {
    const gameRef = doc(db, MULTIPLAYER_GAMES_COLLECTION, gameId);
    try {
      const gameSnap = await getDoc(gameRef);
      const now = serverTimestamp();

      const initialPlayerState = (uid: string, name: string | null, avatar?: string | null): PlayerGameState => ({
        userId: uid,
        displayName: name,
        avatarUrl: avatar,
        score: 0,
        currentAnswerIndex: null,
        hasAnsweredThisRound: false,
      });

      if (!gameSnap.exists()) {
        const newGameData: ScoreAttackGameData = {
          gameId,
          player1: initialPlayerState(userId, displayName, avatarUrl),
          player2: null,
          currentQuestionIndex: 0,
          questions: [], 
          status: 'waiting',
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(gameRef, newGameData);
        return { gameData: newGameData, playerRole: 'player1' };
      } else {
        const gameData = gameSnap.data() as ScoreAttackGameData;
        const gameIsOver = ['player1_won', 'player2_won', 'tie', 'abandoned'].includes(gameData.status);

        if (gameIsOver) {
          const newGameDataForTakeover: ScoreAttackGameData = {
            gameId,
            player1: initialPlayerState(userId, displayName, avatarUrl),
            player2: null,
            currentQuestionIndex: 0,
            questions: [], 
            status: 'waiting', 
            createdAt: now,    
            updatedAt: now,
          };
          await setDoc(gameRef, newGameDataForTakeover); 
          return { gameData: newGameDataForTakeover, playerRole: 'player1' };
        }

        if (gameData.player1?.userId === userId) {
          return { gameData, playerRole: 'player1' };
        }
        if (gameData.player2?.userId === userId) {
          return { gameData, playerRole: 'player2' };
        }
        if (!gameData.player2) {
          const player2Data = initialPlayerState(userId, displayName, avatarUrl);
          const updatePayload: Partial<ScoreAttackGameData> = {
            player2: player2Data,
            // Status remains 'waiting' until P1 fetches questions or starts the game
            status: 'waiting', 
            updatedAt: now,
          };
          await updateDoc(gameRef, updatePayload);
          return { gameData: {...gameData, ...updatePayload }, playerRole: 'player2' };
        }
        if (gameData.player1?.userId !== userId && gameData.player2?.userId !== userId) {
            return { gameData, playerRole: 'full' };
        }
        return { gameData, playerRole: 'observer'};
      }
    } catch (error) {
      console.error("Error getting or creating score attack game:", error);
      return { gameData: null, playerRole: 'observer' }; 
    }
  },

  listenToScoreAttackGame(gameId: string, callback: (data: ScoreAttackGameData | null) => void): Unsubscribe {
    const gameRef = doc(db, MULTIPLAYER_GAMES_COLLECTION, gameId);
    return onSnapshot(gameRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as ScoreAttackGameData);
      } else {
        callback(null); 
      }
    }, (error) => {
      console.error("Error listening to score attack game:", error);
      callback(null);
    });
  },

  async updatePlayerStateInScoreAttack(
    gameId: string, 
    playerRole: 'player1' | 'player2', 
    newState: Partial<PlayerGameState>
  ): Promise<void> {
    const gameRef = doc(db, MULTIPLAYER_GAMES_COLLECTION, gameId);
    const updateData: DocumentData = { updatedAt: serverTimestamp() };
    
    Object.keys(newState).forEach(key => {
      updateData[`${playerRole}.${key}`] = newState[key as keyof PlayerGameState];
    });

    try {
      await updateDoc(gameRef, updateData);
    } catch (error) {
      console.error("Error updating player state in score attack:", error);
    }
  },

  async setScoreAttackQuestionIndex(gameId: string, newQuestionIndex: number): Promise<void> {
    const gameRef = doc(db, MULTIPLAYER_GAMES_COLLECTION, gameId);
    try {
        const updatePayload: Partial<ScoreAttackGameData> & { "player1.hasAnsweredThisRound": boolean, "player2.hasAnsweredThisRound": boolean, "player1.currentAnswerIndex": null, "player2.currentAnswerIndex": null } = {
            currentQuestionIndex: newQuestionIndex,
            updatedAt: serverTimestamp(),
            "player1.hasAnsweredThisRound": false,
            "player2.hasAnsweredThisRound": false,
            "player1.currentAnswerIndex": null,
            "player2.currentAnswerIndex": null,
        };
      await updateDoc(gameRef, updatePayload as any);
    } catch (error) {
      console.error("Error setting score attack question index:", error);
    }
  },

  async updateGameStatus(gameId: string, newStatus: ScoreAttackGameData['status']): Promise<void> {
    const gameRef = doc(db, MULTIPLAYER_GAMES_COLLECTION, gameId);
    try {
      await updateDoc(gameRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating game status:", error);
    } 
  },

  async resetScoreAttackGame(gameId: string, player1Id: string, player2Id: string | null): Promise<void> {
    const gameRef = doc(db, MULTIPLAYER_GAMES_COLLECTION, gameId);
    try {
      const gameDoc = await getDoc(gameRef);
      if (!gameDoc.exists()) return;

      const gameData = gameDoc.data() as ScoreAttackGameData;
      
      const updates: Partial<ScoreAttackGameData> & {player1?: PlayerGameState, player2?: PlayerGameState | null} = {
        currentQuestionIndex: 0,
        questions: [], 
        status: 'waiting', 
        updatedAt: serverTimestamp(),
        player1: gameData.player1 ? { 
          ...gameData.player1,
          score: 0,
          currentAnswerIndex: null,
          hasAnsweredThisRound: false,
        } : undefined,
      };
      if (player2Id && gameData.player2) {
        updates.player2 = {
          ...(gameData.player2 as PlayerGameState),
          score: 0,
          currentAnswerIndex: null,
          hasAnsweredThisRound: false,
        };
      } else { 
        updates.player2 = null; 
      }

      await updateDoc(gameRef, updates as any);
    } catch (error) {
      console.error("Error resetting score attack game:", error);
    }
  },

  async setScoreAttackGameQuestions(gameId: string, questions: GeneratedQuestion[]): Promise<void> {
    const gameRef = doc(db, MULTIPLAYER_GAMES_COLLECTION, gameId);
    try {
      await updateDoc(gameRef, {
        questions: questions,
        status: 'preparingMatch', 
        currentQuestionIndex: 0, 
        updatedAt: serverTimestamp(),
        "player1.hasAnsweredThisRound": false,
        "player1.currentAnswerIndex": null,
        "player2.hasAnsweredThisRound": false,
        "player2.currentAnswerIndex": null,
      });
    } catch (error) {
      console.error("Error setting score attack game questions:", error);
    }
  },

  // Speed Challenge Firestore Service Functions
  async getOrCreateSpeedChallengeGame(
    gameId: string,
    userId: string,
    displayName: string | null,
    avatarUrl?: string | null
  ): Promise<{ gameData: SpeedChallengeGameData | null; playerRole: 'player1' | 'player2' | 'observer' | 'full' }> {
    const gameRef = doc(db, SPEED_CHALLENGE_GAMES_COLLECTION, gameId);
    try {
      const gameSnap = await getDoc(gameRef);
      const now = serverTimestamp();
      const playerData: SpeedChallengePlayerData = { userId, displayName, avatarUrl };

      if (!gameSnap.exists()) {
        const newGameData: SpeedChallengeGameData = {
          gameId,
          player1: playerData,
          player2: null,
          status: 'waiting',
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(gameRef, newGameData);
        return { gameData: newGameData, playerRole: 'player1' };
      } else {
        const gameData = gameSnap.data() as SpeedChallengeGameData;
        // Allow rejoining or taking over if game is 'waiting' but player slot is mismatched or empty
        if (gameData.status === 'waiting') {
            if (!gameData.player1 || gameData.player1.userId === userId) {
                 if(!gameData.player1) await updateDoc(gameRef, { player1: playerData, updatedAt: now });
                 return { gameData: {...gameData, player1: playerData}, playerRole: 'player1'};
            }
            if (!gameData.player2 && gameData.player1.userId !== userId) {
                await updateDoc(gameRef, { player2: playerData, updatedAt: now });
                return { gameData: {...gameData, player2: playerData}, playerRole: 'player2'};
            }
        }
        // If status is 'active' and player is one of the participants, let them rejoin that view.
        if (gameData.status === 'active') {
            if (gameData.player1?.userId === userId) return { gameData, playerRole: 'player1' };
            if (gameData.player2?.userId === userId) return { gameData, playerRole: 'player2' };
        }

        if (gameData.player1?.userId === userId) return { gameData, playerRole: 'player1' };
        if (gameData.player2?.userId === userId) return { gameData, playerRole: 'player2' };
        
        if (gameData.player1 && gameData.player2) {
          return { gameData, playerRole: 'full' }; // Game is full and user is not part of it
        }
        // Fallback for unexpected states or if trying to observe (though observer logic isn't fully built here)
        return { gameData, playerRole: 'observer' };
      }
    } catch (error) {
      console.error("Error getting or creating speed challenge game:", error);
      return { gameData: null, playerRole: 'observer' };
    }
  },

  listenToSpeedChallengeGame(gameId: string, callback: (data: SpeedChallengeGameData | null) => void): Unsubscribe {
    const gameRef = doc(db, SPEED_CHALLENGE_GAMES_COLLECTION, gameId);
    return onSnapshot(gameRef, (docSnap) => {
      callback(docSnap.exists() ? (docSnap.data() as SpeedChallengeGameData) : null);
    }, (error) => {
      console.error("Error listening to speed challenge game:", error);
      callback(null);
    });
  },

  async updateSpeedChallengeGameStatus(gameId: string, status: SpeedChallengeGameData['status']): Promise<void> {
    const gameRef = doc(db, SPEED_CHALLENGE_GAMES_COLLECTION, gameId);
    try {
      await updateDoc(gameRef, {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating speed challenge game status:", error);
    }
  },
};
