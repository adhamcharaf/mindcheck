import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { COLORS } from '../utils/constants';

// Auth screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import LoginScreen from '../screens/auth/LoginScreen';

// Onboarding screens
import OnboardingScreen1 from '../screens/onboarding/OnboardingScreen1';
import OnboardingScreen2 from '../screens/onboarding/OnboardingScreen2';
import OnboardingScreen3 from '../screens/onboarding/OnboardingScreen3';
import OnboardingScreen4 from '../screens/onboarding/OnboardingScreen4';
import OnboardingScreen5 from '../screens/onboarding/OnboardingScreen5';

// Recording flow screens
import FirstRecordingScreen from '../screens/recording/FirstRecordingScreen';
import LoadingScreen from '../screens/recording/LoadingScreen';
import MoodScreen from '../screens/recording/MoodScreen';
import InsightScreen from '../screens/recording/InsightScreen';

// Paywall screen
import PaywallScreen from '../screens/paywall/PaywallScreen';

// Main screens
import HomeScreen from '../screens/home/HomeScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import SessionDetailScreen from '../screens/calendar/SessionDetailScreen';
import SessionListScreen from '../screens/sessions/SessionListScreen';
import StatsScreen from '../screens/stats/StatsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

import { RootStackParamList, MainTabParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Auth Stack Navigator
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

// Onboarding Stack Navigator (forward-only, no back button)
function OnboardingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Disable swipe back gesture
      }}
    >
      <Stack.Screen
        name="Onboarding1"
        component={OnboardingScreen1}
        options={{ headerLeft: () => null }} // Disable back button
      />
      <Stack.Screen
        name="Onboarding2"
        component={OnboardingScreen2}
        options={{ headerLeft: () => null }}
      />
      <Stack.Screen
        name="Onboarding3"
        component={OnboardingScreen3}
        options={{ headerLeft: () => null }}
      />
      <Stack.Screen
        name="Onboarding4"
        component={OnboardingScreen4}
        options={{ headerLeft: () => null }}
      />
      <Stack.Screen
        name="Onboarding5"
        component={OnboardingScreen5}
        options={{ headerLeft: () => null }}
      />
      <Stack.Screen
        name="FirstRecording"
        component={FirstRecordingScreen}
        options={{ headerLeft: () => null }}
      />
      <Stack.Screen
        name="Loading"
        component={LoadingScreen}
        options={{ headerLeft: () => null }}
      />
      <Stack.Screen
        name="Mood"
        component={MoodScreen}
        options={{ headerLeft: () => null }}
      />
      <Stack.Screen
        name="Insight"
        component={InsightScreen}
        options={{ headerLeft: () => null }}
      />
      <Stack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{ headerLeft: () => null }}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.backgroundDark,
          borderTopColor: COLORS.primary,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: COLORS.backgroundDark,
          height: 60,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          color: COLORS.text,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Accueil',
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: 'Calendrier',
          tabBarLabel: 'Calendrier',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          title: 'Statistiques',
          tabBarLabel: 'Stats',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Paramètres',
          tabBarLabel: 'Réglages',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main Stack Navigator (wraps tabs to allow modals and recording flow)
function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} />

      {/* Session Detail Modal */}
      <Stack.Screen
        name="SessionDetail"
        component={SessionDetailScreen}
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Détails de la session',
          headerStyle: {
            backgroundColor: COLORS.backgroundDark,
          },
          headerTintColor: COLORS.text,
          headerTitleStyle: {
            color: COLORS.text,
          },
        }}
      />

      {/* Session List */}
      <Stack.Screen
        name="SessionList"
        component={SessionListScreen}
        options={{
          headerShown: true,
          title: 'Mes sessions',
          headerStyle: {
            backgroundColor: COLORS.backgroundDark,
          },
          headerTintColor: COLORS.text,
          headerTitleStyle: {
            color: COLORS.text,
          },
        }}
      />

      {/* Recording Flow (accessible after onboarding) */}
      <Stack.Screen
        name="FirstRecording"
        component={FirstRecordingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Loading"
        component={LoadingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Mood"
        component={MoodScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Insight"
        component={InsightScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Root Navigator with conditional rendering
export default function Navigation() {
  const { isAuth, isLoading, user } = useAuthStore();

  if (isLoading) {
    // Could add a proper loading screen here
    return null;
  }

  // Auth guards:
  // - Not authenticated → AuthStack
  // - Authenticated + onboarding not done → OnboardingStack
  // - Authenticated + onboarding done → MainTabs

  if (!isAuth) {
    return (
      <NavigationContainer>
        <AuthStack />
      </NavigationContainer>
    );
  }

  // Show onboarding if user hasn't completed it
  if (user && !user.onboarding_completed) {
    return (
      <NavigationContainer>
        <OnboardingStack />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <MainStack />
    </NavigationContainer>
  );
}
