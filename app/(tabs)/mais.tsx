// app/(tabs)/mais.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import PinInput from '../../components/PinInput';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface SettingRowProps {
  icon: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  colors: any;
  danger?: boolean;
}

function SettingRow({
  icon,
  label,
  sublabel,
  onPress,
  right,
  colors,
  danger = false,
}: SettingRowProps) {
  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.divider }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View style={[styles.rowIcon, { backgroundColor: (danger ? Colors.error : Colors.primary) + '18' }]}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: danger ? Colors.error : colors.text }]}>
          {label}
        </Text>
        {sublabel && (
          <Text style={[styles.rowSublabel, { color: colors.textMuted }]}>{sublabel}</Text>
        )}
      </View>
      {right ?? (
        onPress && (
          <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
        )
      )}
    </TouchableOpacity>
  );
}

function SectionHeader({ label, colors }: { label: string; colors: any }) {
  return (
    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{label}</Text>
  );
}

export default function MaisScreen() {
  const { user, logout, updatePin } = useAuth();
  const { colors, isDark, mode, setMode } = useTheme();
  const router = useRouter();

  const [changePinVisible, setChangePinVisible] = useState(false);
  const [changePinStep, setChangePinStep] = useState<'current' | 'new' | 'confirm'>('current');
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleThemeSelect = useCallback(
    (selected: ThemeMode) => {
      setMode(selected);
    },
    [setMode],
  );

  const handleLogout = () => {
    Alert.alert(
      'Sair do app',
      'O app será bloqueado e você precisará do PIN para acessar novamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => logout(),
        },
      ],
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Apagar todos os dados',
      'Isso irá apagar permanentemente todo o seu progresso, questões respondidas e histórico. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar tudo',
          style: 'destructive',
          onPress: () => router.push('/(auth)/reset-pin'),
        },
      ],
    );
  };

  const openChangePinModal = () => {
    setChangePinStep('current');
    setCurrentPinInput('');
    setNewPinInput('');
    setPinError(null);
    setChangePinVisible(true);
  };

  const handleChangePinCurrent = async (pin: string) => {
    setCurrentPinInput(pin);
    setPinError(null);
    setChangePinStep('new');
  };

  const handleChangePinNew = (pin: string) => {
    setNewPinInput(pin);
    setPinError(null);
    setChangePinStep('confirm');
  };

  const handleChangePinConfirm = async (pin: string) => {
    if (pin !== newPinInput) {
      setPinError('Os PINs não coincidem. Tente novamente.');
      setChangePinStep('new');
      setNewPinInput('');
      return;
    }
    const success = await updatePin(currentPinInput, pin);
    if (success) {
      setChangePinVisible(false);
      Alert.alert('PIN alterado!', 'Seu novo PIN foi salvo com sucesso.');
    } else {
      setPinError('PIN atual incorreto. Tente novamente.');
      setChangePinStep('current');
      setCurrentPinInput('');
      setNewPinInput('');
    }
  };

  const themeOptions: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: 'Claro', icon: '☀️' },
    { value: 'dark', label: 'Escuro', icon: '🌙' },
    { value: 'system', label: 'Sistema', icon: '📱' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View
          style={[
            styles.profileCard,
            { backgroundColor: Colors.primary },
          ]}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.nome ? user.nome[0].toUpperCase() : 'E'}
            </Text>
          </View>
          <View>
            <Text style={styles.profileName}>{user?.nome ?? 'Estudante ENEM'}</Text>
            <Text style={styles.profileSub}>
              Membro desde {user?.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear()}
            </Text>
          </View>
        </View>

        {/* Appearance */}
        <SectionHeader label="APARÊNCIA" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.themeRow}>
            {themeOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor:
                      mode === opt.value ? Colors.primary : colors.bgInput,
                    borderColor:
                      mode === opt.value ? Colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleThemeSelect(opt.value)}
              >
                <Text style={{ fontSize: 18 }}>{opt.icon}</Text>
                <Text
                  style={[
                    styles.themeLabel,
                    { color: mode === opt.value ? '#fff' : colors.text },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notifications */}
        <SectionHeader label="NOTIFICAÇÕES" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <SettingRow
            icon="🔔"
            label="Lembretes de estudo"
            sublabel="Receba alertas diários para estudar"
            colors={colors}
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.bgInput, true: Colors.primary }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {/* Study Settings */}
        <SectionHeader label="ESTUDOS" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <SettingRow
            icon="🎯"
            label="Metas diárias"
            sublabel="Configurar questões e minutos por dia"
            colors={colors}
            onPress={() => Alert.alert('Em breve', 'Esta funcionalidade estará disponível em breve.')}
          />
          <SettingRow
            icon="📅"
            label="Data da prova"
            sublabel="Defina sua data do ENEM"
            colors={colors}
            onPress={() => Alert.alert('Em breve', 'Esta funcionalidade estará disponível em breve.')}
          />
          <SettingRow
            icon="📊"
            label="Nível atual"
            sublabel="Iniciante · Intermediário · Avançado"
            colors={colors}
            onPress={() => Alert.alert('Em breve', 'Esta funcionalidade estará disponível em breve.')}
          />
        </View>

        {/* Security */}
        <SectionHeader label="SEGURANÇA" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <SettingRow
            icon="🔑"
            label="Alterar PIN"
            sublabel="Trocar o PIN de acesso ao app"
            colors={colors}
            onPress={openChangePinModal}
          />
          <SettingRow
            icon="🔒"
            label="Sair e bloquear"
            sublabel="Bloqueia o app até próximo PIN"
            colors={colors}
            onPress={handleLogout}
          />
        </View>

        {/* About */}
        <SectionHeader label="SOBRE" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <SettingRow
            icon="ℹ️"
            label="Versão do app"
            sublabel="ENEM Prep v1.0.0"
            colors={colors}
          />
          <SettingRow
            icon="📄"
            label="Termos de uso"
            colors={colors}
            onPress={() => Alert.alert('Termos de uso', 'Disponível em breve.')}
          />
          <SettingRow
            icon="🔐"
            label="Privacidade"
            sublabel="Todos os dados ficam no seu dispositivo"
            colors={colors}
          />
        </View>

        {/* Danger Zone */}
        <SectionHeader label="ZONA DE PERIGO" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <SettingRow
            icon="🗑️"
            label="Apagar todos os dados"
            sublabel="Remove todo o progresso permanentemente"
            colors={colors}
            onPress={handleClearData}
            danger
          />
        </View>

        <Text style={[styles.footer, { color: colors.textMuted }]}>
          ENEM Prep · Feito para você ir além 🚀
        </Text>
      </ScrollView>

      {/* Change PIN Modal */}
      <Modal
        visible={changePinVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setChangePinVisible(false)}
      >
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: colors.bg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setChangePinVisible(false)}>
              <Text style={[styles.modalClose, { color: Colors.primary }]}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Alterar PIN</Text>
            <View style={{ width: 64 }} />
          </View>

          <View style={styles.modalContent}>
            {changePinStep === 'current' && (
              <PinInput
                length={6}
                onComplete={handleChangePinCurrent}
                error={pinError}
                title="PIN atual"
                subtitle="Digite seu PIN atual para continuar"
              />
            )}
            {changePinStep === 'new' && (
              <PinInput
                length={6}
                onComplete={handleChangePinNew}
                error={pinError}
                title="Novo PIN"
                subtitle="Escolha um novo PIN de 6 dígitos"
              />
            )}
            {changePinStep === 'confirm' && (
              <PinInput
                length={6}
                onComplete={handleChangePinConfirm}
                error={pinError}
                title="Confirme o novo PIN"
                subtitle="Digite o novo PIN novamente"
              />
            )}

            {/* Step indicator */}
            <View style={styles.stepRow}>
              {(['current', 'new', 'confirm'] as const).map((s, i) => (
                <View
                  key={s}
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor:
                        s === changePinStep
                          ? Colors.primary
                          : ['current', 'new', 'confirm'].indexOf(changePinStep) > i
                            ? Colors.success
                            : colors.bgInput,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    padding: Spacing.base,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.xs,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '900',
    color: '#fff',
  },
  profileName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: '#fff',
  },
  profileSub: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.sm,
    borderBottomWidth: 0.5,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
  },
  rowSublabel: {
    fontSize: Typography.fontSize.xs,
    marginTop: 1,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
  },
  themeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.base,
  },
  themeOption: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  themeLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing.xl,
  },
  // Modal styles
  modalSafe: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
  },
  modalClose: {
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
    width: 64,
  },
  modalTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing['2xl'],
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});