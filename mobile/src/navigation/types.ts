// Navigation param lists (typed routes).

export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  CustomerRegister: undefined;
};

export type CustomerStackParamList = {
  CustomerHome: undefined;
  RequestRepair: undefined;
  JobStatus: { jobId: string };
};

export type MechanicStackParamList = {
  MechanicHome: undefined;
  JobFeed: undefined;
  JobDetail: { jobId: string };
};

export type AdminStackParamList = {
  AdminHome: undefined;
};
