/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MotionConfig } from 'motion/react';
import { User } from 'firebase/auth';
import { SkylineHeader } from './components/SkylineHeader';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { SkillsSection } from './components/SkillsSection';
import { DataLab3DSection } from './components/DataLab3DSection';
import { ContactSection } from './components/ContactSection';
import { SubscribeSection } from './components/SubscribeSection';
import { SkylineFooter } from './components/SkylineFooter';
import { LegalModal } from './components/LegalModals';
import { OwnerGmailModal } from './components/OwnerGmailModal';
import {
  initAuth,
  googleSignIn,
  logout,
  clearAccessToken,
  isAuthorizedOwner,
} from './services/googleAuth';

export default function App() {
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'accessibility' | null>(null);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('owner') === '1' || window.location.hash === '#owner';
    }
    return false;
  });

  // Owner-only Google Auth & Gmail OAuth token state (strictly in memory)
  const [ownerUser, setOwnerUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Synced Owner Console live summary (only fetched/populated when Kundan is authenticated)
  const [autoDispatchEnabled, setAutoDispatchEnabled] = useState(false);
  const [pendingSubscribersCount, setPendingSubscribersCount] = useState(0);
  const [pendingContactsCount, setPendingContactsCount] = useState(0);

  const isOwnerSessionActive = Boolean(ownerUser && isAuthorizedOwner(ownerUser));

  const syncOwnerStatus = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/owner/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        clearAccessToken();
        setAccessToken(null);
        setAutoDispatchEnabled(false);
        return;
      }
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      const subs = Array.isArray(data.subscribers) ? data.subscribers : [];
      const contacts = Array.isArray(data.contacts) ? data.contacts : [];
      setAutoDispatchEnabled(Boolean(data.autoDispatchEnabled));
      setPendingSubscribersCount(
        subs.filter((s: { welcomeEmailSent?: boolean }) => !s.welcomeEmailSent).length
      );
      setPendingContactsCount(
        contacts.filter((c: { ownerNotified?: boolean }) => !c.ownerNotified).length
      );
    } catch {
      // Silent background sync for authenticated owner
    }
  }, []);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        if (isAuthorizedOwner(user)) {
          setOwnerUser(user);
          if (token) setAccessToken(token);
        } else {
          setOwnerUser(null);
          setAccessToken(null);
          setAutoDispatchEnabled(false);
          setPendingSubscribersCount(0);
          setPendingContactsCount(0);
        }
      },
      () => {
        setOwnerUser(null);
        setAccessToken(null);
        setAutoDispatchEnabled(false);
        setPendingSubscribersCount(0);
        setPendingContactsCount(0);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOwnerSessionActive && accessToken) {
      syncOwnerStatus(accessToken);
    }
  }, [isOwnerSessionActive, accessToken, refreshTrigger, syncOwnerStatus]);

  const handleOwnerSignIn = useCallback(async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setOwnerUser(res.user);
        setAccessToken(res.accessToken);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      setAuthError(msg);
    } finally {
      setIsSigningIn(false);
    }
  }, [isSigningIn]);

  const handleOwnerSignOut = useCallback(async () => {
    if (accessToken) {
      await fetch('/api/owner/auto-dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ enabled: false }),
      }).catch(() => undefined);
    }
    await logout();
    setOwnerUser(null);
    setAccessToken(null);
    setAuthError(null);
    setAutoDispatchEnabled(false);
    setPendingSubscribersCount(0);
    setPendingContactsCount(0);
  }, [accessToken]);

  const handleTokenExpired = useCallback(() => {
    clearAccessToken();
    setAccessToken(null);
    setAutoDispatchEnabled(false);
  }, []);

  const handleStatusSync = useCallback(
    (status: {
      autoDispatchEnabled: boolean;
      pendingSubscribers: number;
      pendingContacts: number;
    }) => {
      setAutoDispatchEnabled(status.autoDispatchEnabled);
      setPendingSubscribersCount(status.pendingSubscribers);
      setPendingContactsCount(status.pendingContacts);
    },
    []
  );

  const handleSubscribeScroll = () => {
    document.getElementById('subscribe')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-black text-white antialiased selection:bg-white selection:text-black font-sans">
        {/* Top Header with Scroll Progress & Navigation */}
        <SkylineHeader onSubscribeClick={handleSubscribeScroll} />

        {/* Main Portfolio Sections */}
        <main>
          {/* Editorial Fresher Hero with Interactive Toolkit Explorer */}
          <HeroSection />

          {/* About Kundan & Fresher Journey */}
          <AboutSection />

          {/* Core Analytical Stack: Excel, Power BI, MySQL, Python, Pandas, NumPy */}
          <SkillsSection />

          {/* Interactive Three.js 3D Analytical Stack Observatory */}
          <DataLab3DSection />

          {/* Direct Contact Form (Name, Email, Subject, Message) */}
          <ContactSection onContactSubmitted={() => setRefreshTrigger((n) => n + 1)} />

          {/* Email Registration (Owner-Only Gmail Dispatch Console appears strictly for Kundan) */}
          <SubscribeSection
            isOwnerSessionActive={isOwnerSessionActive}
            ownerAccessToken={accessToken}
            autoDispatchEnabled={autoDispatchEnabled}
            pendingSubscribersCount={pendingSubscribersCount}
            pendingContactsCount={pendingContactsCount}
            onOpenOwnerPortal={() => setIsOwnerModalOpen(true)}
            onAutoDispatchSync={handleStatusSync}
            onTokenExpired={handleTokenExpired}
            onSubscriberAdded={() => setRefreshTrigger((n) => n + 1)}
          />
        </main>

        {/* Footer with Legal Links & Subtle Owner Console Trigger */}
        <SkylineFooter
          onOpenPrivacy={() => setLegalModalType('privacy')}
          onOpenAccessibility={() => setLegalModalType('accessibility')}
          onOpenOwnerPortal={() => setIsOwnerModalOpen(true)}
          isOwnerSessionActive={isOwnerSessionActive}
        />

        {/* Legal Statement Modals */}
        <LegalModal type={legalModalType} onClose={() => setLegalModalType(null)} />

        {/* Private Owner-Only Gmail Automated Dispatch Console */}
        <OwnerGmailModal
          isOpen={isOwnerModalOpen}
          onClose={() => setIsOwnerModalOpen(false)}
          ownerUser={ownerUser}
          accessToken={accessToken}
          isSigningIn={isSigningIn}
          authError={authError}
          onSignIn={handleOwnerSignIn}
          onSignOut={handleOwnerSignOut}
          onTokenExpired={handleTokenExpired}
          onStatusSync={handleStatusSync}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </MotionConfig>
  );
}
