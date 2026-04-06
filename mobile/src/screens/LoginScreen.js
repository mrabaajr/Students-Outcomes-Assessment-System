import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { API_BASE_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";

export default function LoginScreen() {
  const { signIn, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }

    if (!selectedRole) {
      setError("Select your role to continue.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const user = await signIn(email.trim(), password);
      const actualRole = String(user?.role || "").toLowerCase();

      if (actualRole !== selectedRole) {
        await signOut();
        throw new Error(
          `This account is ${actualRole === "admin" ? "Program Chair" : "Faculty"}. Please select the correct role.`
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Unable to sign in. Check your API URL and credentials."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.diagonalStripe} />
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>WELCOME{"\n"}BACK</Text>
              <Text style={styles.heroSubtitle}>
                Sign in to access your account and continue your journey with us.
              </Text>
            </View>
          </View>

          <View style={styles.formArea}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.sectionLabel}>Select your role to continue</Text>

            <View style={styles.roleRow}>
              <Pressable
                onPress={() => setSelectedRole("admin")}
                style={[
                  styles.roleCard,
                  selectedRole === "admin" ? styles.roleCardActive : null,
                ]}
              >
                <Text style={styles.roleIcon}>◉</Text>
                <Text
                  style={[
                    styles.roleText,
                    selectedRole === "admin" ? styles.roleTextActive : null,
                  ]}
                >
                  Program Chair
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedRole("staff")}
                style={[
                  styles.roleCard,
                  selectedRole === "staff" ? styles.roleCardActive : null,
                ]}
              >
                <Text style={styles.roleIcon}>◔</Text>
                <Text
                  style={[
                    styles.roleText,
                    selectedRole === "staff" ? styles.roleTextActive : null,
                  ]}
                >
                  Faculty
                </Text>
              </Pressable>
            </View>

            <Text style={styles.testLabel}>This app talks to your existing Django API at:</Text>
            <Text style={styles.apiUrl}>{API_BASE_URL}</Text>

            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Email Address"
              placeholderTextColor={colors.gray}
              style={styles.input}
              value={email}
            />

            <View style={styles.passwordWrap}>
              <TextInput
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={colors.gray}
                secureTextEntry={!showPassword}
                style={styles.passwordInput}
                value={password}
              />
              <Pressable onPress={() => setShowPassword((value) => !value)} style={styles.eyeButton}>
                <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
              </Pressable>
            </View>

            <Pressable style={styles.forgotButton}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            <Pressable
              disabled={isSubmitting || !selectedRole}
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.button,
                (pressed && !isSubmitting) || (!selectedRole && styles.buttonDisabled)
                  ? styles.buttonPressed
                  : null,
                !selectedRole ? styles.buttonDisabled : null,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.dark} />
              ) : (
                <Text style={styles.buttonText}>
                  Sign in as {selectedRole === "admin" ? "Program Chair" : selectedRole === "staff" ? "Faculty" : "..."}
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    backgroundColor: colors.dark,
    minHeight: 260,
    overflow: "hidden",
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 32,
  },
  diagonalStripe: {
    position: "absolute",
    top: 26,
    left: -80,
    width: "150%",
    height: 120,
    backgroundColor: colors.yellow,
    transform: [{ rotate: "-28deg" }],
  },
  heroContent: {
    marginTop: 58,
  },
  heroTitle: {
    color: colors.surface,
    fontSize: 46,
    fontWeight: "800",
    lineHeight: 46,
    letterSpacing: 0.4,
  },
  heroSubtitle: {
    color: colors.surface,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 14,
    maxWidth: 280,
  },
  formArea: {
    backgroundColor: "#f6f4fb",
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 28,
  },
  errorBanner: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorBannerText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionLabel: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 12,
  },
  roleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  roleCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 16,
  },
  roleCardActive: {
    borderColor: colors.yellow,
    borderWidth: 2,
  },
  roleIcon: {
    color: colors.yellowAlt,
    fontSize: 18,
    marginBottom: 8,
  },
  roleText: {
    color: colors.gray,
    fontSize: 13,
    fontWeight: "600",
  },
  roleTextActive: {
    color: colors.dark,
  },
  testLabel: {
    color: colors.dark,
    fontSize: 13,
    marginBottom: 4,
  },
  apiUrl: {
    color: "#008080",
    fontSize: 13,
    marginBottom: 18,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: "#777777",
    borderRadius: 10,
    borderWidth: 1,
    color: colors.dark,
    fontSize: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  passwordWrap: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: "#777777",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 10,
    paddingRight: 12,
  },
  passwordInput: {
    color: colors.dark,
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  eyeButton: {
    paddingVertical: 6,
  },
  eyeText: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginBottom: 18,
  },
  forgotText: {
    color: colors.yellowAlt,
    fontSize: 13,
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.yellow,
    borderRadius: 14,
    paddingVertical: 16,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "700",
  },
});
