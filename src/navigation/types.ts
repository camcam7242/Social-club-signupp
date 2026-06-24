export type RootStackParamList = {
  Welcome: undefined;
  AccountType: undefined;
  CreateAccount: { role: 'pro' | 'client' };
  VerifyPhone: { role: 'pro' | 'client' };
  // Pro onboarding
  Specialty: undefined;
  BusinessDetails: undefined;
  ServicesAndPricing: undefined;
  Availability: undefined;
  Portfolio: undefined;
  ConnectPayouts: undefined;
  Membership: undefined;
  PromoUnlocked: undefined;
  ProAllSet: undefined;
  // Pro main app
  ProHome: undefined;
  // Client onboarding
  ClientSignUp: undefined;
  // Client main app
  ClientHome: undefined;
};
