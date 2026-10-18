"use client";

import styles from "./page.module.css";
import { useRouter } from "next/navigation";
import signInWithGoogle  from "@/components/firebase-config";
import { auth, db } from "@/components/firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import { useState, useRef, useEffect } from "react";
import { doc, getDoc } from 'firebase/firestore'

function StartButton() {
  const router = useRouter();

  return (
    <button
      className={styles.startButton}
      onClick={() => router.push("/game")}
    >
      <div className={styles.buttonText}>Start Game!</div>
    </button>
  );
}

// Move videos array outside component so it doesn't recreate on every render
const videos = [
  "/BGvideo1.mp4",
  "/BGvideo2.mp4",
  "/BGvideo3.mp4",
  "/BGvideo4.mp4",
  "/BGvideo5.mp4",
  "/BGvideo6.mp4",
  "/BGvideo7.mp4",
  "/BGvideo8.mp4",
  "/BGvideo9.mp4",
];


export default function Lobby() {
  const [profilePic, setProfilePic] = useState();
  const router = useRouter();
  const handleLoginSuccess = () => router.push("/lobby");
  const [docSnap, setDocSnap] = useState();
  
  const [index, setIndex] = useState(0);
  const [active, setActive] = useState(true);
  const videoARef = useRef(null);
  const videoBRef = useRef(null);
  const [name, setName] = useState("");

  // Leaderboard pop-up: shows the signed-in player's own scores from users/{uid}.
  // (The database rules only let each player read their own record.)
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [myScores, setMyScores] = useState(null);
  const [leaderStatus, setLeaderStatus] = useState("loading"); // "loading" | "ready" | "error"

  const openLeaderboard = async () => {
    setShowLeaderboard(true);
    setLeaderStatus("loading");
    try {
      const user = auth.currentUser;
      const snap = await getDoc(doc(db, "users", user.uid));
      setMyScores({
        totalPoints: snap.get("totalPoints") ?? 0,
        highScore: snap.get("highScore") ?? 0,
        // New accounts start with placeholder zeros, so hide those
        recentScores: (snap.get("recentScores") ?? []).filter((score) => score > 0),
      });
      setLeaderStatus("ready");
    } catch (error) {
      console.error("Error loading scores:", error);
      setLeaderStatus("error");
    }
  };

  useEffect(() => {
    // Auth guard: if not signed in, redirect back to /login.
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        try { router.replace("/login"); } catch {}
      }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("name");
      if (storedName) setName(storedName);
    }
  }, []);
  useEffect(() => {
      setProfilePic(localStorage.getItem("profilePic"));
    }, []);

  useEffect(() => {
    const currentVideo = active ? videoARef.current : videoBRef.current;
    const nextVideo = active ? videoBRef.current : videoARef.current;
    
    if (!currentVideo || !nextVideo) return;
    
    let preloaded = false;

    const handleTimeUpdate = () => {
      // Preload next video 2 seconds before current ends
      if (!preloaded && currentVideo.duration - currentVideo.currentTime < 2) {
        const nextIndex = (index + 1) % videos.length;
        nextVideo.src = videos[nextIndex];
        nextVideo.load(); // starts prebuffering
        preloaded = true;
      }
    };

    const handleEnded = async () => {
      try {
        await nextVideo.play(); // should already be buffered
        setActive((prev) => !prev);
        setIndex((prev) => (prev + 1) % videos.length);
      } catch (err) {
        console.error("Playback failed:", err);
      }
    };

    currentVideo.addEventListener("timeupdate", handleTimeUpdate);
    currentVideo.addEventListener("ended", handleEnded);

    return () => {
      currentVideo.removeEventListener("timeupdate", handleTimeUpdate);
      currentVideo.removeEventListener("ended", handleEnded);
    };
  }, [index, active]); // Only index and active - NOT videos

  useEffect(() => {
      const user = auth.currentUser 
    if (user) {
      const docRef = doc(db, "users", user.uid)
      const updateSnap = async () => {
      const docSnap = await getDoc(docRef);
        setDocSnap(docSnap)
      }
      updateSnap()
    }
  }, []);


  return (
    <div className={styles.App}>
      <div className={styles.videoBackground}>
        <video
          ref={videoARef}
          src={videos[0]}
          autoPlay
          muted
          playsInline
          style={{ display: active ? "block" : "none" }}
        />
        <video
          ref={videoBRef}
          muted
          playsInline
          style={{ display: active ? "none" : "block" }}
        />
      </div>
      <div className={styles.content}>
        <header className={styles["App-header"]}>
          <div className={styles.profile}>
            <p className={styles["profile-para"]}>Hi, {name ? name : "Player"}!</p>
            <button 
              className={styles.profileButton}
              onClick={() => router.push("/profile")}
            >
              <img className={styles.profileImage} referrerPolicy="no-referrer" src={profilePic} />
            </button>
          </div>
          
          <div className={styles["score"]}>
            <img
              src="/trophy.png"
              className={styles["trophy"]}
              alt="trophy"
            />
            <span>{docSnap ? docSnap.get("highScore") : 0}</span>
          </div>

          <img
            src="/upscaled_logo.png"
            className={styles["App-logo"]}
            alt="logo"
          />

          <p className={styles["App-para"]}>Game Mode: Outdoor</p>
        </header>
        <div className={styles.logoContainer}>
        <StartButton />
      </div>
        <button
          className={styles.leaderboardButton}
          onClick={openLeaderboard}
        >
          <img src="/trophy.png" alt="" className={styles.leaderboardIcon} />
          Leaderboard
        </button>
      </div>

      {showLeaderboard && (
        <div className={styles.leaderboardOverlay} onClick={() => setShowLeaderboard(false)}>
          <div className={styles.leaderboardPanel} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.leaderboardTitle}>Leaderboard</h2>
            <p className={styles.leaderboardSubtitle}>Your scores</p>

            {leaderStatus === "loading" && <p className={styles.leaderboardMessage}>Loading...</p>}
            {leaderStatus === "error" && (
              <p className={styles.leaderboardMessage}>Couldn't load the leaderboard. Try again in a moment.</p>
            )}
            {leaderStatus === "ready" && myScores && (
              <>
                <ul className={styles.leaderboardList}>
                  <li className={`${styles.leaderboardRow} ${styles.leaderboardYou}`}>
                    <span className={styles.leaderboardName}>Total points</span>
                    <span className={styles.leaderboardPoints}>{myScores.totalPoints.toLocaleString()} pts</span>
                  </li>
                  <li className={styles.leaderboardRow}>
                    <span className={styles.leaderboardName}>Best round</span>
                    <span className={styles.leaderboardPoints}>{myScores.highScore.toLocaleString()} pts</span>
                  </li>
                </ul>

                <h3 className={styles.leaderboardSection}>Recent rounds</h3>
                {myScores.recentScores.length === 0 ? (
                  <p className={styles.leaderboardMessage}>No rounds yet. Play a game to see your scores here!</p>
                ) : (
                  <ol className={styles.leaderboardList}>
                    {myScores.recentScores.map((score, i) => (
                      <li key={i} className={styles.leaderboardRow}>
                        <span className={styles.leaderboardRank}>{i + 1}</span>
                        <span className={styles.leaderboardName}>{i === 0 ? "Latest round" : `${i + 1} rounds ago`}</span>
                        <span className={styles.leaderboardPoints}>{score.toLocaleString()} pts</span>
                      </li>
                    ))}
                  </ol>
                )}
              </>
            )}

            <button className={styles.leaderboardClose} onClick={() => setShowLeaderboard(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      
    </div>
  );
}
