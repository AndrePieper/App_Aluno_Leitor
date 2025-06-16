import React, { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import moment from 'moment-timezone';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Leitor({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [scanned, setScanned] = useState(false);
  const [idAluno, setIdAluno] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    (async () => {
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus !== 'granted') {
        Alert.alert('Permissão de localização negada');
        return;
      }

      const id = await AsyncStorage.getItem('@id_aluno');
      const savedToken = await AsyncStorage.getItem('@token');
      setIdAluno(id);
      setToken(savedToken);
    })();
  }, []);

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);

    let qrData;
    try {
      qrData = JSON.parse(data);
    } catch {
      Alert.alert('QR Code inválido!');
      setScanned(false);
      return;
    }

    if (!qrData.id) {
      Alert.alert('QR Code inválido!');
      setScanned(false);
      return;
    }

    const id_chamada = qrData.id;
    const hora_post = moment().tz('America/Cuiaba').toISOString();

    let coords = { latitude: null, longitude: null };
    try {
      const location = await Location.getCurrentPositionAsync({});
      coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (err) {
      Alert.alert('Erro ao obter localização', err.message);
    }

    const payload = {
      id_aluno: idAluno,
      id_chamada,
      hora_post,
      lat_aluno: coords.latitude,
      long_aluno: coords.longitude,
    };

    try {
      const response = await fetch('https://projeto-iii-4.vercel.app/chamada/alunos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      if (response.ok) {
        Alert.alert('Sucesso', 'Chamada registrada!');
        navigation.navigate('Home');
      } else {
        Alert.alert('Erro ao registrar chamada', responseText);
        setScanned(false);
      }
    } catch (erro) {
      Alert.alert('Erro', `QR inválido ou erro de rede: ${erro.message}`);
      setScanned(false);
    }
  };

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Precisamos de permissão para usar a câmera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.botaoPadrao}>
          <Text style={styles.botaoPadraoTexto}>Conceder permissão</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        onBarCodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      >

      </CameraView>

      {/* Máscara e instrução */}
      <View style={styles.maskContainer}>
        <View style={styles.maskTop} />
        <View style={styles.maskCenter}>
          <View style={styles.maskSide} />
          <View style={styles.scanArea} />
          <View style={styles.maskSide} />
        </View>
        <View style={styles.maskBottom}>
          <Text style={styles.instrucao}>Aponte para o QR Code</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.botaoPadrao} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.botaoPadraoTexto}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  maskContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  maskTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  maskCenter: {
    flexDirection: 'row',
  },
  maskSide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#000000',
  },
  maskBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instrucao: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  botaoPadrao: {
    backgroundColor: '#00913D',
    alignItems: 'center',
    padding: 15,
    margin: 20,
    borderRadius: 5,
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
  },
  botaoPadraoTexto: {
    color: '#fff',
    fontSize: 18,
  },
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  camera: { flex: 1, width: '100%' },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#00000080',
    padding: 12,
    borderRadius: 8,
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
  message: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
});
