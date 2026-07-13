"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface FollowState {
  following: boolean;
  setFollowing: (following: boolean) => void;
}

const FollowStateContext = createContext<FollowState | null>(null);

/** Wraps sibling follow controls (e.g. the byline FollowButton and a
 *  follower-gated GetPackButton) so a follow from either one shows up
 *  in both immediately, no refresh. Consumers outside a provider fall
 *  back to their own local state, unchanged. */
export function FollowStateProvider({
  initiallyFollowing,
  children,
}: {
  initiallyFollowing: boolean;
  children: ReactNode;
}) {
  const [following, setFollowing] = useState(initiallyFollowing);
  return (
    <FollowStateContext.Provider value={{ following, setFollowing }}>
      {children}
    </FollowStateContext.Provider>
  );
}

export function useSharedFollowState(): FollowState | null {
  return useContext(FollowStateContext);
}
