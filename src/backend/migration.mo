import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  public type Actor = {
    userProfiles : Map.Map<Principal, { name : Text }>;
    dailyStats : Map.Map<Principal, Map.Map<Nat, { reps : Nat; sets : Nat }>>;
    userDailyGoals : Map.Map<Principal, Nat>;
  };

  public func run(old : Actor) : Actor {
    old;
  };
};
