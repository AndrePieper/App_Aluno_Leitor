import React, { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';

export default function Leitor({ navigation }) {
  const qrCodeLock = useRef(false);
  const lastReadTime = useRef(0);
  const apiResponseReceived = useRef(true);

  const [idAluno, setIdAluno] = useState('');
  const [token, setToken] = useState('');
  const [permission, requestPermission] = useCameraPermissions();

  // Guarda coords atualizadas (pega uma vez no início)
  const [coords, setCoords] = useState({ latitude: null, longitude: null });

  // Estados para mensagem no topo
  const [mensagem, setMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] = useState('sucesso');
  const [mostrarMensagem, setMostrarMensagem] = useState(false);

  // Animação fade da mensagem
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      // Permissão localização
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus !== 'granted') {
        mostrarMensagemFunc('Permissão de localização negada', 'erro');
        return;
      }
      // Pega coords uma vez
      try {
        const location = await Location.getCurrentPositionAsync({});
        setCoords({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (err) {
        mostrarMensagemFunc('Erro ao obter localização inicial: ' + err.message, 'erro');
      }

      // Busca id e token
      const id = await AsyncStorage.getItem('@id_aluno');
      const savedToken = await AsyncStorage.getItem('@token');
      setIdAluno(id);
      setToken(savedToken);
    })();
  }, []);

  function mostrarMensagemFunc(texto, tipo = 'sucesso') {
    setMensagem(texto);
    setTipoMensagem(tipo);
    setMostrarMensagem(true);
    fadeAnim.setValue(1);

    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setMostrarMensagem(false);
      });
    }, 5000);
  }

  async function handleQRCodeRead(data) {
    let qrData;
    try {
      qrData = JSON.parse(data);
    } catch {
      mostrarMensagemFunc('QR Code inválido!', 'erro');
      liberarLeitura();
      return;
    }

    if (!qrData.id || !qrData.hora_post || !qrData.lat || !qrData.long) {
      mostrarMensagemFunc('QR Code incompleto ou inválido!', 'erro');
      liberarLeitura();
      return;
    }

    if (!coords.latitude || !coords.longitude) {
      mostrarMensagemFunc('Aguardando localização...', 'erro');
      liberarLeitura();
      return;
    }

    const payload = {
      id_aluno: Number(idAluno),
      id_chamada: qrData.id,
      hora_post: qrData.hora_post,
      lat_professor: qrData.lat,
      long_professor: qrData.long,
      lat_aluno: coords.latitude,
      long_aluno: coords.longitude,
    };

    console.log('Enviando payload:', payload);

    apiResponseReceived.current = false;

    try {
      const response = await fetch('https://projeto-iii-4.vercel.app/chamada/alunos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

const json = await response.json();

if (response.ok) {
 mostrarMensagemFunc(json.message || 'Chamada registrada com sucesso!', 'sucesso');

apiResponseReceived.current = false;

setTimeout(() => {
  navigation.navigate('Home');
  apiResponseReceived.current = true;
}, 3000); 
} else {
  mostrarMensagemFunc(json.message || 'Erro ao registrar chamada', 'erro');
}


    } catch (erro) {
      mostrarMensagemFunc(`Erro de rede ou QR inválido: ${erro.message}`, 'erro');
    } finally {
      apiResponseReceived.current = true;
      liberarLeitura();
    }
  }

  function liberarLeitura() {
    qrCodeLock.current = false;
    lastReadTime.current = Date.now();
  }

  if (!permission?.granted) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  function podeLerQRCode() {
    const agora = Date.now();
    const passou3s = agora - lastReadTime.current >= 3000;
    const passou10s = agora - lastReadTime.current >= 10000;

    return (
      !qrCodeLock.current &&
      passou3s &&
      (apiResponseReceived.current || passou10s)
    );
  }

  return (
    <View style={styles.modalContainer}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => {
          if (data && podeLerQRCode()) {
            qrCodeLock.current = true;
            lastReadTime.current = Date.now();
            handleQRCodeRead(data);
          }
        }}
      />

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

      <TouchableOpacity
        style={styles.botaoPadrao}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.botaoPadraoTexto}>Voltar</Text>
      </TouchableOpacity>

      {mostrarMensagem && (
        <Animated.View
          style={[
            styles.mensagemContainer,
            {
              backgroundColor: tipoMensagem === 'erro' ? '#D32F2F' : '#388E3C',
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.mensagemTexto}>{mensagem}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
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
    borderColor: '#000',
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
mensagemContainer: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  paddingTop: 40,
  paddingBottom: 20,
  paddingHorizontal: 20,
  backgroundColor: '#388E3C',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10,
  elevation: 4,
},
mensagemTexto: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 16,
  textAlign: 'center',
},


});
