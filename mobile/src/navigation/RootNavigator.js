import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "../context/AuthContext";
import FacultyClassesScreen from "../screens/FacultyClassesScreen";
import FacultyAssessmentsScreen, {
  FacultyAssessmentEntryScreen,
} from "../screens/FacultyAssessmentsScreen";
import FacultyDashboardScreen from "../screens/FacultyDashboardScreen";
import FacultyPastReportsScreen from "../screens/FacultyPastReportsScreen";
import FacultyReportsScreen from "../screens/FacultyReportsScreen";
import LoginScreen from "../screens/LoginScreen";
import PlaceholderScreen from "../screens/PlaceholderScreen";
import ProgramChairAssessmentsScreen, {
  ProgramChairAssessmentEntryScreen,
} from "../screens/ProgramChairAssessmentsScreen";
import ProgramChairClassesScreen from "../screens/ProgramChairClassesScreen";
import ProgramChairCoursesScreen from "../screens/ProgramChairCoursesScreen";
import ProgramChairDashboardScreen from "../screens/ProgramChairDashboardScreen";
import ProgramChairPastReportsScreen from "../screens/ProgramChairPastReportsScreen";
import ProgramChairReportsScreen from "../screens/ProgramChairReportsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ProgramChairStudentOutcomesScreen, {
  ProgramChairOutcomeRubricScreen,
} from "../screens/ProgramChairStudentOutcomesScreen";
import { colors } from "../theme/colors";

const Stack = createNativeStackNavigator();

function SplashScreen() {
  return (
    <View style={styles.splash}>
      <ActivityIndicator size="large" color={colors.yellow} />
    </View>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, isBootstrapping, session } = useAuth();

  if (isBootstrapping) {
    return <SplashScreen />;
  }

  const isProgramChair = session.userRole === "admin";

  return (
    <Stack.Navigator
      screenOptions={{
        headerBackTitleVisible: false,
        headerShadowVisible: false,
        headerTintColor: colors.dark,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : isProgramChair ? (
        <>
          <Stack.Screen
            name="ProgramChairDashboard"
            component={ProgramChairDashboardScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProgramChairCourses"
            component={ProgramChairCoursesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProgramChairClasses"
            component={ProgramChairClassesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProgramChairStudentOutcomes"
            component={ProgramChairStudentOutcomesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProgramChairOutcomeRubric"
            component={ProgramChairOutcomeRubricScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProgramChairAssessments"
            component={ProgramChairAssessmentsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProgramChairAssessmentEntry"
            component={ProgramChairAssessmentEntryScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProgramChairReports"
            component={ProgramChairReportsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProgramChairPastReports"
            component={ProgramChairPastReportsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProgramChairSettings"
            component={SettingsScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="FacultyDashboard"
            component={FacultyDashboardScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="FacultyClasses"
            component={FacultyClassesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="FacultyAssessments"
            component={FacultyAssessmentsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="FacultyAssessmentEntry"
            component={FacultyAssessmentEntryScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="FacultyReports"
            component={FacultyReportsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="FacultyPastReports"
            component={FacultyPastReportsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="FacultySettings"
            component={SettingsScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
