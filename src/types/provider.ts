export interface StreamingProviderDto {
  providerId: number | null;
  providerName: string;
  logoPath: string | null;
  displayPriority: number;
}

export interface UserSubscriptionDto {
  userId: number;
  providerId: number;
  providerName: string;
  priority: number;
  logoPath: string | null;
}

export interface WatchProvider {
  providerId: number;
  providerName: string;
  logoPath: string;
  link?: string;
}
