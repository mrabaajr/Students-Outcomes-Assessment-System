import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import AppScreen from "../components/layout/AppScreen";
import InfoCard from "../components/ui/InfoCard";
import { useAuth } from "../context/AuthContext";
import { changePassword, createFacultyAccount } from "../services/usersMobile";
import { colors } from "../theme/colors";

function FacultyAccountModal({ visible, onClose, onCreated }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleCreate() {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !passwordConfirmation) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      const result = await createFacultyAccount({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        department: department.trim(),
        password,
      });
      setSuccess("Faculty account created successfully.");
      onCreated?.(result);
      setFirstName("");
      setLastName("");
      setEmail("");
      setDepartment("");
      setPassword("");
      setPasswordConfirmation("");
    } catch (createError) {
      setError(createError.response?.data?.detail || "Failed to create faculty account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Create Faculty Account</Text>
          <Text style={styles.modalSubtitle}>
            Create a staff account with the same required fields used on the web app.
          </Text>

          {success ? (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{success}</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalFormStack}
            showsVerticalScrollIndicator={false}
          >
            <View>
              <Text style={styles.modalFieldLabel}>First Name</Text>
              <TextInput
                onChangeText={setFirstName}
                placeholder="Enter first name"
                placeholderTextColor={colors.gray}
                style={styles.input}
                value={firstName}
              />
            </View>

            <View>
              <Text style={styles.modalFieldLabel}>Last Name</Text>
              <TextInput
                onChangeText={setLastName}
                placeholder="Enter last name"
                placeholderTextColor={colors.gray}
                style={styles.input}
                value={lastName}
              />
            </View>

            <View>
              <Text style={styles.modalFieldLabel}>Email</Text>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="Enter email address"
                placeholderTextColor={colors.gray}
                style={styles.input}
                value={email}
              />
            </View>

            <View>
              <Text style={styles.modalFieldLabel}>Department</Text>
              <TextInput
                onChangeText={setDepartment}
                placeholder="Enter department"
                placeholderTextColor={colors.gray}
                style={styles.input}
                value={department}
              />
            </View>

            <View>
              <Text style={styles.modalFieldLabel}>Password</Text>
              <TextInput
                onChangeText={setPassword}
                placeholder="Enter password (min. 8 characters)"
                placeholderTextColor={colors.gray}
                secureTextEntry
                style={styles.input}
                value={password}
              />
            </View>

            <View>
              <Text style={styles.modalFieldLabel}>Confirm Password</Text>
              <TextInput
                onChangeText={setPasswordConfirmation}
                placeholder="Re-enter password"
                placeholderTextColor={colors.gray}
                secureTextEntry
                style={styles.input}
                value={passwordConfirmation}
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Close</Text>
            </Pressable>
            <Pressable onPress={handleCreate} style={styles.primaryButton} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.dark} />
              ) : (
                <Text style={styles.primaryButtonText}>Create Account</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function SettingsScreen() {
  const { session, user } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showFacultyModal, setShowFacultyModal] = useState(false);

  const isProgramChair = session.userRole === "admin";

  useEffect(() => {
    setEmail(user?.email || "");
  }, [user?.email]);

  const securityTips = useMemo(
    () => [
      "Use a unique password not used on other accounts",
      "Include uppercase, lowercase, numbers, and symbols",
      "Avoid using personal information",
      "Never share your password with anyone",
      "Update it regularly for better security",
    ],
    []
  );

  async function handleSubmit() {
    setErrorMessage("");
    setSuccessMessage("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMessage("All password fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await changePassword({
        currentPassword: oldPassword,
        newPassword,
        confirmPassword,
      });
      setSuccessMessage(result.message || "Password updated successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setErrorMessage(error.response?.data?.detail || error.message || "Failed to update password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <AppScreen
        title={"Account\nSettings"}
        subtitle="Manage your password and account security settings."
      >
        <View style={styles.grid}>
          <View style={styles.mainColumn}>
            <InfoCard title="Change Password">
              <Text style={styles.mutedText}>
                Update your password to keep your account secure. Use a strong password with at least 8 characters.
              </Text>

              {successMessage ? (
                <View style={styles.successBanner}>
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              ) : null}

              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <View style={styles.formStack}>
                <View>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.gray}
                    editable={false}
                    style={[styles.input, styles.disabledInput]}
                    value={email}
                  />
                  <Text style={styles.helperText}>This is the email attached to your signed-in account.</Text>
                </View>

                <View>
                  <Text style={styles.fieldLabel}>Current Password</Text>
                  <TextInput
                    onChangeText={setOldPassword}
                    placeholder="Enter your current password"
                    placeholderTextColor={colors.gray}
                    secureTextEntry
                    style={styles.input}
                    value={oldPassword}
                  />
                </View>

                <View>
                  <Text style={styles.fieldLabel}>New Password</Text>
                  <TextInput
                    onChangeText={setNewPassword}
                    placeholder="Enter a new password (min. 8 characters)"
                    placeholderTextColor={colors.gray}
                    secureTextEntry
                    style={styles.input}
                    value={newPassword}
                  />
                  <Text style={styles.helperText}>
                    Use a mix of uppercase, lowercase, numbers, and symbols for stronger security.
                  </Text>
                </View>

                <View>
                  <Text style={styles.fieldLabel}>Confirm New Password</Text>
                  <TextInput
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter your new password"
                    placeholderTextColor={colors.gray}
                    secureTextEntry
                    style={styles.input}
                    value={confirmPassword}
                  />
                </View>

                <Pressable
                  disabled={submitting}
                  onPress={handleSubmit}
                  style={[styles.updateButton, submitting && styles.disabledButton]}
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.dark} />
                  ) : (
                    <Text style={styles.updateButtonText}>Update Password</Text>
                  )}
                </Pressable>
              </View>

              {isProgramChair ? (
                <View style={styles.facultySection}>
                  <Text style={styles.sectionTitle}>Faculty Account Management</Text>
                  <Text style={styles.mutedText}>
                    Create new faculty accounts with a single action.
                  </Text>
                  <Pressable onPress={() => setShowFacultyModal(true)} style={styles.darkButton}>
                    <Text style={styles.darkButtonText}>Create an Account for Faculty</Text>
                  </Pressable>
                </View>
              ) : null}
            </InfoCard>
          </View>

          <View style={styles.sideColumn}>
            <InfoCard title="Security Tips">
              <View style={styles.tipsList}>
                {securityTips.map((tip) => (
                  <View key={tip} style={styles.tipRow}>
                    <Text style={styles.tipMark}>+</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </InfoCard>
          </View>
        </View>
      </AppScreen>

      <FacultyAccountModal
        onClose={() => setShowFacultyModal(false)}
        onCreated={() => {
          setSuccessMessage("Faculty account created successfully.");
        }}
        visible={showFacultyModal}
      />
    </>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 16,
  },
  mainColumn: {
    gap: 16,
  },
  sideColumn: {
    gap: 16,
  },
  mutedText: {
    color: colors.gray,
    fontSize: 14,
    lineHeight: 20,
  },
  formStack: {
    gap: 16,
    marginTop: 20,
  },
  fieldLabel: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.graySoft,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.dark,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  disabledInput: {
    backgroundColor: colors.surfaceMuted,
    color: colors.darkAlt,
  },
  helperText: {
    color: colors.gray,
    fontSize: 12,
    marginTop: 6,
  },
  updateButton: {
    alignItems: "center",
    backgroundColor: colors.yellow,
    borderRadius: 12,
    marginTop: 4,
    paddingVertical: 14,
  },
  updateButtonText: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.6,
  },
  facultySection: {
    borderTopColor: colors.graySoft,
    borderTopWidth: 1,
    gap: 10,
    marginTop: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    color: colors.dark,
    fontSize: 17,
    fontWeight: "800",
  },
  darkButton: {
    alignItems: "center",
    backgroundColor: colors.darkAlt,
    borderRadius: 12,
    marginTop: 4,
    paddingVertical: 14,
  },
  darkButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "700",
  },
  tipsList: {
    gap: 12,
  },
  tipRow: {
    flexDirection: "row",
    gap: 10,
  },
  tipMark: {
    color: colors.yellowAlt,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 20,
  },
  tipText: {
    color: colors.gray,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  successBanner: {
    backgroundColor: "#dcfce7",
    borderColor: "#86efac",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  successText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  errorBanner: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  modalOverlay: {
    backgroundColor: "rgba(0,0,0,0.45)",
    flex: 1,
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    maxHeight: "88%",
    padding: 20,
  },
  modalTitle: {
    color: colors.dark,
    fontSize: 20,
    fontWeight: "800",
  },
  modalSubtitle: {
    color: colors.gray,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  modalScroll: {
    marginTop: 16,
    maxHeight: 280,
  },
  modalFormStack: {
    gap: 14,
    paddingBottom: 4,
  },
  modalFieldLabel: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    flex: 1,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "700",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.yellow,
    borderRadius: 12,
    flex: 1,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "800",
  },
});
