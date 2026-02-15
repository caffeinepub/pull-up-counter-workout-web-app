import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let daysInMicros = 60 * 1000000 * 60 * 24;

  public type TrendDay = {
    dayStart : Time.Time;
    reps : Nat;
  };

  public type UserProfile = {
    name : Text;
  };

  public type DayStats = {
    reps : Nat;
    sets : Nat;
  };

  public type UserStats = {
    dailyTrends : [TrendDay];
  };

  public type DailyGoal = Nat;

  let userProfiles = Map.empty<Principal, UserProfile>();
  let dailyStats = Map.empty<Principal, Map.Map<Nat, DayStats>>();
  let userDailyGoals = Map.empty<Principal, DailyGoal>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  func getUserDayStatsMap(user : Principal) : Map.Map<Nat, DayStats> {
    switch (dailyStats.get(user)) {
      case (?stats) { stats };
      case (null) { Map.empty<Nat, DayStats>() };
    };
  };

  public query ({ caller }) func getDayTotal(dayStamp : Nat) : async ?Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be signed in to query daily totals");
    };
    switch (getUserDayStatsMap(caller).get(dayStamp)) {
      case (?stats) { ?stats.reps };
      case (null) { null };
    };
  };

  public query ({ caller }) func getDayStats(dayStamp : Nat) : async ?DayStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be signed in to query daily stats");
    };
    getUserDayStatsMap(caller).get(dayStamp);
  };

  public query ({ caller }) func getDayTotalForUser(user : Principal, dayStamp : Nat) : async ?Nat {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own stats");
    };
    switch (getUserDayStatsMap(user).get(dayStamp)) {
      case (?stats) { ?stats.reps };
      case (null) { null };
    };
  };

  public query ({ caller }) func getDayStatsForUser(user : Principal, dayStamp : Nat) : async ?DayStats {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own stats");
    };
    getUserDayStatsMap(user).get(dayStamp);
  };

  public query ({ caller }) func getTodayTotal(_ : ()) : async ?Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be signed in to query daily totals");
    };
    let dayStamp = Int.abs(Time.now() / daysInMicros : Int) % 1000000;
    switch (getUserDayStatsMap(caller).get(dayStamp)) {
      case (?stats) { ?stats.reps };
      case (null) { null };
    };
  };

  public query ({ caller }) func getTodayStats(_ : ()) : async ?DayStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be signed in to query daily stats");
    };
    let dayStamp = Int.abs(Time.now() / daysInMicros : Int) % 1000000;
    getUserDayStatsMap(caller).get(dayStamp);
  };

  public shared ({ caller }) func incrementTodayTotal(reps : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be signed in to increment daily totals");
    };

    let dayStamp = Int.abs((Time.now() / daysInMicros : Int)) % 1000000;
    let userDayStatsMap = getUserDayStatsMap(caller);
    let currentStats = switch (userDayStatsMap.get(dayStamp)) {
      case (?stats) { stats };
      case (null) { { reps = 0; sets = 0 } };
    };
    let newStats = {
      reps = currentStats.reps + reps;
      sets = currentStats.sets + 1;
    };

    let updatedStats = getUserDayStatsMap(caller);
    updatedStats.add(dayStamp, newStats);
    dailyStats.add(caller, updatedStats);
    newStats.reps;
  };

  public shared ({ caller }) func _resetDailyStats(_ : ()) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin should be able to reset daily totals");
    };
    dailyStats.clear();
    userDailyGoals.clear();
  };

  public query ({ caller }) func hasEntriesToday(_ : ()) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be signed in to check daily totals");
    };
    let dayStamp = Int.abs(Time.now() / daysInMicros : Int) % 1000000;
    switch (getUserDayStatsMap(caller).get(dayStamp)) {
      case (?stats) { stats.reps > 0 };
      case (null) { false };
    };
  };

  public query ({ caller }) func getUserStats() : async UserStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be signed in to view stats");
    };

    let dailyStats = getUserDayStatsMap(caller);

    var dailyTrends : [TrendDay] = [];
    for (i in Nat.range(0, 7)) {
      let dayStart = Time.now() - (i * daysInMicros);
      let dayStamp = Int.abs((dayStart / daysInMicros : Int)) % 1000000;

      let reps = switch (dailyStats.get(dayStamp)) {
        case (?stats) { stats.reps };
        case (null) { 0 };
      };

      let trendDay : TrendDay = {
        dayStart;
        reps;
      };
      dailyTrends := dailyTrends.concat([trendDay]);
    };

    { dailyTrends };
  };

  public shared ({ caller }) func setTodayGoal(goal : DailyGoal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be signed in to set daily goal");
    };

    userDailyGoals.add(caller, goal);
  };

  public query ({ caller }) func getTodayGoal(_ : ()) : async ?DailyGoal {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be signed in to get daily goal");
    };

    userDailyGoals.get(caller);
  };
};
