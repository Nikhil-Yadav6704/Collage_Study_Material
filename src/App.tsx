import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from './lib/queryClient';
import { AuthGuard } from './components/auth/AuthGuard';
import { RoleGuard } from './components/auth/RoleGuard';
import { CollegeFormGuard } from './components/auth/CollegeFormGuard';

// Shells
import AppShell from "./components/AppShell";
import AdminShell from "./components/AdminShell";
import ModeratorShell from "./components/ModeratorShell";

// Public Pages
const Index = React.lazy(() => import("./pages/Index"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const SignInPage = React.lazy(() => import("./pages/SignInPage"));
const SignUpPage = React.lazy(() => import("./pages/SignUpPage"));
const AdminLoginPage = React.lazy(() => import("./pages/AdminLoginPage"));
const AuthCallbackPage = React.lazy(() => import("./pages/AuthCallbackPage"));
const CompleteSignupPage = React.lazy(() => import("./pages/CompleteSignupPage"));

// Student Pages
const StudyPage = React.lazy(() => import("./pages/StudyPage"));
const FileManagerPage = React.lazy(() => import("./pages/FileManagerPage"));
const BookmarksPage = React.lazy(() => import("./pages/BookmarksPage"));
const UploadRequestPage = React.lazy(() => import("./pages/UploadRequestPage"));
const ProfileSettingsPage = React.lazy(() => import("./pages/ProfileSettingsPage"));
const ChatPlaceholder = React.lazy(() => import("./pages/ChatPlaceholder"));

// Moderator Pages
const ModeratorDashboard = React.lazy(() => import("./pages/ModeratorDashboard"));
const BrowseStudyMod = React.lazy(() => import("./pages/BrowseStudyMod"));
const FileManagerMod = React.lazy(() => import("./pages/FileManagerMod"));
const UploadMaterial = React.lazy(() => import("./pages/UploadMaterial"));
const StudentRequests = React.lazy(() => import("./pages/StudentRequests"));
const FeedbackCenter = React.lazy(() => import("./pages/FeedbackCenter"));
const StudyGuidelinesMod = React.lazy(() => import("./pages/StudyGuidelinesMod"));
const OtherModerators = React.lazy(() => import("./pages/OtherModerators"));
const ProfileSettingsMod = React.lazy(() => import("./pages/ProfileSettingsMod"));

// Admin Pages
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const AdminUserManagement = React.lazy(() => import("./pages/AdminUserManagement"));
const AdminModeratorManagement = React.lazy(() => import("./pages/AdminModeratorManagement"));
const AdminContentManagement = React.lazy(() => import("./pages/AdminContentManagement"));
const AdminTagsAliasLibrary = React.lazy(() => import("./pages/AdminTagsAliasLibrary"));
const AdminStudyGuidelines = React.lazy(() => import("./pages/AdminStudyGuidelines"));
const AdminRequestCenter = React.lazy(() => import("./pages/AdminRequestCenter"));
const AdminAnalytics = React.lazy(() => import("./pages/AdminAnalytics"));
const AdminSettings = React.lazy(() => import("./pages/AdminSettings"));

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="flex h-screen items-center justify-center text-primary font-display">Loading...</div>}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />

              {/* Complete signup — authenticated but no college form */}
              <Route path="/signup/complete" element={
                <AuthGuard><CompleteSignupPage /></AuthGuard>
              } />

              {/* Student routes */}
              <Route path="/study" element={
                <AuthGuard>
                  <RoleGuard allowedRoles={['student']}>
                    <CollegeFormGuard>
                      <AppShell><StudyPage /></AppShell>
                    </CollegeFormGuard>
                  </RoleGuard>
                </AuthGuard>
              } />
              <Route path="/files/*" element={
                <AuthGuard>
                  <RoleGuard allowedRoles={['student']}>
                    <CollegeFormGuard>
                      <AppShell><FileManagerPage /></AppShell>
                    </CollegeFormGuard>
                  </RoleGuard>
                </AuthGuard>
              } />
              <Route path="/bookmarks" element={
                <AuthGuard>
                  <RoleGuard allowedRoles={['student']}>
                    <CollegeFormGuard>
                      <AppShell><BookmarksPage /></AppShell>
                    </CollegeFormGuard>
                  </RoleGuard>
                </AuthGuard>
              } />
              <Route path="/suggest" element={
                <AuthGuard>
                  <RoleGuard allowedRoles={['student']}>
                    <CollegeFormGuard>
                      <AppShell><UploadRequestPage /></AppShell>
                    </CollegeFormGuard>
                  </RoleGuard>
                </AuthGuard>
              } />
              <Route path="/settings" element={
                <AuthGuard>
                  <RoleGuard allowedRoles={['student']}>
                    <CollegeFormGuard>
                      <AppShell><ProfileSettingsPage /></AppShell>
                    </CollegeFormGuard>
                  </RoleGuard>
                </AuthGuard>
              } />
              <Route path="/chat" element={
                <AuthGuard>
                  <RoleGuard allowedRoles={['student']}>
                    <CollegeFormGuard>
                      <AppShell><ChatPlaceholder /></AppShell>
                    </CollegeFormGuard>
                  </RoleGuard>
                </AuthGuard>
              } />

              {/* Moderator routes */}
              <Route path="/moderator" element={
                <AuthGuard>
                  <RoleGuard allowedRoles={['moderator']}>
                    <CollegeFormGuard>
                      <ModeratorShell><ModeratorDashboard /></ModeratorShell>
                    </CollegeFormGuard>
                  </RoleGuard>
                </AuthGuard>
              } />
              <Route path="/moderator/browse" element={
                <AuthGuard><RoleGuard allowedRoles={['moderator']}><CollegeFormGuard><ModeratorShell><BrowseStudyMod /></ModeratorShell></CollegeFormGuard></RoleGuard></AuthGuard>
              } />
              <Route path="/moderator/files" element={
                <AuthGuard><RoleGuard allowedRoles={['moderator']}><CollegeFormGuard><ModeratorShell><FileManagerMod /></ModeratorShell></CollegeFormGuard></RoleGuard></AuthGuard>
              } />
              <Route path="/moderator/upload" element={
                <AuthGuard><RoleGuard allowedRoles={['moderator']}><CollegeFormGuard><ModeratorShell><UploadMaterial /></ModeratorShell></CollegeFormGuard></RoleGuard></AuthGuard>
              } />
              <Route path="/moderator/requests" element={
                <AuthGuard><RoleGuard allowedRoles={['moderator']}><CollegeFormGuard><ModeratorShell><StudentRequests /></ModeratorShell></CollegeFormGuard></RoleGuard></AuthGuard>
              } />
              <Route path="/moderator/bookmarks" element={
                <AuthGuard><RoleGuard allowedRoles={['moderator']}><CollegeFormGuard><ModeratorShell><BookmarksPage /></ModeratorShell></CollegeFormGuard></RoleGuard></AuthGuard>
              } />
              <Route path="/moderator/feedback" element={
                <AuthGuard><RoleGuard allowedRoles={['moderator']}><CollegeFormGuard><ModeratorShell><FeedbackCenter /></ModeratorShell></CollegeFormGuard></RoleGuard></AuthGuard>
              } />
              <Route path="/moderator/guidelines" element={
                <AuthGuard><RoleGuard allowedRoles={['moderator']}><CollegeFormGuard><ModeratorShell><StudyGuidelinesMod /></ModeratorShell></CollegeFormGuard></RoleGuard></AuthGuard>
              } />
              <Route path="/moderator/colleagues" element={
                <AuthGuard><RoleGuard allowedRoles={['moderator']}><CollegeFormGuard><ModeratorShell><OtherModerators /></ModeratorShell></CollegeFormGuard></RoleGuard></AuthGuard>
              } />
              <Route path="/moderator/settings" element={
                <AuthGuard><RoleGuard allowedRoles={['moderator']}><CollegeFormGuard><ModeratorShell><ProfileSettingsMod /></ModeratorShell></CollegeFormGuard></RoleGuard></AuthGuard>
              } />

              {/* Admin routes */}
              <Route path="/admin" element={
                <AuthGuard>
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminShell><AdminDashboard /></AdminShell>
                  </RoleGuard>
                </AuthGuard>
              } />
              <Route path="/admin/users" element={
                <AuthGuard><RoleGuard allowedRoles={['admin']}><AdminShell><AdminUserManagement /></AdminShell></RoleGuard></AuthGuard>
              } />
              <Route path="/admin/moderators" element={
                <AuthGuard><RoleGuard allowedRoles={['admin']}><AdminShell><AdminModeratorManagement /></AdminShell></RoleGuard></AuthGuard>
              } />
              <Route path="/admin/content" element={
                <AuthGuard><RoleGuard allowedRoles={['admin']}><AdminShell><AdminContentManagement /></AdminShell></RoleGuard></AuthGuard>
              } />
              <Route path="/admin/tags" element={
                <AuthGuard><RoleGuard allowedRoles={['admin']}><AdminShell><AdminTagsAliasLibrary /></AdminShell></RoleGuard></AuthGuard>
              } />
              <Route path="/admin/guidelines" element={
                <AuthGuard><RoleGuard allowedRoles={['admin']}><AdminShell><AdminStudyGuidelines /></AdminShell></RoleGuard></AuthGuard>
              } />
              <Route path="/admin/requests" element={
                <AuthGuard><RoleGuard allowedRoles={['admin']}><AdminShell><AdminRequestCenter /></AdminShell></RoleGuard></AuthGuard>
              } />
              <Route path="/admin/analytics" element={
                <AuthGuard><RoleGuard allowedRoles={['admin']}><AdminShell><AdminAnalytics /></AdminShell></RoleGuard></AuthGuard>
              } />
              <Route path="/admin/settings" element={
                <AuthGuard><RoleGuard allowedRoles={['admin']}><AdminShell><AdminSettings /></AdminShell></RoleGuard></AuthGuard>
              } />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
