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
import { ServicesAndPricingScreen } from '@/screens/onboarding/ServicesAndPricingScreen';
import { AvailabilityScreen } from '@/screens/onboarding/AvailabilityScreen';
import { PortfolioScreen } from '@/screens/onboarding/PortfolioScreen';
import { ConnectPayoutsScreen } from '@/screens/onboarding/ConnectPayoutsScreen';
import { MembershipScreen } from '@/screens/onboarding/MembershipScreen';
import { ProHomeScreen } from '@/screens/pro/ProHomeScreen';
import { EarningsScreen } from '@/screens/pro/EarningsScreen';
import { ClientHomeScreen } from '@/screens/client/ClientHomeScreen';
import { ProProfileScreen } from '@/screens/booking/ProProfileScreen';
import { PickTimeScreen } from '@/screens/booking/PickTimeScreen';
import { CancellationPolicyScreen } from '@/screens/booking/CancellationPolicyScreen';
import { ConfirmBookingScreen } from '@/screens/booking/ConfirmBookingScreen';
import { ChatScreen } from '@/screens/booking/ChatScreen';
import { AddTipScreen } from '@/screens/booking/AddTipScreen';
import { RateProScreen } from '@/screens/booking/RateProScreen';

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
            <Stack.Screen name="ServicesAndPricing" component={ServicesAndPricingScreen} />
            <Stack.Screen name="Availability" component={AvailabilityScreen} />
            <Stack.Screen name="Portfolio" component={PortfolioScreen} />
            <Stack.Screen name="ConnectPayouts" component={ConnectPayoutsScreen} />
            <Stack.Screen name="Membership" component={MembershipScreen} />
            <Stack.Screen name="ProAllSet" component={AllSetScreen} />
            <Stack.Screen name="ProHome" component={ProHomeScreen} />
            <Stack.Screen name="Earnings" component={EarningsScreen} />
            <Stack.Screen name="ClientHome" component={ClientHomeScreen} />
            <Stack.Screen name="ProProfile" component={ProProfileScreen} />
            <Stack.Screen name="PickTime" component={PickTimeScreen} />
            <Stack.Screen name="CancellationPolicy" component={CancellationPolicyScreen} />
            <Stack.Screen name="ConfirmBooking" component={ConfirmBookingScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="AddTip" component={AddTipScreen} />
            <Stack.Screen name="RatePro" component={RateProScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
