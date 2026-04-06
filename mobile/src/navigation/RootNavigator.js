import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "../context/AuthContext";
import FacultyClassesScreen from "../screens/FacultyClassesScreen";
import FacultyDashboardScreen from "../screens/FacultyDashboardScreen";
import LoginScreen from "../screens/LoginScreen";
import ProgramChairClassesScreen from "../screens/ProgramChairClassesScreen";
import ProgramChairCoursesScreen from "../screens/ProgramChairCoursesScreen";
import ProgramChairDashboardScreen from "../screens/ProgramChairDashboardScreen";

const Stack = createNativeStackNavigator();

function SplashScreen() {
  return (
    <View style={styles.splash}>
      <ActivityIndicator size="large" color="#0f766e" />
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
        headerTintColor: "#10211d",
        headerStyle: { backgroundColor: "#f4f8f7" },
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
            options={{ title: "Courses" }}
          />
          <Stack.Screen
            name="ProgramChairClasses"
            component={ProgramChairClassesScreen}
            options={{ title: "Classes" }}
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
            options={{ title: "My Classes" }}
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
    backgroundColor: "#f8fafc",
  },
});
