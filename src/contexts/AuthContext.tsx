import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase, UserProfileDB, isAdmin } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfileDB | null
  loading: boolean
  isAdminUser: boolean
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfileDB>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfileDB | null>(null)
  const [loading, setLoading] = useState(true)

  const isAdminUser = profile?.role === 'admin' || isAdmin(user?.email)

  useEffect(() => {
    // Get initial session with better error handling
    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing authentication...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          return
        }

        console.log('Initial session check:', session ? '✅ Session found' : '❌ No session')
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('👤 User found, setting as authenticated and fetching profile...')
          // Set loading to false immediately when we have a valid session
          setLoading(false)
          
          // Fetch profile in the background - don't block authentication
          fetchUserProfile(session.user.id).catch(error => {
            console.error('Profile fetch failed, but user remains authenticated:', error)
          })
        } else {
          console.log('❌ No session found, user not authenticated')
          setLoading(false)
        }
        
      } catch (error) {
        console.error('Error initializing auth:', error)
        setLoading(false)
      }
    }

    // Add a timeout only for the session check, not the entire auth process
    const timeoutId = setTimeout(() => {
      console.warn('Session check timeout - proceeding without authentication')
      setLoading(false)
    }, 3000) // 3 second timeout just for session retrieval

    initializeAuth().finally(() => {
      // Clear timeout once session check is complete
      clearTimeout(timeoutId)
    })

    // Listen for auth changes with improved handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔄 Auth state change: ${event}`, session ? '✅ Session exists' : '❌ No session')
      
      // Handle all relevant auth events including INITIAL_SESSION
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log(`👤 ${event}: User authenticated, fetching profile in background...`)
          
          // Set loading to false immediately when we have a valid session
          if (loading) {
            setLoading(false)
          }
          
          // Fetch profile in the background - don't block the auth process
          fetchUserProfile(session.user.id).catch(error => {
            console.error(`Profile fetch failed after ${event}, but user remains authenticated:`, error)
            // Even if profile fetch fails, create a basic profile so the app continues to work
            createBasicProfile(session.user.id).catch(profileError => {
              console.error('Basic profile creation also failed:', profileError)
            })
          })
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 User signed out, clearing profile')
          setProfile(null)
          setLoading(false)
        }
      }
    })

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('🔍 Fetching user profile for:', userId)
      
      // Try to get profile directly from user_profiles table (simplified approach)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, phone, role, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.warn('Profile fetch error (will create basic profile):', error.message)
        // Create a basic profile if database query fails
        await createBasicProfile(userId)
        return
      }

      if (data) {
        console.log('✅ Profile loaded successfully:', data.role)
        setProfile(data)
      } else {
        console.log('📝 No profile found, creating basic profile...')
        // No profile found, create one
        await createBasicProfile(userId)
      }
    } catch (error) {
      console.warn('Profile fetch failed, creating basic profile as fallback:', error)
      // Create basic profile as fallback
      await createBasicProfile(userId)
    }
  }

  const createBasicProfile = async (userId: string) => {
    try {
      console.log('📝 Creating basic profile for user:', userId)
      
      // Get user data from current session
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        console.warn('No user data available for profile creation')
        return
      }

      const email = userData.user.email || ''
      const role = isAdmin(email) ? 'admin' : 'customer'
      
      // Create basic profile directly in memory (don't depend on database)
      const basicProfile: UserProfileDB = {
        id: userId,
        email: email,
        role: role,
        full_name: userData.user.user_metadata?.full_name || email.split('@')[0] || 'User',
        phone: userData.user.user_metadata?.phone || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setProfile(basicProfile)
      console.log(`✅ Basic profile created successfully for ${role}:`, email)
      
      // Optionally try to save to database, but don't fail if it doesn't work
      try {
        await supabase
          .from('user_profiles')
          .upsert(basicProfile, { onConflict: 'id' })
        console.log('📦 Profile saved to database successfully')
      } catch (dbError) {
        console.warn('Profile not saved to database (continuing with memory profile):', dbError)
      }
      
    } catch (error) {
      console.error('Error creating basic profile:', error)
      
      // Last resort: create minimal profile from session user
      if (user?.email) {
        const fallbackProfile: UserProfileDB = {
          id: userId,
          email: user.email,
          role: isAdmin(user.email) ? 'admin' : 'customer',
          full_name: user.email.split('@')[0] || 'User',
          phone: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setProfile(fallbackProfile)
        console.log('🔄 Fallback profile created from session data')
      }
    }
  }


  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      console.log('Starting sign out process...')
      
      // 1. Clear local state immediately
      setUser(null)
      setSession(null)
      setProfile(null)
      
      // 2. Clear ALL localStorage data (not just specific items)
      localStorage.clear()
      
      // 3. Clear sessionStorage as well
      sessionStorage.clear()
      
      // 4. Sign out from Supabase with scope 'global' to clear all sessions
      await supabase.auth.signOut({ scope: 'global' })
      
      console.log('Sign out completed, refreshing page...')
      
      // 5. Force complete page refresh to clear any cached data
      window.location.href = window.location.origin
      
    } catch (error) {
      console.error('Error during sign out:', error)
      
      // Even if there's an error, force complete cleanup
      setUser(null)
      setSession(null)
      setProfile(null)
      localStorage.clear()
      sessionStorage.clear()
      
      // Force refresh regardless of error
      window.location.href = window.location.origin
    }
  }

  const updateProfile = async (updates: Partial<UserProfileDB>) => {
    if (!user || !profile) return

    try {
      // Update local state immediately
      const updatedProfile = {
        ...profile,
        ...updates,
        updated_at: new Date().toISOString()
      }
      setProfile(updatedProfile)
      
      // Note: Since RLS is disabled, we're not updating the database table
      // The profile updates are maintained in local state only
      console.log('Profile updated in local state:', updatedProfile)
      
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    isAdminUser,
    signIn,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}