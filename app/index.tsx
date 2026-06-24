import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootStackParamList } from '@/navigation/types';

import { WelcomeScreen } from '@/screens/onboarding/WelcomeScreen';
import { AccountTypeScreen } from '@/screens/onboarding/AccountTypeScreen';
import { CreateAccountScreen } from '@/screens/onboarding/CreateAccountScreen';
import { VerifyPhoneScreen } from '@/screens/onboarding/VerifyPhoneScreen';
import { SpecialtyScreen } from '@/screens/onboarding/SpecialtyScreen';
import { BusinessDetailsScreen } from '@/screens/onboarding/BusinessDetailsScreen';
import { AllSetScreen } from '@/screens/onboarding/AllSetScreen';
import { ProHomeScreen } from '@/screens/pro/ProHomeScreen';
import { ClientHomeScreen } from '@/screens/client/ClientHomeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Welcome">
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="AccountType" component={AccountTypeScreen} />
            <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
            <Stack.Screen name="VerifyPhone" component={VerifyPhoneScreen} />
            <Stack.Screen name="Specialty" component={SpecialtyScreen} />
            <Stack.Screen name="BusinessDetails" component={BusinessDetailsScreen} />
            <Stack.Screen name="ProAllSet" component={AllSetScreen} />
            <Stack.Screen name="ProHome" component={ProHomeScreen} />
            <Stack.Screen name="ClientHome" component={ClientHomeScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
