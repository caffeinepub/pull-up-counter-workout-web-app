import Map "mo:core/Map";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
  type TrendDay = {
    dayStart : Time.Time;
    reps : Nat;
  };

  type UserProfile = {
    name : Text;
  };

  type DayStats = {
    reps : Nat;
    sets : Nat;
  };

  type UserStats = {
    dailyTrends : [TrendDay];
  };

  type DailyGoal = Nat;
  type Actor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    dailyStats : Map.Map<Principal, Map.Map<Nat, DayStats>>;
    userDailyGoals : Map.Map<Principal, DailyGoal>;
  };

  public func run(old : Actor) : Actor {
    old;
  };
};
