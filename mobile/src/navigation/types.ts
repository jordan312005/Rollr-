// Navigation param lists (typed routes).

export type AuthStackParamList = {
  Welcome: undefined;
  CustomerLogin: undefined;
  CustomerRegister: undefined;
  MechanicLogin: undefined;
  AdminLogin: undefined;
};

export type CustomerStackParamList = {
  CustomerHome: undefined;
  RequestRepair: undefined;
  JobStatus: { jobId: string };
};

export type MechanicStackParamList = {
  MechanicHome: undefined;
};

export type AdminStackParamList = {
  AdminHome: undefined;
};
