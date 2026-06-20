interface PendoVisitor {
  id: string;
  email?: string;
  full_name?: string;
  clerkId?: string;
  profileImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Pendo {
  initialize(options: { visitor: PendoVisitor }): void;
  identify(options: { visitor: PendoVisitor }): void;
  clearSession(): void;
  track(eventName: string, properties?: Record<string, unknown>): void;
}

declare global {
  const pendo: Pendo | undefined;
}

export {};
