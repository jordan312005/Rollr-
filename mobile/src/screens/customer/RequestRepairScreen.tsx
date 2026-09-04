import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/ScreenContainer';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useAuth } from '../../hooks/useAuth';
import { VEHICLE_TYPES } from '../../config/vehicleTypes';
import { createJob, uploadJobPhoto } from '../../services/jobs';
import { colors, radius, spacing } from '../../theme';
import type { CustomerStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CustomerStackParamList, 'RequestRepair'>;

// The shared VEHICLE_TYPES config carries an emoji `icon` (mirrored with the
// backend); the app renders its own icon set instead, keyed off the same type.
const VEHICLE_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  bicycle: 'bike',
  ebike: 'battery-charging',
  escooter: 'scooter',
  other: 'wrench',
};

export function RequestRepairScreen({ navigation }: Props) {
  const { api } = useAuth();
  const [vehicleType, setVehicleType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Allow photo access to attach an image.');
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!res.canceled) setPhotoUri(res.assets[0].uri);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Allow camera access to take a photo.');
    const res = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (!res.canceled) setPhotoUri(res.assets[0].uri);
  };

  const detectLocation = async () => {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Allow location access to share where you are.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch (e: any) {
      Alert.alert('Location error', e.message);
    } finally {
      setLocating(false);
    }
  };

  const onSubmit = async () => {
    if (!vehicleType) return Alert.alert('Pick a vehicle', 'Select what needs fixing.');
    if (!description.trim()) return Alert.alert('Describe the problem', 'Tell us what’s wrong.');

    setSubmitting(true);
    try {
      // Upload photo to Supabase Storage first (optional; non-fatal on failure).
      let photoUrl: string | null = null;
      if (photoUri) {
        photoUrl = await uploadJobPhoto(photoUri);
        if (!photoUrl) {
          // Let the user decide whether to continue without the photo.
          const proceed = await new Promise<boolean>((resolve) =>
            Alert.alert('Photo upload failed', 'Submit the request without the photo?', [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Submit anyway', onPress: () => resolve(true) },
            ])
          );
          if (!proceed) {
            setSubmitting(false);
            return;
          }
        }
      }

      const job = await createJob(api, { vehicleType, description: description.trim(), photoUrl, location });
      // Replace so the back button returns to Home, not this form.
      navigation.replace('JobStatus', { jobId: job.id });
    } catch (e: any) {
      Alert.alert('Could not submit', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer scroll>
      <Text style={styles.label}>What needs fixing?</Text>
      <View style={styles.grid}>
        {VEHICLE_TYPES.map((vt) => {
          const selected = vehicleType === vt.key;
          return (
            <Pressable
              key={vt.key}
              onPress={() => setVehicleType(vt.key)}
              style={[styles.vehicleCard, selected && styles.vehicleCardSelected]}
            >
              <MaterialCommunityIcons
                name={VEHICLE_ICONS[vt.key] ?? 'wrench'}
                size={28}
                color={selected ? colors.primaryBright : colors.muted}
              />
              <Text style={[styles.vehicleLabel, selected && styles.vehicleLabelSelected]}>{vt.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: spacing(2) }} />
      <TextField
        label="Describe the problem"
        value={description}
        onChangeText={setDescription}
        placeholder="e.g. Rear tire is flat and won't hold air"
        multiline
        numberOfLines={4}
        style={styles.textArea}
      />

      <Text style={styles.label}>Photo (optional)</Text>
      {photoUri && <Image source={{ uri: photoUri }} style={styles.preview} />}
      <View style={styles.rowButtons}>
        <Button
          title="Camera"
          variant="secondary"
          icon={<Feather name="camera" size={16} color={colors.primaryBright} />}
          onPress={takePhoto}
          style={styles.halfBtn}
        />
        <Button
          title="Library"
          variant="secondary"
          icon={<Feather name="image" size={16} color={colors.primaryBright} />}
          onPress={pickFromLibrary}
          style={styles.halfBtn}
        />
      </View>
      {photoUri && (
        <Button title="Remove photo" variant="ghost" onPress={() => setPhotoUri(null)} />
      )}

      <Text style={styles.label}>Your location</Text>
      <Card style={styles.locationCard}>
        {location ? (
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={14} color={colors.text} />
            <Text style={styles.locationText}>
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </Text>
          </View>
        ) : (
          <Text style={styles.locationMuted}>Not attached yet</Text>
        )}
        <Button
          title={location ? 'Update location' : 'Use my current location'}
          variant="secondary"
          loading={locating}
          onPress={detectLocation}
        />
      </Card>

      <View style={{ height: spacing(2) }} />
      <Button title="Submit Request" onPress={onSubmit} loading={submitting} />
      {submitting && <ActivityIndicator style={{ marginTop: spacing(1) }} color={colors.primaryBright} />}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: spacing(1.5), marginBottom: spacing(1), textTransform: 'uppercase', letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1.5) },
  vehicleCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing(2),
    alignItems: 'center',
  },
  vehicleCardSelected: { borderColor: colors.primaryBright, backgroundColor: colors.primary + '1A' },
  vehicleLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: spacing(1) },
  vehicleLabelSelected: { color: colors.primaryBright },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  preview: { width: '100%', height: 200, borderRadius: radius.md, marginBottom: spacing(1) },
  rowButtons: { flexDirection: 'row', gap: spacing(1.5) },
  halfBtn: { flex: 1 },
  locationCard: { padding: spacing(2) },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(0.75) },
  locationText: { fontSize: 15, color: colors.text, fontWeight: '600' },
  locationMuted: { fontSize: 15, color: colors.muted },
});
